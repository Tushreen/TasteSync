document.addEventListener("DOMContentLoaded", () => {

  // STAR RATING SYSTEM
  const stars = document.querySelectorAll("#starRating span");
  const ratingInput = document.getElementById("newRating");

  if (stars && stars.length > 0 && ratingInput) {

    stars.forEach(star => {
      star.addEventListener("click", () => {

        const value = Number(star.dataset.value);
        ratingInput.value = value;

        stars.forEach(s => {
          const starValue = Number(s.dataset.value);
          s.textContent = starValue <= value ? "★" : "☆";
        });

      });
    });
  } else {
    console.log("⭐ Star rating system not found on this page");
  }

  // LOAD REVIEWS
  if (typeof loadReviews === "function") {
    loadReviews();
  } else {
    console.log("⚠ loadReviews not defined on this page");
  }

});


// SUBMIT REVIEW
async function postNewReview() {
  const entry = {
    meal: document.getElementById("newMeal").value,
    drink: document.getElementById("newDrink").value,
    likedIt: document.getElementById("newLiked").value,
    rating: document.getElementById("newRating").value,
    notes: document.getElementById("newNotes").value,
    date: new Date().toLocaleDateString(),

    thumbUp: 0,
    thumbDown: 0
  };

  if (!entry.drink || !entry.rating) {
    alert("Please enter drink name and rating");
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:5000/diary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry)
    });

    await res.json();

    alert("Review saved!");

    document.getElementById("newMeal").value = "";
    document.getElementById("newDrink").value = "";
    document.getElementById("newLiked").value = "";
    document.getElementById("newNotes").value = "";
    document.getElementById("newRating").value = "";

    document.querySelectorAll("#starRating span")
      .forEach(s => s.textContent = "☆");

    loadReviews();

  } catch (err) {
    console.error(err);
  }
}


// LOAD REVIEWS
async function loadReviews() {
  try {
    console.log("Loading reviews...");

    const res = await fetch("http://127.0.0.1:5000/diary");
    const data = await res.json();

    console.log("DATA:", data);

    const container = document.getElementById("reviewsList");

    if (!container) {
      console.error("reviewsList missing in HTML");
      return;
    }

    container.innerHTML = "<h2>Your Reviews</h2>";

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML += "<p>No reviews found.</p>";
      return;
    }

    data.reverse().forEach((entry, index) => {
      try {
        container.innerHTML += `
          <div class="result-card">

            <h3>${entry.drink || "Unknown drink"}</h3>

            <p><strong>Meal:</strong> ${entry.meal || "-"}</p>
            <p><strong>Rating:</strong> ${entry.rating || "-"}</p>

            <p><strong>Notes:</strong> ${entry.notes || ""}</p>

            <div class="feedback-buttons">

              <span onclick="reviewFeedback(${entry.id}, 'like')">
                👍 ${entry.thumbUp ?? 0}
              </span>

              <span onclick="reviewFeedback(${entry.id}, 'down')">
                👎 ${entry.thumbDown ?? 0}
              </span>
            </div>

          </div>
        `;
      } catch (err) {
        console.error("Error rendering entry:", entry, err);
      }
    });

  } catch (err) {
    console.error("Failed to load reviews:", err);
  }
}


// THUMBS
function reviewFeedback(id, type) {
  fetch(`http://127.0.0.1:5000/diary/${id}/thumb`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: type === "like" ? "up" : "down"
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log("thumb response:", data);

    // small delay ensures file write completes
    setTimeout(() => {
      loadReviews();
    }, 100);
  })
  .catch(err => console.error(err));
}