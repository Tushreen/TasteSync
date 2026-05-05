// STAR RATING SYSTEM
const stars = document.querySelectorAll("#starRating span");
const ratingInput = document.getElementById("newRating");

stars.forEach(star => {
  star.addEventListener("click", () => {
    const value = Number(star.getAttribute("data-value"));
    ratingInput.value = value;

    // fill stars correctly
    stars.forEach(s => {
      const starValue = Number(s.getAttribute("data-value"));
      s.textContent = starValue <= value ? "★" : "☆";
    });
  });
});


// SUBMIT REVIEW
async function postNewReview() {
  console.log("Submit clicked");

  const entry = {
    meal: document.getElementById("newMeal").value,
    drink: document.getElementById("newDrink").value,
    likedIt: document.getElementById("newLiked").value,
    rating: document.getElementById("newRating").value,
    notes: document.getElementById("newNotes").value,
    date: new Date().toLocaleDateString(),

    // IMPORTANT: initialize counters
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

    const result = await res.json();
    console.log(result);

    alert("Review saved!");

    // clear form
    document.getElementById("newMeal").value = "";
    document.getElementById("newDrink").value = "";
    document.getElementById("newNotes").value = "";
    document.getElementById("newRating").value = "";

    stars.forEach(s => s.textContent = "☆");

    loadReviews();

  } catch (err) {
    console.error(err);
    alert("Failed to save review");
  }
}


// LOAD REVIEWS
async function loadReviews() {
  try {
    const res = await fetch("http://127.0.0.1:5000/diary");
    const data = await res.json();

    const container = document.getElementById("reviewsList");

    container.innerHTML = `<h2>Your Reviews</h2>`;

    data.reverse().forEach(entry => {
      container.innerHTML += `
        <div class="result-card" id="review-${entry.id}">

          <h3>${entry.drink} (${entry.rating}/5)</h3>

          <p><strong>Meal:</strong> ${entry.meal}</p>
          <p><strong>Liked:</strong> ${entry.likedIt}</p>
          <p>${entry.notes}</p>

          <!-- 👍👎 SECTION -->
          <div class="feedback-buttons">

          <div class="feedback-item">
            <button onclick="reviewFeedback(${entry.id}, 'like')">👍</button>
            <span>${entry.thumbUp || 0}</span>
          </div>

          <div class="feedback-item">
            <button onclick="reviewFeedback(${entry.id}, 'dislike')">👎</button>
            <span>${entry.thumbDown || 0}</span>
          </div>

        </div>

        <p class="entry-date">${entry.date}</p>
      `;
    });

  } catch (err) {
    console.error("Error loading reviews:", err);
  }
}


// THUMB FEEDBACK
function reviewFeedback(id, type) {
  fetch(`http://127.0.0.1:5000/diary/${id}/thumb`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: type === "like" ? "up" : "down"
    })
  }).then(() => {
    loadReviews();
  });
}


// AUTO LOAD
window.onload = loadReviews;