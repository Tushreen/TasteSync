// GLOBAL USER
const user = JSON.parse(localStorage.getItem("user")) || null;

// GLOBAL USER HELPER
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("user"));
}

// RECOMMENDATIONS
async function getRecommendations() {
  const meal = document.getElementById("mealInput").value;

  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "<p>Loading...</p>";

  try {
    const response = await fetch("http://127.0.0.1:5000/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meal })
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
    console.error(error);
    resultsDiv.innerHTML = "<p>Error loading recommendations</p>";
  }
}


// SAVE DIARY ENTRY
async function saveDiaryEntry() {
  const entry = {
    user_id: user ? user.id : null,

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
    const res = await fetch("http://127.0.0.1:5000/diary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry)
    });

    const result = await res.json();

    if (!res.ok) throw new Error(result.error);

    alert("Saved!");

    loadDiary();
  } catch (err) {
    console.error(err);
    alert("Could not save entry: " + err.message);
  }
}


// LOAD DIARY
async function loadDiary() {
  try {
    const res = await fetch("http://127.0.0.1:5000/diary");
    if (!res.ok) {
        throw new Error("Failed to load diary");
    }

    const entries = await res.json();

    const container = document.getElementById("diaryEntries");
    if (!container) return;

    container.innerHTML = "";

    entries.reverse().forEach(entry => {
      container.innerHTML += `
        <div class="diary-card">
          <h2>${entry.drink}</h2>
          <p>Meal: ${entry.meal}</p>
          <p>Rating: ${entry.rating}</p>

          <p>
            👍 ${entry.thumbUp || 0}
            👎 ${entry.thumbDown || 0}
          </p>

          <button onclick="deleteDiaryEntry(${entry.id})">Delete</button>
        </div>
      `;
    });

  } catch (err) {
    console.error(err);
  }
}


// DELETE DIARY (SECURED)
async function deleteDiaryEntry(entryId) {
  try {
    await fetch(`http://127.0.0.1:5000/diary/${entryId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user ? user.id : null
      })
    });

    loadDiary();
  } catch (err) {
    console.error(err);
  }
}


// LOGIN
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
    localStorage.setItem("user", JSON.stringify(data.user)); // FIXED
    alert("Login successful!");
    window.location.href = "profile.html";
  } else {
    alert(data.error);
  }
}

// Register
async function register() {
  const username = document.getElementById("regUsername").value;
  const password = document.getElementById("regPassword").value;

  const res = await fetch("http://127.0.0.1:5000/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  console.log("REGISTER RESPONSE:", data);

  if (res.ok) {
    alert("Registration successful!");
    showLogin();
  } else {
    alert(data.error || "Registration failed");
  }
}

// Update Profile
async function updateProfile() {
  const user = getCurrentUser();

  if (!user) {
    alert("Not logged in");
    return;
  }

  const body = {
    first_name: document.getElementById("first_name").value,
    last_name: document.getElementById("last_name").value,
    email: document.getElementById("email").value,
    bio: document.getElementById("bio").value,
    favorite_drink: document.getElementById("favorite_drink").value,
    avatar: window.avatarBase64 || ""
  };

  console.log("SENDING PROFILE:", body);

  try {
    const res = await fetch(`http://127.0.0.1:5000/profile/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    console.log("RAW RESPONSE:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Server did not return JSON");
    }

    if (!res.ok) {
      throw new Error(data.error || "Profile update failed");
    }

    alert("Profile updated!");
    return data;

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    alert(err.message);
  }
}



// Load Profile
async function loadProfile() {
  const user = getCurrentUser();

  if (!user) {
    alert("Not logged in");
    return;
  }

  const res = await fetch(`http://127.0.0.1:5000/profile/${user.id}`);
  const data = await res.json();

  document.getElementById("usernameDisplay").value = user.username;

  document.getElementById("first_name").value = data.first_name || "";
  document.getElementById("last_name").value = data.last_name || "";
  document.getElementById("email").value = data.email || "";
  document.getElementById("bio").value = data.bio || "";
  document.getElementById("favorite_drink").value = data.favorite_drink || "";

  if (data.avatar) {
    document.getElementById("avatarPreview").src = data.avatar;
  }
}



// IMAGE HELPERS
function compressImage(base64, quality = 0.6) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // resize image (smaller avatar = smaller JSON)
      canvas.width = 200;
      canvas.height = 200;

      ctx.drawImage(img, 0, 0, 200, 200);

      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed);
    };
  });
}


// AVATAR UPLOAD HANDLER
document.getElementById("avatarInput").addEventListener("change", async function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch("http://127.0.0.1:5000/upload", {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  document.getElementById("avatarPreview").src = data.imageUrl;

  // store URL instead of base64
  window.avatarBase64 = data.imageUrl;
});






// Change password
async function changePassword() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    alert("Not logged in");
    return;
  }

  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!newPassword || !confirmPassword) {
    alert("Please fill both fields");
    return;
  }

  if (newPassword !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  const res = await fetch(`http://127.0.0.1:5000/change-password/${user.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_password: newPassword })
  });

  const data = await res.json();

  if (res.ok) {
    alert("Password updated successfully");

    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";
  } else {
    alert(data.error || "Failed to update password");
  }
}

// Log out
function logout() {
  localStorage.removeItem("user");
  alert("Logged out");
  window.location.href = "auth.html";
}





// LOAD DIARY ON PAGE LOAD
if (document.getElementById("diaryEntries")) {
  loadDiary();
}