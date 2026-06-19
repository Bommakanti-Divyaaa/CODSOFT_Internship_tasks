import joblib
import numpy as np
from flask import Flask, render_template, request, jsonify
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "outputs", "fraud_detection_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "outputs", "scaler.pkl")

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Load model + scaler at startup
# ---------------------------------------------------------------------------
model = joblib.load(MODEL_PATH)
time_scaler = joblib.load(SCALER_PATH)  # StandardScaler fit on 'Time'

# Statistics for scaling 'Amount' (computed from the training dataset,
# see notebooks/01_preprocessing.ipynb for the original transformation).
AMOUNT_MEAN = 88.47268731099723
AMOUNT_STD = 250.39899584557298

# The exact feature order the model was trained on
FEATURE_ORDER = list(model.feature_names_in_)

# Approximate value ranges (from the training dataset) used to build
# sensible placeholders / defaults for the form.
FEATURE_RANGES = {
    "Time": {"label": "Time (seconds since first transaction)", "min": 0, "max": 172792, "default": 0, "step": "any", "group": "transaction"},
    "Amount": {"label": "Transaction Amount ($)", "min": 0, "max": 25691.16, "default": 0, "step": "any", "group": "transaction"},
}
for i in range(1, 29):
    FEATURE_RANGES[f"V{i}"] = {
        "label": f"V{i}",
        "min": -100,
        "max": 100,
        "default": 0,
        "step": "any",
        "group": "pca",
    }


def build_feature_vector(payload: dict) -> np.ndarray:
    """Build a (1, n_features) array in the exact order the model expects."""
    values = []
    for feature in FEATURE_ORDER:
        raw_value = payload.get(feature, 0)
        try:
            raw_value = float(raw_value)
        except (TypeError, ValueError):
            raw_value = 0.0

        if feature == "Time":
            scaled = time_scaler.transform([[raw_value]])[0][0]
        elif feature == "Amount":
            scaled = (raw_value - AMOUNT_MEAN) / AMOUNT_STD
        else:
            scaled = raw_value

        values.append(scaled)

    return np.array(values, dtype=float).reshape(1, -1)


@app.route("/")
def index():
    return render_template(
        "index.html",
        feature_order=FEATURE_ORDER,
        feature_ranges=FEATURE_RANGES,
    )


@app.route("/predict", methods=["POST"])
def predict():
    try:
        payload = request.get_json(force=True, silent=True) or {}

        features = build_feature_vector(payload)

        prediction = int(model.predict(features)[0])
        probabilities = model.predict_proba(features)[0]
        fraud_probability = float(probabilities[1])
        genuine_probability = float(probabilities[0])

        result = {
            "prediction": prediction,
            "label": "Fraud" if prediction == 1 else "Genuine",
            "fraud_probability": round(fraud_probability * 100, 3),
            "genuine_probability": round(genuine_probability * 100, 3),
        }
        return jsonify(result), 200

    except Exception as exc:  # pragma: no cover
        return jsonify({"error": str(exc)}), 400


if __name__ == "__main__":
    app.run(debug=True)
