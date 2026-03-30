import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

app = Flask(__name__)
CORS(app)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.route("/")
def home():
    return "TasteSync backend is running!"

@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json()
    meal = data.get("meal", "")

    prompt = f"""
    Suggest 2 drink pairings for {meal}.

    Return ONLY valid JSON in this format:
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

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )

        result_text = response.choices[0].message.content.strip()

        # Try to parse JSON safely
        import json
        result_json = json.loads(result_text)

        return jsonify({
            "meal": meal,
            "recommendations": result_json["recommendations"]
        })

    except Exception as e:
        print("Error:", e)

        # fallback (so your app never breaks)
        fallback = [
            {
                "drink": "Iced Tea",
                "score": 7,
                "reason": f"A safe and refreshing option for {meal}."
            },
            {
                "drink": "Sparkling Water",
                "score": 6,
                "reason": f"A neutral drink that pairs reasonably well with {meal}."
            }
        ]

        return jsonify({
            "meal": meal,
            "recommendations": fallback
        })

if __name__ == "__main__":
    app.run(debug=True)