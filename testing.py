import os
import numpy as np
from essentia.standard import MonoLoader, TensorflowPredictMusiCNN, TensorflowPredict2D

AUDIO_FILE = "your_song.mp3"  # can be .wav or .mp3
MODEL_DIR = "/path/to/essentia-models"  # downloaded from MTG UPF's site

# 1. Load audio at 16kHz mono
audio = MonoLoader(filename=AUDIO_FILE, sampleRate=16000)()

# 2. Extract musicnn embeddings
embedding_extractor = TensorflowPredictMusiCNN(
    graphFilename=os.path.join(MODEL_DIR, "msd-musicnn-1.pb"),
    output="model/dense/BiasAdd",
    patchHopSize=93,
    patchSize=187,
)

embeddings = embedding_extractor(audio)

# 3. Load mood classifiers
tags = ["happy", "sad", "aggressive", "relaxed"]
results = {}

for tag in tags:
    model_path = os.path.join(MODEL_DIR, f"mood_{tag}-msd-musicnn-1.pb")
    classifier = TensorflowPredict2D(
        graphFilename=model_path,
        inputs=["input_1"],
        outputs=["final_score"],
    )
    mood_scores = classifier(embeddings)
    results[tag] = float(np.mean(mood_scores))

# 4. Print mood probabilities
print("🎵 Mood analysis of", AUDIO_FILE)
for tag, score in results.items():
    print(f" - {tag.title()}: {score:.2f}")
