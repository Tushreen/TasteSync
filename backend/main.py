import os
import json
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai

load_dotenv()

app = Flask(__name__)
CORS(app)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

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
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
        )

        result_text = response.text.strip()

        json_match = re.search(r"\{.*\}", result_text, re.DOTALL)
        if not json_match:
            raise ValueError("No valid JSON found in model response")

        result_json = json.loads(json_match.group())

        return jsonify({
            "meal": meal,
            "recommendations": result_json["recommendations"]
        })

    except Exception as e:
        print("Error:", e)

        fallback = [
            {
                "drink": "Lemon Iced Tea",
                "score": 8,
                "reason": f"Lemon Iced Tea pairs nicely with {meal}."
            },
            {
                "drink": "Sparkling Water",
                "score": 7,
                "reason": f"Sparkling Water is a safe pairing for {meal}."
            }
        ]

        return jsonify({
            "meal": meal,
            "recommendations": fallback
        })

if __name__ == "__main__":
    app.run(debug=True)