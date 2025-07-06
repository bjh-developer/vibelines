import os, json, re, time
from datetime import datetime
from http import HTTPStatus

import lyricsgenius
import pandas as pd
from langdetect import detect
from nltk.sentiment import SentimentIntensityAnalyzer
# import torch
# from transformers import pipeline
from supabase import create_client, Client
from typing import Dict, Tuple, List

GENIUS = lyricsgenius.Genius(
    os.environ["GENIUS_ACCESS_TOKEN"],
    timeout=5,
    retries=1,
    remove_section_headers=True,
)

song = GENIUS.search_song("If We Ever Broke Up", "Mae Stephens")
print(song.lyrics)