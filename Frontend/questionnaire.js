document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("questionnaireForm");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Collect user inputs safely
    const data = {
      diet: document.getElementById("diet").value,
      drinkType: document.getElementById("drinkType").value,
      alcohol: document.getElementById("alcoholPref").value,
      cocktail: document.getElementById("cocktail").value,
      style: document.getElementById("style").value,
      flavor: document.getElementById("flavor").value,
      scale: document.getElementById("scale").value,
      temp: document.getElementById("temp").value,
      desc: document.getElementById("desc").value
    };

    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "<p>Generating your personalized recommendations...</p>";

    try {
      const response = await fetch("http://127.0.0.1:5000/recommend-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      console.log("AI response:", result);

      // SAFETY CHECK: ensure real AI output exists
      if (result.recommendations && Array.isArray(result.recommendations)) {
        resultsDiv.innerHTML = `
          <div style="text-align:center;">
            <h2>Personalized AI Drink Recommendations</h2>
            <p>Based on your taste profile</p>
          </div>

          ${result.recommendations.map(item => `
            <div class="result-card" style="text-align:center;">
              <h3>${item.drink} (${item.score}/10)</h3>
              <p>${item.reason}</p>
            </div>
          `).join("")}
        `;
      } else {
        resultsDiv.innerHTML = `
          <p>No valid recommendations returned from AI.</p>
        `;
      }

    } catch (error) {
      console.error("Error:", error);
      resultsDiv.innerHTML = "<p>Something went wrong. Please try again.</p>";
    }
  });
});