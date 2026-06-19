const form = document.getElementById("prediction-form");
const predictBtn = document.getElementById("predict-btn");
const resetBtn = document.getElementById("reset-btn");

const resultContainer = document.getElementById("result");
const resultCard = document.getElementById("result-card");

const resultIcon = document.getElementById("result-icon");
const resultTitle = document.getElementById("result-title");
const resultSubtitle = document.getElementById("result-subtitle");

const fraudPct = document.getElementById("fraud-pct");
const genuinePct = document.getElementById("genuine-pct");

const meterFill = document.getElementById("result-meter-fill");

const errorBox = document.getElementById("error");

// ----------------------------------------------------
// Reset Form
// ----------------------------------------------------
resetBtn.addEventListener("click", () => {
    form.reset();

    resultContainer.hidden = true;
    errorBox.hidden = true;

    meterFill.style.width = "0%";
});

// ----------------------------------------------------
// Submit Form
// ----------------------------------------------------
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    errorBox.hidden = true;
    resultContainer.hidden = true;

    // Loading State
    predictBtn.classList.add("is-loading");
    predictBtn.disabled = true;

    try {
        const payload = {};

        const inputs = form.querySelectorAll("input");

        inputs.forEach((input) => {
            payload[input.name] = input.value;
        });

        const response = await fetch("/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Prediction failed");
        }

        displayResult(data);

    } catch (error) {

        errorBox.textContent = error.message;
        errorBox.hidden = false;

    } finally {

        predictBtn.classList.remove("is-loading");
        predictBtn.disabled = false;

    }
});

// ----------------------------------------------------
// Display Prediction Result
// ----------------------------------------------------
function displayResult(data) {

    resultContainer.hidden = false;

    const fraudProbability = Number(data.fraud_probability);
    const genuineProbability = Number(data.genuine_probability);

    fraudPct.textContent = fraudProbability.toFixed(2) + "%";
    genuinePct.textContent = genuineProbability.toFixed(2) + "%";

    meterFill.style.width = fraudProbability + "%";

    if (data.prediction === 1) {

        resultCard.classList.remove("is-genuine");
        resultCard.classList.add("is-fraud");

        resultIcon.textContent = "⚠";

        resultTitle.textContent = "Potential Fraud Detected";

        resultSubtitle.textContent =
            "This transaction shows characteristics commonly associated with fraudulent activity.";

    } else {

        resultCard.classList.remove("is-fraud");
        resultCard.classList.add("is-genuine");

        resultIcon.textContent = "✓";

        resultTitle.textContent = "Transaction Appears Genuine";

        resultSubtitle.textContent =
            "The transaction appears consistent with legitimate transaction patterns.";

    }

    resultContainer.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}