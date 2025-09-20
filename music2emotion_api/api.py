"""
Vibeline's Music2Emotion API

A FastAPI application that provides music emotion analysis using the Music2emo model.
This API searches for song previews on Deezer and analyses their emotional content.

Author: Joon Hao
Version: 1.0.0
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
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
import dotenv

# Load environment variables
dotenv.load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Thread pool for CPU-intensive operations
executor = ThreadPoolExecutor()

# Global variables
music2emo_model = None


def get_preview_url(song_title: str, artist_name: str) -> Optional[str]:
    """
    Search for a song on Deezer and return its preview URL.
    
    Args:
        song_title (str): The title of the song to search for
        artist_name (str): The name of the artist
        
    Returns:
        Optional[str]: The preview URL if found, None otherwise
        
    Raises:
        Exception: If there's an error during the Deezer search
    """
    try:
        client = Client()
        query = f"{song_title} by {artist_name}"
        logger.info(f"🔎 Searching Deezer for: {query}")
        
        results = client.search(query)
        
        if not results:
            logger.warning(f"⚠️ No results found on Deezer for: {query}")
            return None
        
        # Get the first matching track's preview URL
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
    """
    Download an MP3 preview from a given URL.
    
    Args:
        preview_url (str): The URL of the MP3 preview to download
        
    Returns:
        str: Path to the downloaded temporary MP3 file
        
    Raises:
        HTTPException: If the download fails or returns non-200 status
        aiohttp.ClientError: If there's a network error during download
    """
    try:
        # Headers to mimic a browser request and avoid blocking
        headers = {
            'User-Agent': (
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                'AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/91.0.4472.124 Safari/537.36'
            ),
            'Accept': 'audio/*,*/*;q=0.1',
            'Accept-Language': 'en-US,en;q=0.9',
        }

        logger.info(f"🔽 Downloading MP3 preview from: {preview_url}")

        # Use aiohttp for async download with timeout
        timeout = aiohttp.ClientTimeout(total=20)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(preview_url, headers=headers) as response:
                logger.info(f"📊 Response status: {response.status}")
                
                if response.status != 200:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Failed to download audio: HTTP {response.status}"
                    )
                
                # Create temporary file for the downloaded MP3
                temp_mp3 = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
                temp_mp3_path = temp_mp3.name
                
                # Stream download in chunks to handle large files efficiently
                async with aiofiles.open(temp_mp3_path, 'wb') as f:
                    async for chunk in response.content.iter_chunked(8192):
                        await f.write(chunk)
                
                temp_mp3.close()
        
        logger.info(f"⏱️ MP3 download completed: {temp_mp3_path}")
        return temp_mp3_path
    
    except aiohttp.ClientError as e:
        logger.error(f"❌ Failed to download MP3: {e}")
        raise HTTPException(
            status_code=400, 
            detail=f"Failed to download audio from URL: {str(e)}"
        )
    except Exception as e:
        logger.error(f"❌ Failed to process MP3: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to process audio: {str(e)}"
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage the application lifespan - startup and shutdown procedures.
    
    This function handles:
    - Loading the Music2emo model on startup
    - Configuring PyTorch settings for optimal performance
    - Warming up the model with a dummy prediction
    - Cleaning up resources on shutdown
    
    Args:
        app (FastAPI): The FastAPI application instance
        
    Yields:
        None: Control to the application during its lifetime
        
    Raises:
        RuntimeError: If the model fails to load during startup
    """
    global music2emo_model

    # Startup procedures
    try:
        logger.info("🚀 Starting up and loading the Music2emo model...")
        
        # Configure PyTorch for optimal performance
        torch.set_default_dtype(torch.float32)
        # torch.set_num_threads(2)  # Uncomment if needed for CPU optimization
        torch.set_grad_enabled(False)  # Disable gradients for inference
        
        # Initialize Music2emo model with pre-trained weights
        music2emo_model = Music2emo(model_weights="saved_models/J_all.ckpt")

        # Warm up the model with a dummy prediction to compile torch operations
        try:
            dummy_audio = AudioSegment.silent(duration=1000)  # 1 second of silence
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

    # Yield control to the application
    yield
    
    # Shutdown procedures
    logger.info("🛑 Shutting down...")
    executor.shutdown(wait=True)
    logger.info("✅ Shutdown complete")


# Initialize FastAPI application
app = FastAPI(
    title="Vibeline's Music2Emotion API", 
    version="1.0.0", 
    description="API for analysing music emotions using AI models",
    lifespan=lifespan
)


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load API key from environment variables
API_KEY = os.getenv("M2E_API_KEY")

@app.middleware("http")
async def check_api_key(request: Request, call_next):
    """
    Middleware to check API key for protected endpoints.
    
    Allows health check and device info endpoints without API key validation.
    All other endpoints require a valid API key in the 'api-key' header.
    
    Args:
        request (Request): The incoming HTTP request
        call_next: The next middleware or route handler
        
    Returns:
        Response: The response from the next handler or an error response
        
    Raises:
        HTTPException: If API key is missing or invalid (403 Forbidden)
    """
    # Public endpoints that don't require API key
    public_endpoints = ["/", "/device-info"]
    
    if request.url.path in public_endpoints:
        return await call_next(request)
    
    # Check API key for protected endpoints
    api_key = request.headers.get("api-key")
    if not api_key or api_key != API_KEY:
        raise HTTPException(
            status_code=403, 
            detail="Forbidden: Invalid or missing API key"
        )
    
    return await call_next(request)


@app.get("/")
async def root():
    """
    Health check endpoint.
    
    Returns:
        dict: A simple health status message
    """
    return {
        "message": "Vibeline's Music2Emotion API is running", 
        "status": "healthy"
    }


@app.get("/device-info")
async def device_info():
    """
    Get information about the current device and model status.
    
    This endpoint provides details about:
    - CUDA availability and device information
    - MPS (Metal Performance Shaders) availability for Apple Silicon
    - Memory usage information
    - Current model device
    
    Returns:
        dict: Device and model information
    """
    global music2emo_model
    
    device_info = {
        "cuda_available": torch.cuda.is_available(),
        "mps_available": torch.backends.mps.is_available(),
        "device_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
    }
    
    # Add CUDA-specific information if available
    if torch.cuda.is_available():
        device_info.update({
            "cuda_device_name": torch.cuda.get_device_name(),
            "cuda_memory_allocated": torch.cuda.memory_allocated(),
            "cuda_memory_reserved": torch.cuda.memory_reserved()
        })
    
    # Add model device information
    if music2emo_model is not None:
        device_info["model_device"] = str(music2emo_model.device)
    else:
        device_info["model_device"] = "Model not loaded"
    
    return device_info


@app.post("/analyse&predict/{song_title}/{artist_name}")
async def analyse_and_predict(song_title: str, artist_name: str) -> dict:
    """
    Analyse and predict emotions for a given song.
    
    This endpoint:
    1. Searches for the song on Deezer using the provided title and artist
    2. Downloads the preview MP3 if available
    3. Analyses the audio using the Music2emo model
    4. Returns predicted emotional moods
    
    Args:
        song_title (str): The title of the song (forward slashes encoded as ___SLASH___)
        artist_name (str): The name of the artist (forward slashes encoded as ___SLASH___)
        
    Returns:
        dict: Dictionary containing 'predicted_moods' list or None if analysis fails
        
    Raises:
        HTTPException: If the model is not loaded (503 Service Unavailable)
        
    Note:
        The endpoint filters out 'christmas' mood predictions as the model
        tends to over-predict this mood for non-Christmas songs.
    """
    global music2emo_model
    
    # Check if model is loaded
    if music2emo_model is None:
        raise HTTPException(
            status_code=503, 
            detail="Model is not loaded yet. Please try again later."
        )

    # Decode URL-safe forward slash replacements
    song_title = song_title.replace('___SLASH___', '/')
    artist_name = artist_name.replace('___SLASH___', '/')
    logger.info(f"🎵 Processing: '{song_title}' by '{artist_name}'")

    mp3_file = None  # Initialize to avoid UnboundLocalError in finally block
    
    try:
        # Step 1: Search for preview URL on Deezer
        preview_url = get_preview_url(song_title, artist_name)
        if not preview_url:
            logger.warning(f"No preview URL found for '{song_title}' by '{artist_name}'")
            return {"predicted_moods": None}

        # Step 2: Download the MP3 preview
        mp3_file = await download_mp3_preview(preview_url)
        if not mp3_file:
            logger.warning(f"Failed to download preview for '{song_title}' by '{artist_name}'")
            return {"predicted_moods": None}

        # Step 3: Analyse the MP3 and get emotion predictions
        logger.info(f"🎵 Analysing emotions for '{song_title}' by '{artist_name}'")
        analysis_results = music2emo_model.predict(mp3_file).get("predicted_moods", ["unknown"])
        logger.info(f"✅ Analysis complete: {analysis_results}")
        
        # Step 4: Clean up predictions (remove problematic mood predictions)
        cleaned_predicted_moods = [
            mood for mood in analysis_results 
            if mood != 'christmas'  # Model tends to over-predict Christmas mood
        ]
        
        return {"predicted_moods": cleaned_predicted_moods}

    except Exception as e:
        logger.error(f"❌ Failed to analyse '{song_title}' by '{artist_name}': {e}")
        return {"predicted_moods": None}
    
    finally:
        # Clean up temporary files
        if mp3_file and os.path.exists(mp3_file):
            try:
                os.unlink(mp3_file)
                logger.info("🧹 Temporary audio file cleaned up")
            except Exception as cleanup_error:
                logger.warning(f"Failed to clean up temporary file: {cleanup_error}")


if __name__ == "__main__":
    """
    Run the FastAPI application using uvicorn server.
    
    Configuration:
    - Host: 0.0.0.0 (accessible from all network interfaces)
    - Port: 8000
    - Workers: 1 (single worker to avoid model loading conflicts)
    - Reload: False (disabled for production stability)
    - Loop: asyncio (event loop for async operations)
    """
    import uvicorn
    
    uvicorn.run(
        "api:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=False,
        workers=1,  # Single worker to prevent multiple model loading
        loop="asyncio"
    )