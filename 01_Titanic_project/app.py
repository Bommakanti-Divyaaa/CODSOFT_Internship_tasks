import os
import joblib
import numpy as np
from flask import Flask, render_template, request

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_file(filename):
    path = os.path.join(BASE_DIR, "models", filename)
    return joblib.load(path)

try:
    model = load_file("titanic_model.pkl")
    feature_names = load_file("feature_names.pkl")
    model_loaded = True
    model_error = None
except Exception as e:
    model = None
    feature_names = []
    model_loaded = False
    model_error = str(e)

FEATURE_CONFIG = {
    "Pclass": ("Passenger Class", "select", [
        ("1", "1st Class"),
        ("2", "2nd Class"),
        ("3", "3rd Class")
    ]),
    "Sex": ("Sex", "select", [
        ("0", "Male"),
        ("1", "Female")
    ]),
    "Age": ("Age", "number", "e.g. 29"),
    "SibSp": ("Siblings / Spouses Aboard", "number", "e.g. 0"),
    "Parch": ("Parents / Children Aboard", "number", "e.g. 0"),
    "Fare": ("Fare Paid", "number", "e.g. 32.50"),
    "Embarked": ("Port of Embarkation", "select", [
        ("C", "Cherbourg"),
        ("Q", "Queenstown"),
        ("S", "Southampton")
    ])
}

UI_FEATURES = ["Pclass", "Sex", "Age", "SibSp", "Parch", "Fare", "Embarked"]

def build_input_vector(form):
    data = {
        "Pclass": float(form["Pclass"]),
        "Sex": float(form["Sex"]),
        "Age": float(form["Age"]),
        "SibSp": float(form["SibSp"]),
        "Parch": float(form["Parch"]),
        "Fare": float(form["Fare"]),
        "Embarked_Q": 1 if form["Embarked"] == "Q" else 0,
        "Embarked_S": 1 if form["Embarked"] == "S" else 0
    }

    values = [data[feature] for feature in feature_names]
    return np.array(values).reshape(1, -1)

@app.route("/", methods=["GET", "POST"])
def index():
    prediction = None
    error = None

    if not model_loaded:
        error = f"Could not load model files: {model_error}"

    elif request.method == "POST":
        try:
            X = build_input_vector(request.form)
            result = model.predict(X)[0]
            prediction = "Survived" if int(result) == 1 else "Not Survived"
        except Exception as e:
            error = f"Prediction failed: {e}"

    return render_template(
        "index.html",
        feature_config=FEATURE_CONFIG,
        feature_names=UI_FEATURES,
        prediction=prediction,
        error=error,
        form_data=request.form
    )

if __name__ == "__main__":
    app.run(debug=True)