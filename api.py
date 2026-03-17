"""
GEOSIS – api.py
Flask backend that connects React dashboard to the AI model.
Run with: python api.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import librosa
import io
import os
import json
import tensorflow as tf
import joblib

app = Flask(__name__)
CORS(app)  # allows React frontend to call this API

# ── Load model once at startup ────────────────────────────────────────────────
print("Loading GEOSIS model...")

MODEL      = tf.keras.models.load_model("saved_model/best_model.keras")
SVM        = joblib.load("saved_model/svm_fallback.pkl")
SCALER     = joblib.load("saved_model/svm_scaler.pkl")

with open("saved_model/model_config.json") as f:
    CONFIG = json.load(f)

print("Model loaded successfully!")

# ── Constants ─────────────────────────────────────────────────────────────────
SAMPLE_RATE = 22050
DURATION    = 2
N_MELS      = 64
HOP         = 512
N_FFT       = 2048
TARGET      = (64, 87)

# ── Helpers ───────────────────────────────────────────────────────────────────

def extract_mel(signal, sr=SAMPLE_RATE):
    target_len = DURATION * sr
    if len(signal) < target_len:
        signal = np.pad(signal, (0, target_len - len(signal)))
    else:
        signal = signal[:target_len]

    mel    = librosa.feature.melspectrogram(
                y=signal, sr=sr,
                n_mels=N_MELS, n_fft=N_FFT, hop_length=HOP)
    mel_db = librosa.power_to_db(mel, ref=np.max)

    if mel_db.shape != TARGET:
        mel_db = tf.image.resize(
            mel_db[..., np.newaxis], TARGET).numpy().squeeze()

    mel_db = (mel_db - mel_db.min()) / (mel_db.max() - mel_db.min() + 1e-9)
    return mel_db

def run_prediction(signal, sr=SAMPLE_RATE):
    # CNN prediction
    mel  = extract_mel(signal, sr)
    mel  = mel[np.newaxis, ..., np.newaxis]
    prob = float(MODEL.predict(mel, verbose=0)[0][0])

    # If CNN is uncertain (between 0.4 and 0.6), use SVM as fallback
    if 0.4 <= prob <= 0.6:
        from scipy.fft import fft, fftfreq
        import pywt
        N      = len(signal)
        freqs  = fftfreq(N, d=1/sr)[:N//2]
        mag    = np.abs(fft(signal))[:N//2]
        idx    = np.argsort(mag)[-3:][::-1]
        coeffs = pywt.wavedec(signal, "db4", level=4)
        energies = [np.sum(c**2) for c in coeffs]
        features = np.array([
            freqs[idx[0]], freqs[idx[1]], freqs[idx[2]],
            mag[idx[0]],
            energies[0], energies[1], energies[2], energies[3],
            0, 0, 0, 0, 0
        ]).reshape(1, -1)[:, :13]
        features = SCALER.transform(features)
        svm_pred = SVM.predict(features)[0]
        svm_prob = SVM.predict_proba(features)[0]
        prob     = float(svm_prob[1])
        source   = "SVM"
    else:
        source = "CNN"

    label = "CRACKED" if prob >= 0.5 else "NORMAL"
    return {
        "label":        label,
        "confidence":   round((prob if prob >= 0.5 else 1 - prob) * 100, 2),
        "wear_percent": round(prob * 100, 2),
        "alert":        prob >= 0.80,
        "source":       source
    }

# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "GEOSIS API is running",
        "endpoints": {
            "POST /predict/file":   "Upload a .wav file",
            "POST /predict/dummy":  "Test with dummy data",
            "GET  /health":         "Health check"
        }
    })

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "loaded"})


@app.route("/predict/file", methods=["POST"])
def predict_file():
    """
    Accepts a .wav file upload from the React dashboard.
    
    React usage:
        const formData = new FormData()
        formData.append('audio', audioFile)
        const res = await fetch('http://localhost:5000/predict/file', {
            method: 'POST',
            body: formData
        })
        const result = await res.json()
    """
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    file = request.files["audio"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    try:
        audio_bytes = file.read()
        signal, sr  = librosa.load(io.BytesIO(audio_bytes), sr=SAMPLE_RATE, mono=True)
        result      = run_prediction(signal, sr)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict/dummy", methods=["POST"])
def predict_dummy():
    """
    Test endpoint - generates fake sensor data and runs prediction.
    No file needed.

    React usage:
        const res = await fetch('http://localhost:5000/predict/dummy', {
            method: 'POST'
        })
        const result = await res.json()
    """
    try:
        # Randomly generate normal or cracked signal
        rng = np.random.default_rng()
        t   = np.linspace(0, DURATION, int(SAMPLE_RATE * DURATION))
        sig = 0.5 * np.sin(2 * np.pi * 120 * t)
        sig += 0.2 * np.sin(2 * np.pi * 240 * t)

        is_cracked = rng.random() > 0.5
        if is_cracked:
            sig += 0.15 * rng.standard_normal(len(t))
            for spike_t in np.arange(0.1, DURATION, 0.3):
                idx = int(spike_t * SAMPLE_RATE)
                w   = int(0.005 * SAMPLE_RATE)
                if idx + w < len(sig):
                    sig[idx:idx+w] += rng.standard_normal(w) * 2.0
        else:
            sig += 0.05 * rng.standard_normal(len(t))

        result = run_prediction(sig, SAMPLE_RATE)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict/stream", methods=["POST"])
def predict_stream():
    """
    Accepts raw JSON audio array from React (for mic streaming).

    React usage:
        const res = await fetch('http://localhost:5000/predict/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ samples: audioArray, sr: 22050 })
        })
        const result = await res.json()
    """
    try:
        data   = request.get_json()
        signal = np.array(data["samples"], dtype=np.float32)
        sr     = int(data.get("sr", SAMPLE_RATE))
        result = run_prediction(signal, sr)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\nGEOSIS API running at http://localhost:5000")
    print("Press Ctrl+C to stop\n")
    app.run(debug=True, host="0.0.0.0", port=5000)
