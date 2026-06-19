import os
import joblib
import numpy as np
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")


def load_artefacts():
    model = joblib.load(
        os.path.join(MODELS_DIR, "movie_rating_model.pkl")
    )

    label_encoders = {
        "Genre": joblib.load(
            os.path.join(MODELS_DIR, "genre_encoder.pkl")
        ),
        "Director": joblib.load(
            os.path.join(MODELS_DIR, "director_encoder.pkl")
        ),
        "Actor1": joblib.load(
            os.path.join(MODELS_DIR, "actor1_encoder.pkl")
        ),
        "Actor2": joblib.load(
            os.path.join(MODELS_DIR, "actor2_encoder.pkl")
        ),
        "Actor3": joblib.load(
            os.path.join(MODELS_DIR, "actor3_encoder.pkl")
        )
    }

    print("\n===== ENCODER CHECK =====")

    for name, encoder in label_encoders.items():
        print(f"\n{name}")
        print("Type:", type(encoder))
        print("Has classes_:", hasattr(encoder, "classes_"))

    options = {}

    for name, encoder in label_encoders.items():
        options[name] = sorted(list(encoder.classes_))

    return model, label_encoders, options


def safe_encode(encoder, value):
    if value in encoder.classes_:
        return int(encoder.transform([value])[0])
    return 0


try:
    MODEL, LABEL_ENCODERS, OPTIONS = load_artefacts()
    print("\nModel loaded successfully.")

except Exception as exc:
    raise RuntimeError(
        f"Failed to load model artefacts: {exc}"
    ) from exc


@app.route("/")
def index():
    return render_template(
        "index.html",
        options=OPTIONS
    )


@app.route("/api/options")
def api_options():
    return jsonify(OPTIONS)


@app.route("/api/predict", methods=["POST"])
def predict():

    data = request.get_json(force=True)

    genre_enc = safe_encode(
        LABEL_ENCODERS["Genre"],
        data["genre"]
    )

    director_enc = safe_encode(
        LABEL_ENCODERS["Director"],
        data["director"]
    )

    actor1_enc = safe_encode(
        LABEL_ENCODERS["Actor1"],
        data["actor1"]
    )

    actor2_enc = safe_encode(
        LABEL_ENCODERS["Actor2"],
        data["actor2"]
    )

    actor3_enc = safe_encode(
        LABEL_ENCODERS["Actor3"],
        data["actor3"]
    )

    features = np.array([[
        int(data["year"]),
        int(data["duration"]),
        genre_enc,
        int(data["votes"]),
        director_enc,
        actor1_enc,
        actor2_enc,
        actor3_enc
    ]])

    prediction = MODEL.predict(features)[0]

    return jsonify({
        "rating": round(float(prediction), 1)
    })


if __name__ == "__main__":
    app.run(debug=True)