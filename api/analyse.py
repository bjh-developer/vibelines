# api/analyse.py
import os, json, re, time
from datetime import datetime
from typing import Dict, List, Tuple

from flask import Flask, request, jsonify, Response
import lyricsgenius, pandas as pd
from langdetect import detect
from nltk.sentiment import SentimentIntensityAnalyzer
from transformers import pipeline
from supabase import create_client, Client

# ───── Environment / heavy objects
SUPABASE: Client = create_client(os.environ["SUPABASE_URL"],
                                 os.environ["SUPABASE_SERVICE_KEY"])
GENIUS = lyricsgenius.Genius(os.environ["GENIUS_ACCESS_TOKEN"],
                             timeout=5, retries=1, remove_section_headers=True)
VADER  = SentimentIntensityAnalyzer()

EMO_EN  = pipeline("text-classification",
                   model="j-hartmann/emotion-english-distilroberta-base",
                   framework="pt", top_k=None)
EMO_XLM = pipeline("sentiment-analysis",
                   model="cardiffnlp/twitter-xlm-roberta-base-sentiment",
                   framework="pt", top_k=None, truncation=True)

TAG_RE, SPACE_RE = re.compile(r"\[.*?]"), re.compile(r"\s+")

# ───── Helpers
def clean(t: str) -> str:
    return SPACE_RE.sub(" ", TAG_RE.sub(" ", t)).strip()

def cache_get(track_id: str):
    d = SUPABASE.table("lyrics_cache").select("*").eq("track_id", track_id).execute()
    return d.data[0] if d.data else None

def cache_set(track_id, lyrics, lang, val, eng):
    SUPABASE.table("lyrics_cache").upsert({
        "track_id": track_id,
        "lyrics":   lyrics[:10_000],
        "lang":     lang,
        "valence":  val,
        "energy":   eng,
        "updated_at": datetime.utcnow().isoformat()
    }).execute()

def score_en(txt: str) -> Tuple[float,float]:
    emo = {e["label"]: e["score"] for e in EMO_EN(txt)[0]}
    va  = VADER.polarity_scores(txt)
    val = 0.6*va["compound"] + 0.4*(emo.get("joy",0)-emo.get("sadness",0))
    eng = emo.get("anger",0)+emo.get("surprise",0)
    return round(val,3), round(eng,3)

def score_multi(txt: str) -> Tuple[float,float]:
    res = {r["label"]: r["score"] for r in EMO_XLM(txt)[0]}
    return round(res.get("POS",0)-res.get("NEG",0),3), round(res.get("NEG",0),3)

# ───── Flask app
app = Flask(__name__)

@app.post("/analyse")
def analyse():
    try:
        tracks: List[Dict] = request.json["tracks"]
    except Exception:
        return jsonify(error="Invalid JSON"), 400

    enriched: List[Dict] = []
    for t in tracks:
        tid = t["id"]

        c = cache_get(tid)
        if c:
            enriched.append({**t, "valence": c["valence"], "energy": c["energy"]})
            continue

        try:
            song = GENIUS.search_song(t["name"], t["artists"].split(",")[0])
        except Exception:
            continue
        if not song or not song.lyrics:
            continue

        txt  = clean(song.lyrics)
        lang = detect(txt[:200])
        val, eng = score_en(txt) if lang=="en" else score_multi(txt)
        cache_set(tid, song.lyrics, lang, val, eng)
        enriched.append({**t, "valence": val, "energy": eng})
        time.sleep(0.2)           # Genius 10 req/min

    if enriched:
        df = pd.DataFrame(enriched)
        df["week"] = pd.to_datetime(df["added_at"]).dt.to_period("W").astype(str)
        timeline = (df.groupby("week")[["valence","energy"]]
                      .mean().reset_index().to_dict(orient="records"))
    else:
        timeline = []

    return jsonify(timeline=timeline, tracks=enriched)

# ───── WSGI adapter for Vercel
def handler(environ, start_response):
    return app.wsgi_app(environ, start_response)
