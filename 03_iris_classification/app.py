from flask import Flask, render_template, request, jsonify
import joblib
import numpy as np
import pandas as pd
import os

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")

model = joblib.load(os.path.join(OUTPUTS_DIR, "iris_model.pkl"))
encoder = joblib.load(os.path.join(OUTPUTS_DIR, "label_encoder.pkl"))
feature_names = joblib.load(os.path.join(OUTPUTS_DIR, "feature_names.pkl"))

SPECIES_INFO = {
    "Iris-setosa": {
        "emoji": "🌸",
        "color": "#4A90D9",
        "description": "Small, delicate flowers with distinctive markings. Native to the Arctic and subarctic regions."
    },
    "Iris-versicolor": {
        "emoji": "💜",
        "color": "#7B68EE",
        "description": "Blue flag iris with violet-blue flowers. Common in eastern North America's wetlands."
    },
    "Iris-virginica": {
        "emoji": "🌺",
        "color": "#2E86AB",
        "description": "Southern blue flag with large, showy blooms. Found along the eastern coast of North America."
    }
}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        sepal_length = float(data["sepal_length"])
        sepal_width = float(data["sepal_width"])
        petal_length = float(data["petal_length"])
        petal_width = float(data["petal_width"])

        for name, val in [("Sepal Length", sepal_length), ("Sepal Width", sepal_width),
                           ("Petal Length", petal_length), ("Petal Width", petal_width)]:
            if val <= 0 or val > 30:
                return jsonify({"error": f"{name} must be between 0 and 30 cm."}), 400

        features = pd.DataFrame([[sepal_length, sepal_width, petal_length, petal_width]],
                                 columns=feature_names)
        prediction_encoded = model.predict(features)[0]
        prediction_label = encoder.inverse_transform([prediction_encoded])[0]
        probabilities = model.predict_proba(features)[0]

        prob_dict = {
            encoder.inverse_transform([i])[0]: round(float(p) * 100, 1)
            for i, p in enumerate(probabilities)
        }

        species_data = SPECIES_INFO.get(prediction_label, {})

        return jsonify({
            "prediction": prediction_label,
            "probabilities": prob_dict,
            "emoji": species_data.get("emoji", "🌿"),
            "color": species_data.get("color", "#4A90D9"),
            "description": species_data.get("description", "")
        })

    except (KeyError, ValueError) as e:
        return jsonify({"error": f"Invalid input: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True)
