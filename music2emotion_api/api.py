from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from music2emo import Music2emo
import torch
import os
import tempfile
from pydub import AudioSegment
import logging
import aiohttp
import aiofiles
from typing import Optional
from deezer import Client
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor
import numpy as np


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Thread pool for CPU-intensive operations
executor = ThreadPoolExecutor(max_workers=2)

# Global variables
music2emo_model = None


def get_preview_url(song_title: str, artist_name: str) -> Optional[str]:
    """
    Search and returns the song's preview URL from Deezer (if available).
    Returns: preview_url
    """
    try:
        client = Client()
        query = f"{song_title} by {artist_name}"
        logger.info(f"🔎 Searching Deezer for: {query}")
        results = client.search(query)
        
        if not results:
            logger.warning(f"⚠️ No results found on Deezer for: {query}")
            return None
        
        # Get the first matching track's previewURL
        preview_url = results[0].preview

        if not preview_url:
            logger.warning(f"⚠️ No preview URL found for: {query}")
            return None
        
        logger.info(f"✅ Found preview URL for: {query}")
        return preview_url

    except Exception as e:
        logger.error(f"❌ Error occurred while searching Deezer: {e}")
        return None


async def download_mp3_preview(preview_url: str) -> str:
    """Downloads MP3 preview URL."""
    try:
        # Add headers to mimic a browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'audio/*,*/*;q=0.1',
            'Accept-Language': 'en-US,en;q=0.9',
        }

        logger.info(f"🔽 Downloading MP3 preview from: {preview_url}")

        # Use aiohttp for async download
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=20)) as session:
            async with session.get(preview_url, headers=headers) as response:
                logger.info(f"📊 Response status: {response.status}")
                
                if response.status != 200:
                    raise HTTPException(status_code=400, detail=f"Failed to download audio: HTTP {response.status}")
                
                # Create temporary file for the downloaded MP3
                temp_mp3 = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
                temp_mp3_path = temp_mp3.name
                
                # Stream download in chunks
                async with aiofiles.open(temp_mp3_path, 'wb') as f:
                    async for chunk in response.content.iter_chunked(8192):
                        await f.write(chunk)
                
                temp_mp3.close()
        
        logger.info(f"⏱️ MP3 download completed")
        
        return temp_mp3_path
    
    except aiohttp.ClientError as e:
        logger.error(f"❌ Failed to download MP3: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to download audio from URL: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Failed to process MP3: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process audio: {str(e)}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global music2emo_model

    # Start up music2emo_model
    try:
        logger.info("🚀 Starting up and loading the Music2emo model...")
        torch.set_default_dtype(torch.float32)
        # torch.set_num_threads(2)
        torch.set_grad_enabled(False)
        
        # Initialize Music2emo model (it handles safe globals internally)
        music2emo_model = Music2emo(model_weights="saved_models/J_all.ckpt")

        # Warm up the model with a dummy prediction to compile torch operations
        try:
            dummy_audio = AudioSegment.silent(duration=1000)
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_file:
                dummy_audio.export(temp_file.name, format="mp3")
                logger.info("🔥 Warming up model...")
                music2emo_model.predict(temp_file.name)
                os.unlink(temp_file.name)
                logger.info("✅ Model warmed up successfully")
        except Exception as e:
            logger.error(f"❌ Model warm-up failed: {e}")
        logger.info("✅ Music2emo model loaded successfully")

    except Exception as e:
        logger.critical(f"❌ Failed to load Music2emo model: {e}")
        raise RuntimeError("Failed to load Music2emo model") from e

    yield
    
    logger.info("🛑 Shutting down...")
    executor.shutdown(wait=True)
    logger.info("✅ Shutdown complete")


app = FastAPI(title="Vibeline's Music2Emotion API", version="1.0.0", lifespan=lifespan)

# Only allow your Vercel frontend
origins = [
    "https://vibelines.vercel.app",
    "https://vibelines.vercel.app/callback",  # Include callback URL if needed
    "https://vibelines.vercel.app/loading",
    "http://127.0.0.1:3000"  # For local testing purposes
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Vibeline's Music2Emotion API is running", "status": "healthy"}

@app.get("/device-info")
async def device_info():
    """Get information about the current device being used"""
    global music2emo_model
    
    device_info = {
        "cuda_available": torch.cuda.is_available(),
        "mps_available": torch.backends.mps.is_available(),
        "device_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
    }
    
    if torch.cuda.is_available():
        device_info["cuda_device_name"] = torch.cuda.get_device_name()
        device_info["cuda_memory_allocated"] = torch.cuda.memory_allocated()
        device_info["cuda_memory_reserved"] = torch.cuda.memory_reserved()
    
    if music2emo_model is not None:
        device_info["model_device"] = str(music2emo_model.device)
    else:
        device_info["model_device"] = "Model not loaded"
    
    return device_info

@app.post("/analyse&predict/{song_title}/{artist_name}")
async def analyse_and_predict(song_title: str, artist_name: str) -> dict:
    """
    Receives song_title and artist_name, searches Deezer for the song's preview URL,
    downloads the preview, and returns the analysis results.
    Returns: Analysis results as a dictionary.
    """
    global music2emo_model
    if music2emo_model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded yet. Please try again later.")

    mp3_file = None  # Initialize mp3_file to avoid UnboundLocalError
    
    try:
        preview_url = get_preview_url(song_title, artist_name)
        if not preview_url:
            return {"predicted_moods": None}

        # Download the MP3 preview
        mp3_file = await download_mp3_preview(preview_url)
        if not mp3_file:
            return {"predicted_moods": None}

        # Analyze the MP3 and get predictions
        logger.info(f"🎵 Analyzing and predicting moods for '{song_title}' by '{artist_name}'")
        analysis_results = music2emo_model.predict(mp3_file).get("predicted_moods", ["unknown"])
        logger.info(f"✅ Analysis complete: {analysis_results}")
        cleaned_predicted_moods = [mood for mood in analysis_results if mood != 'christmas'] # model tend to indicate christmas as a mood even with a non-christmas song
        return {"predicted_moods": cleaned_predicted_moods}

    except Exception as e:
        logger.error(f"❌ Failed to analyze and predict '{song_title}' by '{artist_name}': {e}")
        return {"predicted_moods": None}
    
    finally:
        # Clean up temporary file
        if mp3_file and os.path.exists(mp3_file):
            try:
                os.unlink(mp3_file)
                logger.info("🧹 Temporary audio file cleaned up")
            except Exception as e:
                logger.warning(f"Failed to clean up temporary file: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=False,
        workers=1,  
        loop="asyncio"
    )