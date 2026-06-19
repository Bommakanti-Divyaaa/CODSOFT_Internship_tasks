# 🌸 Iris Flower Classification — Flask Web App

A clean, modern Flask web application that wraps a trained Logistic Regression model to classify Iris flowers into three species:

- 🌸 **Iris Setosa**
- 💜 **Iris Versicolor**
- 🌺 **Iris Virginica**

---

## 📁 Project Structure

```
iris_flask/
├── app.py                  # Flask backend
├── requirements.txt        # Python dependencies
├── outputs/
│   ├── iris_model.pkl      # Trained Logistic Regression model
│   ├── label_encoder.pkl   # Label encoder for species names
│   └── feature_names.pkl   # Feature names list
├── templates/
│   └── index.html          # Main UI page
└── static/
    ├── css/
    │   └── style.css       # Stylesheet (blue theme)
    └── js/
        └── main.js         # Frontend logic & validation
```

---

## 🚀 How to Run

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the Flask Server

```bash
python app.py
```

### 3. Open in Browser

Navigate to: **http://127.0.0.1:5000**

---

## 🎯 How to Use

1. Enter the four flower measurements (in centimeters):
   - Sepal Length, Sepal Width, Petal Length, Petal Width
2. Click **Classify Flower**
3. See the predicted species and confidence scores for all three classes

You can also click the **example buttons** (Setosa / Versicolor / Virginica) to auto-fill typical values.

---

## 📊 Model Details

| Property        | Value                    |
|----------------|--------------------------|
| Algorithm       | Logistic Regression      |
| Library         | Scikit-learn             |
| Dataset         | Classic Iris Dataset     |
| Samples         | 150 (50 per class)       |
| Features        | 4 (sepal & petal dims)   |
| Approx. Accuracy | ~97% on test set        |

---

## 🛠 Requirements

- Python 3.8+
- Flask 2.3+
- Scikit-learn 1.3+
- NumPy 1.24+
- Joblib 1.3+
