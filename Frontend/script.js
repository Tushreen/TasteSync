async function getRecommendations() {
  const meal = document.getElementById("mealInput").value;

  const data = {
    meal: meal,
    diet: document.getElementById("diet")?.value,
    drinkType: document.getElementById("drinkType")?.value,
    alcohol: document.getElementById("alcoholPref")?.value,
    cocktail: document.getElementById("cocktail")?.value,
    style: document.getElementById("style")?.value,
    flavor: document.getElementById("flavor")?.value,
    scale: document.getElementById("scale")?.value,
    temp: document.getElementById("temp")?.value,
    desc: document.getElementById("desc")?.value
  };


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


// Register user
async function register() {
  const username = document.getElementById("regUsername").value;
  const password = document.getElementById("regPassword").value;

  const res = await fetch("http://127.0.0.1:5000/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  alert(data.message || data.error);

  if (data.message) {
    showLogin();
  }
}

// Login
async function login() {
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch("http://127.0.0.1:5000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (data.user) {
    localStorage.setItem("userId", data.user.id);
    alert("Login successful!");

    // redirect to profile page
    window.location.href = "profile.html";
  } else {
    alert(data.error);
  }
}

// Go to the profile
async function loadProfile() {
  const userId = localStorage.getItem("userId");

  const res = await fetch(`http://127.0.0.1:5000/profile/${userId}`);
  const data = await res.json();

  document.getElementById("first_name").value = data.first_name || "";
  document.getElementById("last_name").value = data.last_name || "";
  document.getElementById("email").value = data.email || "";
  document.getElementById("bio").value = data.bio || "";
  document.getElementById("favorite_drink").value = data.favorite_drink || "";

  if (data.avatar) {
    document.getElementById("avatarPreview").src = data.avatar;
  }
}

// Update profile
async function updateProfile() {
  const userId = localStorage.getItem("userId");

  const data = {
    first_name: document.getElementById("first_name").value,
    last_name: document.getElementById("last_name").value,
    email: document.getElementById("email").value,
    bio: document.getElementById("bio").value,
    favorite_drink: document.getElementById("favorite_drink").value,
    avatar: avatarBase64
  };

  const res = await fetch(`http://127.0.0.1:5000/profile/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const result = await res.json();
  alert(result.message);
}

let avatarBase64 = "";

document.getElementById("avatarInput").addEventListener("change", function () {
  const file = this.files[0];
  const reader = new FileReader();

  reader.onloadend = function () {
    avatarBase64 = reader.result;
    document.getElementById("avatarPreview").src = avatarBase64;
  };

  if (file) {
    reader.readAsDataURL(file);
  }
});

async function postNewReview() {
  console.log("Submit clicked"); // debug

  const rating = document.getElementById("rating").value;
  const liked = document.getElementById("likedIt").value;
  const notes = document.getElementById("notes").value;
  const drink = document.getElementById("drinkName").value;

  const entry = {
    meal: "AI Recommendation",
    drink: drink,
    likedIt: liked,
    cost: "0",
    rating: rating,
    alcohol: "unknown",
    abv: "n/a",
    notes: notes,
    ingredients: "AI generated",
    date: new Date().toLocaleDateString()
  };

  try {
    const res = await fetch("http://127.0.0.1:5000/diary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(entry)
    });

    const result = await res.json();
    console.log(result);

    alert("Review saved!");
  } catch (err) {
    console.error(err);
    alert("Failed to save review");
  }
}