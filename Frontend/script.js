async function getRecommendations() {
  const meal = document.getElementById("mealInput").value;
  const resultsDiv = document.getElementById("results");

  resultsDiv.innerHTML = "<p>Loading...</p>";

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
      <div style="margin-bottom: 20px;">
        <h3>${item.drink} (${item.score}/10)</h3>
        <p>${item.reason}</p>
      </div>
    `).join("")}
  `;
}