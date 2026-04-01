async function getRecommendations() {
  const meal = document.getElementById("mealInput").value;
  const resultsDiv = document.getElementById("results");

  resultsDiv.innerHTML = "<p>Loading...</p>";

  try {
    const response = await fetch("http://127.0.0.1:5000/recommend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ meal: meal })
    });

    const data = await response.json();

    resultsDiv.innerHTML = `
      <h2>Recommendations for ${data.meal}</h2>
      ${data.recommendations.map(item => `
        <div class="result-card">
          <h3>${item.drink} (${item.score}/10)</h3>
          <p>${item.reason}</p>
        </div>
      `).join("")}
    `;
  } catch (error) {
    console.error("Error getting recommendations:", error);
    resultsDiv.innerHTML = "<p>Something went wrong. Please try again.</p>";
  }
}

async function loadDiary() {
  try {
    const response = await fetch("http://127.0.0.1:5000/diary");
    const entries = await response.json();

    const container = document.getElementById("diaryEntries");
    if (!container) return;

    container.innerHTML = "";

    entries.reverse().forEach(entry => {
      container.innerHTML += `
        <div class="diary-card">
          <h2>${entry.drink}</h2>
          <p class="subtext">Paired with ${entry.meal}</p>

          <p><strong>Rating:</strong> ${entry.rating}</p>
          <p><strong>Liked:</strong> ${entry.likedIt}</p>
          <p><strong>Cost:</strong> $${entry.cost}</p>
          <p><strong>Alcohol:</strong> ${entry.alcohol} (${entry.abv}%)</p>

          <p><strong>Notes:</strong> ${entry.notes}</p>
          <p><strong>Ingredients:</strong> ${entry.ingredients}</p>

          <p class="entry-date">${entry.date}</p>
          <button class="delete-btn" onclick="deleteDiaryEntry(${entry.id})">Delete</button>
        </div>
      `;
    });
  } catch (error) {
    console.error("Error loading diary:", error);
  }
}

async function saveDiaryEntry() {
  const entry = {
    meal: document.getElementById("meal").value,
    drink: document.getElementById("drink").value,
    likedIt: document.getElementById("likedIt").value,
    cost: document.getElementById("cost").value,
    rating: document.getElementById("rating").value,
    alcohol: document.getElementById("alcohol").value,
    abv: document.getElementById("abv").value,
    notes: document.getElementById("notes").value,
    ingredients: document.getElementById("ingredients").value,
    date: new Date().toLocaleDateString()
  };

  try {
    const response = await fetch("http://127.0.0.1:5000/diary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(entry)
    });

    const result = await response.json();
    console.log("Save response:", result);

    if (!response.ok) {
      throw new Error(result.error || "Failed to save entry");
    }

    alert("Saved!");

    document.getElementById("meal").value = "";
    document.getElementById("drink").value = "";
    document.getElementById("likedIt").value = "";
    document.getElementById("cost").value = "";
    document.getElementById("rating").value = "";
    document.getElementById("alcohol").value = "";
    document.getElementById("abv").value = "";
    document.getElementById("notes").value = "";
    document.getElementById("ingredients").value = "";

    loadDiary();
  } catch (error) {
    console.error("Error saving diary entry:", error);
    alert("Could not save entry: " + error.message);
  }
}

async function deleteDiaryEntry(entryId) {
  try {
    await fetch(`http://127.0.0.1:5000/diary/${entryId}`, {
      method: "DELETE"
    });

    loadDiary();
  } catch (error) {
    console.error("Error deleting diary entry:", error);
    alert("Could not delete entry.");
  }
}

if (document.getElementById("diaryEntries")) {
  loadDiary();
}