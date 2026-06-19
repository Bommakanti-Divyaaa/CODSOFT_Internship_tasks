import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay
)
import joblib

df = pd.read_csv("dataset/iris.csv")

print("First 5 Rows:")
print(df.head())

print("\nDataset Shape:")
print(df.shape)

print("\nDataset Info:")
df.info()

print("\nMissing Values:")
print(df.isnull().sum())

duplicates = df.duplicated().sum()
print(f"\nDuplicate Rows: {duplicates}")

if duplicates > 0:
    df = df.drop_duplicates()
    print("Duplicate rows removed.")

X = df.drop("species", axis=1)
y = df["species"]

encoder = LabelEncoder()
y = encoder.fit_transform(y)

print("\nClass Mapping:")
for i, cls in enumerate(encoder.classes_):
    print(f"{i} -> {cls}")

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

model = LogisticRegression(max_iter=200)

model.fit(X_train, y_train)

y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)

print("\nAccuracy:")
print(f"{accuracy:.2%}")

print("\nClassification Report:")
print(classification_report(
    y_test,
    y_pred,
    target_names=encoder.classes_
))

cm = confusion_matrix(y_test, y_pred)

report = classification_report(
    y_test,
    y_pred,
    target_names=encoder.classes_,
    output_dict=True
)

report_df = pd.DataFrame(report).transpose()

plt.figure(figsize=(8, 4))
plt.axis("off")

table = plt.table(
    cellText=report_df.round(2).values,
    colLabels=report_df.columns,
    rowLabels=report_df.index,
    loc="center"
)

table.auto_set_font_size(False)
table.set_fontsize(10)
table.scale(1.2, 1.5)

plt.title("Classification Report")
plt.show()

disp = ConfusionMatrixDisplay(
    confusion_matrix=cm,
    display_labels=encoder.classes_
)

disp.plot(cmap="Blues")
plt.title("Confusion Matrix")
plt.show()

joblib.dump(model, "outputs/iris_model.pkl")
joblib.dump(encoder, "outputs/label_encoder.pkl")

feature_names = X.columns.tolist()
joblib.dump(feature_names, "outputs/feature_names.pkl")

print("\nModel Saved Successfully!")