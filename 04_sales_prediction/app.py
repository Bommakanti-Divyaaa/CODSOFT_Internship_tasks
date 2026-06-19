"""
Advertising Sales Prediction - Flask Application
Loads a pre-trained Linear Regression model and serves predictions
via a web interface.
"""

from flask import Flask, render_template, request, jsonify
import joblib
import numpy as np
import os

# ──────────────────────────────────────────────────────────────
# App setup
# ──────────────────────────────────────────────────────────────
app = Flask(__name__)

# ──────────────────────────────────────────────────────────────
# Load trained model from outputs folder
# ──────────────────────────────────────────────────────────────
MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "outputs",
    "sales_prediction_model.pkl"
)

# Check if model exists
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Model file not found at:\n{MODEL_PATH}"
    )

# Load model
model = joblib.load(MODEL_PATH)

print("Model loaded successfully!")
print(f" Model path: {MODEL_PATH}")

# ──────────────────────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        # Get values from frontend
        tv = float(data["tv"])
        radio = float(data["radio"])
        newspaper = float(data["newspaper"])

        # Validation
        if tv < 0 or radio < 0 or newspaper < 0:
            return jsonify({
                "error": "Advertising budgets cannot be negative."
            }), 400

        # Prepare input for model
        features = np.array([[tv, radio, newspaper]])

        # Predict
        prediction = model.predict(features)[0]

        return jsonify({
            "prediction": round(float(prediction), 2)
        })

    except ValueError:
        return jsonify({
            "error": "Please enter valid numeric values."
        }), 400

    except KeyError:
        return jsonify({
            "error": "Missing required input fields."
        }), 400

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


# ──────────────────────────────────────────────────────────────
# Run App
# ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True)