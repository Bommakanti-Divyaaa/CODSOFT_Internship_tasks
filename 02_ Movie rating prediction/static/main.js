/**
 * CineScore — Frontend Logic
 * Handles form validation, API calls, loading state, and result display.
 */

// ─── DOM References ────────────────────────────────────────────────────────
const form       = document.getElementById("prediction-form");
const submitBtn  = document.getElementById("submit-btn");
const loader     = document.getElementById("loader");
const resultCard = document.getElementById("result-card");
const resultScore= document.getElementById("result-score");
const resultFill = document.getElementById("result-fill");
const resultVerdict = document.getElementById("result-verdict");
const resetBtn   = document.getElementById("reset-btn");
const errorBanner= document.getElementById("error-banner");
const errorText  = document.getElementById("error-text");

// ─── Verdict copy based on score range ────────────────────────────────────
function getVerdict(score) {
  if (score >= 8.5) return "🏆 Exceptional — A cinematic masterpiece.";
  if (score >= 7.5) return "⭐ Excellent — Highly recommended watch.";
  if (score >= 6.5) return "👍 Good — A solid, enjoyable film.";
  if (score >= 5.5) return "😐 Average — Has its moments.";
  if (score >= 4.5) return "👎 Below Average — Proceed with caution.";
  return "💀 Poor — Might want to skip this one.";
}

// ─── Form Validation ───────────────────────────────────────────────────────
function validateField(id, errorId, condition, message) {
  const el  = document.getElementById(id);
  const err = document.getElementById(errorId);
  const wrap = el.closest(".select-wrapper");

  if (condition) {
    el.classList.add("invalid");
    if (wrap) wrap.classList.add("invalid");
    err.textContent = message;
    return false;
  }
  el.classList.remove("invalid");
  if (wrap) wrap.classList.remove("invalid");
  err.textContent = "";
  return true;
}

function validateForm(data) {
  let valid = true;

  const year = parseInt(data.year);
  valid &= validateField("year", "err-year",
    !data.year || isNaN(year) || year < 1900 || year > 2100,
    "Enter a valid year (1900–2100).");

  const duration = parseInt(data.duration);
  valid &= validateField("duration", "err-duration",
    !data.duration || isNaN(duration) || duration < 1 || duration > 600,
    "Duration must be 1–600 minutes.");

  valid &= validateField("genre", "err-genre",
    !data.genre, "Please select a genre.");

  const votes = parseInt(data.votes);
  valid &= validateField("votes", "err-votes",
    !data.votes || isNaN(votes) || votes < 0,
    "Enter a valid non-negative number.");

  valid &= validateField("director", "err-director",
    !data.director, "Please select a director.");

  valid &= validateField("actor1", "err-actor1",
    !data.actor1, "Please select Actor 1.");

  valid &= validateField("actor2", "err-actor2",
    !data.actor2, "Please select Actor 2.");

  valid &= validateField("actor3", "err-actor3",
    !data.actor3, "Please select Actor 3.");

  return Boolean(valid);
}

// ─── UI State Helpers ──────────────────────────────────────────────────────
function showLoader()  {
  loader.classList.add("active");
  resultCard.hidden = true;
  errorBanner.hidden = true;
  submitBtn.disabled = true;
}

function hideLoader()  {
  loader.classList.remove("active");
  submitBtn.disabled = false;
}

function showResult(score) {
  // Update score text
  resultScore.textContent = score.toFixed(1);

  // Animate bar fill (percentage of 10)
  const pct = (score / 10) * 100;
  // Delay slightly so animation triggers after display
  setTimeout(() => { resultFill.style.width = pct + "%"; }, 80);

  // Verdict message
  resultVerdict.textContent = getVerdict(score);

  resultCard.hidden = false;
  resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function showError(msg) {
  errorText.textContent = msg || "An unexpected error occurred. Please try again.";
  errorBanner.hidden = false;
  errorBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ─── Form Submit ───────────────────────────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Collect raw values
  const data = {
    year:     document.getElementById("year").value.trim(),
    duration: document.getElementById("duration").value.trim(),
    genre:    document.getElementById("genre").value,
    votes:    document.getElementById("votes").value.trim(),
    director: document.getElementById("director").value,
    actor1:   document.getElementById("actor1").value,
    actor2:   document.getElementById("actor2").value,
    actor3:   document.getElementById("actor3").value,
  };

  // Validate
  if (!validateForm(data)) return;

  // Convert numerics
  const payload = {
    year:     parseInt(data.year),
    duration: parseInt(data.duration),
    genre:    data.genre,
    votes:    parseInt(data.votes),
    director: data.director,
    actor1:   data.actor1,
    actor2:   data.actor2,
    actor3:   data.actor3,
  };

  showLoader();

  try {
    const response = await fetch("/api/predict", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `Server error ${response.status}`);
    }

    hideLoader();
    showResult(result.rating);

  } catch (err) {
    hideLoader();
    showError(err.message);
  }
});

// ─── Reset Button ──────────────────────────────────────────────────────────
resetBtn.addEventListener("click", () => {
  resultCard.hidden = true;
  errorBanner.hidden = true;
  resultFill.style.width = "0";
  form.reset();
  // Clear all validation states
  document.querySelectorAll(".invalid").forEach(el => el.classList.remove("invalid"));
  document.querySelectorAll(".field-error").forEach(el => el.textContent = "");
  // Scroll back up to form
  document.querySelector(".form-card").scrollIntoView({ behavior: "smooth" });
});

// ─── Clear field errors on input ──────────────────────────────────────────
form.querySelectorAll("input, select").forEach(el => {
  el.addEventListener("input", () => {
    el.classList.remove("invalid");
    const wrap = el.closest(".select-wrapper");
    if (wrap) wrap.classList.remove("invalid");
    // Clear matching error span
    const errId = "err-" + el.id;
    const errEl = document.getElementById(errId);
    if (errEl) errEl.textContent = "";
    // Also hide global error banner
    errorBanner.hidden = true;
  });
});
