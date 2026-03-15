"""
GEOSIS – predict.py
Plug this into your dashboard (Task 3).
Usage:
    from predict import load_geosis, predict_from_signal, predict_from_file
"""

import numpy as np
import tensorflow as tf
import librosa
import json, os

_model  = None
_config = None

def load_geosis(model_dir="saved_model"):
    global _model, _config
    _model  = tf.keras.models.load_model(os.path.join(model_dir, "best_model.keras"))
    with open(os.path.join(model_dir, "model_config.json")) as f:
        _config = json.load(f)
    return _model, _config

def _extract_mel(signal, sr=22050):
    SR, DUR    = sr, 2
    N_MELS, HOP, N_FFT = 64, 512, 2048
    TARGET     = (64, 87)
    target_len = DUR * SR
    if len(signal) < target_len:
        signal = np.pad(signal, (0, target_len - len(signal)))
    else:
        signal = signal[:target_len]
    mel    = librosa.feature.melspectrogram(y=signal, sr=SR,
                n_mels=N_MELS, n_fft=N_FFT, hop_length=HOP)
    mel_db = librosa.power_to_db(mel, ref=np.max)
    if mel_db.shape != TARGET:
        mel_db = tf.image.resize(mel_db[..., np.newaxis], TARGET).numpy().squeeze()
    mel_db = (mel_db - mel_db.min()) / (mel_db.max() - mel_db.min() + 1e-9)
    return mel_db

def predict_from_signal(signal, sr=22050):
    """Input: numpy array of audio. Output: dict."""
    if _model is None: load_geosis()
    mel  = _extract_mel(signal, sr)
    mel  = mel[np.newaxis, ..., np.newaxis]
    prob = float(_model.predict(mel, verbose=0)[0][0])
    return {
        "label":        "CRACKED" if prob >= 0.5 else "NORMAL",
        "confidence":   round((prob if prob >= 0.5 else 1 - prob) * 100, 2),
        "wear_percent": round(prob * 100, 2),
        "alert":        prob >= 0.80
    }

def predict_from_file(wav_path):
    """Input: path to .wav file. Output: dict."""
    signal, sr = librosa.load(wav_path, sr=22050, mono=True)
    return predict_from_signal(signal, sr)

if __name__ == "__main__":
    load_geosis()
    import sounddevice as sd
    print("🎙️  Recording 2 seconds from mic...")
    audio = sd.rec(int(2 * 22050), samplerate=22050, channels=1, dtype="float32")
    sd.wait()
    result = predict_from_signal(audio.flatten())
    print(f"Result: {result}")
