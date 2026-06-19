"use strict";

const fields = [
    { id: "sepal_length", key: "sepal_length", label: "Sepal Length" },
    { id: "sepal_width",  key: "sepal_width",  label: "Sepal Width"  },
    { id: "petal_length", key: "petal_length", label: "Petal Length" },
    { id: "petal_width",  key: "petal_width",  label: "Petal Width"  },
];

// ---- Validation ----
function validateField(field) {
    const input = document.getElementById(field.id);
    const errEl = document.getElementById("err_" + field.id);
    const val = input.value.trim();

    if (val === "") {
        showFieldError(input, errEl, `${field.label} is required.`);
        return false;
    }
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
        showFieldError(input, errEl, `Enter a valid positive number.`);
        return false;
    }
    if (num > 30) {
        showFieldError(input, errEl, `Value seems too large (max 30 cm).`);
        return false;
    }
    clearFieldError(input, errEl);
    return true;
}

function showFieldError(input, errEl, msg) {
    input.classList.add("error");
    errEl.textContent = msg;
}
function clearFieldError(input, errEl) {
    input.classList.remove("error");
    errEl.textContent = "";
}

// ---- Predict ----
async function predict() {
    hideResult();
    hideError();

    let valid = true;
    const data = {};

    for (const field of fields) {
        if (!validateField(field)) valid = false;
        else data[field.key] = parseFloat(document.getElementById(field.id).value);
    }
    if (!valid) return;

    setLoading(true);

    try {
        const res = await fetch("/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const json = await res.json();

        if (!res.ok || json.error) {
            showError(json.error || "Unexpected error. Please try again.");
        } else {
            showResult(json);
        }
    } catch (e) {
        showError("Network error — make sure the server is running.");
    } finally {
        setLoading(false);
    }
}

// ---- UI helpers ----
function setLoading(on) {
    const btn = document.getElementById("predict-btn");
    const text = btn.querySelector(".btn-text");
    const icon = btn.querySelector(".btn-icon");
    const loader = btn.querySelector(".btn-loader");

    btn.disabled = on;
    text.style.display = on ? "none" : "inline";
    icon.style.display = on ? "none" : "inline";
    loader.style.display = on ? "flex" : "none";
}

function showResult(data) {
    const card = document.getElementById("result-card");
    document.getElementById("result-emoji").textContent = data.emoji || "🌿";
    document.getElementById("result-name").textContent = data.prediction;
    document.getElementById("result-description").textContent = data.description || "";

    // Accent border with species color
    card.style.borderColor = data.color || "#2563EB";

    // Confidence bars
    const barsEl = document.getElementById("confidence-bars");
    barsEl.innerHTML = "";

    const sorted = Object.entries(data.probabilities).sort((a, b) => b[1] - a[1]);

    sorted.forEach(([species, pct]) => {
        const isPredicted = species === data.prediction;
        const item = document.createElement("div");
        item.className = "confidence-item";
        item.innerHTML = `
            <div class="confidence-row">
                <span class="confidence-species">${isPredicted ? "✓ " : ""}${species}</span>
                <span class="confidence-pct">${pct.toFixed(1)}%</span>
            </div>
            <div class="bar-track">
                <div class="bar-fill ${isPredicted ? "predicted" : ""}" data-width="${pct}" style="width:0%"></div>
            </div>
        `;
        barsEl.appendChild(item);
    });

    card.style.display = "block";
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Animate bars after paint
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.querySelectorAll(".bar-fill").forEach(bar => {
                bar.style.width = bar.dataset.width + "%";
            });
        });
    });
}

function hideResult() {
    const card = document.getElementById("result-card");
    card.style.display = "none";
}

function showError(msg) {
    const card = document.getElementById("error-card");
    document.getElementById("error-message").textContent = msg;
    card.style.display = "block";
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideError() {
    document.getElementById("error-card").style.display = "none";
}

// ---- Sample filler ----
function fillSample(sl, sw, pl, pw) {
    document.getElementById("sepal_length").value = sl;
    document.getElementById("sepal_width").value  = sw;
    document.getElementById("petal_length").value = pl;
    document.getElementById("petal_width").value  = pw;

    // Clear any errors
    fields.forEach(f => {
        const input = document.getElementById(f.id);
        const err   = document.getElementById("err_" + f.id);
        clearFieldError(input, err);
    });

    hideResult();
    hideError();
}

// ---- Event wiring ----
document.getElementById("predict-btn").addEventListener("click", predict);

// Real-time validation on blur
fields.forEach(field => {
    const input = document.getElementById(field.id);
    input.addEventListener("blur", () => validateField(field));
    input.addEventListener("input", () => {
        const errEl = document.getElementById("err_" + field.id);
        if (input.classList.contains("error")) clearFieldError(input, errEl);
    });
    // Allow Enter key
    input.addEventListener("keydown", e => { if (e.key === "Enter") predict(); });
});
