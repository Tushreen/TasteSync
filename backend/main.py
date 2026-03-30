from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "TasteSync backend is running!"

@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json()
    meal = data.get("meal", "")

    mock_results = [...]
    """
        {
            "drink": "Thai Iced Tea",
            "score": 9,
            "reason": f"Thai Iced Tea pairs nicely with {meal} because the sweetness balances strong flavors."
        },
        {
            "drink": "Sparkling Water with Lime",
            "score": 8,
            "reason": f"Sparkling Water with Lime refreshes your palate and works well with {meal}."
        }
    ]
    """

    return jsonify({
        "meal": meal,
        "recommendations": mock_results
    })

if __name__ == "__main__":
    app.run(debug=True)