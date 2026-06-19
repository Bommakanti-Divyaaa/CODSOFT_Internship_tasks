// DOM References
const form        = document.getElementById("predict-form");
const tvInput     = document.getElementById("tv");
const radioInput  = document.getElementById("radio");
const newsInput   = document.getElementById("newspaper");
const predictBtn  = document.getElementById("predict-btn");
const btnText     = document.getElementById("btn-text");
const btnLoader   = document.getElementById("btn-loader");
const clearBtn    = document.getElementById("clear-btn");
const errorBanner = document.getElementById("error-banner");

const resultIdle   = document.getElementById("result-idle");
const resultOutput = document.getElementById("result-output");
const resultValue  = document.getElementById("result-value");

// Validation helpers

/**
 * Validate a single numeric input field.
 * @param {HTMLInputElement} input
 * @param {string} label — friendly name for the error message
 * @returns {boolean} true if valid
 */
function validateField(input, label) {
  const errorEl = document.getElementById(`${input.id}-error`);
  const val = input.value.trim();

  if (val === "") {
    showFieldError(input, errorEl, `${label} is required.`);
    return false;
  }

  const num = parseFloat(val);
  if (isNaN(num)) {
    showFieldError(input, errorEl, `${label} must be a number.`);
    return false;
  }

  if (num < 0) {
    showFieldError(input, errorEl, `${label} cannot be negative.`);
    return false;
  }

  clearFieldError(input, errorEl);
  return true;
}

function showFieldError(input, errorEl, msg) {
  errorEl.textContent = msg;
  input.classList.add("invalid");
}

function clearFieldError(input, errorEl) {
  errorEl.textContent = "";
  input.classList.remove("invalid");
}

/** Validate all three fields and return true only if all pass. */
function validateAll() {
  const v1 = validateField(tvInput,    "TV Budget");
  const v2 = validateField(radioInput, "Radio Budget");
  const v3 = validateField(newsInput,  "Newspaper Budget");
  return v1 && v2 && v3;
}

// ── Loading state helpers ───────────────────────────────────────────────────
function setLoading(loading) {
  predictBtn.disabled = loading;
  btnText.textContent  = loading ? "Predicting…" : "Predict Sales";
  btnLoader.classList.toggle("hidden", !loading);
}

// ── Error banner ────────────────────────────────────────────────────────────
function showBanner(msg) {
  errorBanner.textContent = msg;
  errorBanner.classList.remove("hidden");
}
function hideBanner() {
  errorBanner.classList.add("hidden");
}

// ── Result display ──────────────────────────────────────────────────────────
function showResult(value) {
  resultIdle.style.display   = "none";
  resultOutput.classList.remove("hidden");
  // Animate the number counting up for a small polish touch
  animateValue(resultValue, 0, value, 600);
}

function resetResult() {
  resultIdle.style.display = "";
  resultOutput.classList.add("hidden");
  resultValue.textContent = "—";
}

/**
 * Simple count-up animation for the result value.
 */
function animateValue(el, start, end, duration) {
  const range     = end - start;
  const startTime = performance.now();

  function step(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = (start + range * eased).toFixed(2);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ── Form submit ─────────────────────────────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideBanner();

  // Validate inputs before sending
  if (!validateAll()) return;

  setLoading(true);

  const payload = {
    tv:        parseFloat(tvInput.value),
    radio:     parseFloat(radioInput.value),
    newspaper: parseFloat(newsInput.value),
  };

  try {
    const response = await fetch("/predict", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      // Server returned an error (validation or model error)
      showBanner(data.error || "Prediction failed. Please try again.");
      resetResult();
    } else {
      // Success — display the predicted value
      showResult(data.prediction);
    }

  } catch (err) {
    // Network error or JSON parse failure
    showBanner("Could not reach the server. Make sure Flask is running.");
    resetResult();
  } finally {
    setLoading(false);
  }
});

// ── Clear button ─────────────────────────────────────────────────────────────
clearBtn.addEventListener("click", () => {
  // Clear all field values
  [tvInput, radioInput, newsInput].forEach((inp) => {
    inp.value = "";
    const err = document.getElementById(`${inp.id}-error`);
    clearFieldError(inp, err);
  });

  hideBanner();
  resetResult();
});

// ── Live validation — clear error as user types ───────────────────────────
[tvInput, radioInput, newsInput].forEach((inp) => {
  inp.addEventListener("input", () => {
    const errorEl = document.getElementById(`${inp.id}-error`);
    if (inp.value.trim() !== "") {
      clearFieldError(inp, errorEl);
    }
  });
});

// ── Smooth scroll for nav links ───────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});
