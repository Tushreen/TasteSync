import os
import json
from flask import Flask, request, jsonify
<<<<<<< Updated upstream
=======
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
>>>>>>> Stashed changes

app = Flask(__name__)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.route("/")
def home():
    return "TasteSync backend is running!"

@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json()
    meal = data.get("meal", "")

<<<<<<< Updated upstream
    mock_results = [
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
=======
    prompt = f"""
    Suggest 2 drink pairings for {meal}.

    Return ONLY valid JSON in this exact format:
    {{
      "recommendations": [
        {{
          "drink": "Drink name",
          "score": 9,
          "reason": "Short explanation"
        }},
        {{
          "drink": "Drink name",
          "score": 8,
          "reason": "Short explanation"
        }}
      ]
    }}
    """
>>>>>>> Stashed changes

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    result_text = response.choices[0].message.content
    result_json = json.loads(result_text)

    return jsonify({
        "meal": meal,
        "recommendations": result_json["recommendations"]
    })

if __name__ == "__main__":
    app.run(debug=True)