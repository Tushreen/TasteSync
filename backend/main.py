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

DIARY_FILE = "backend/diary_entries.json"


@app.route("/")
def home():
    return "TasteSync backend is running!"


@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json()
    meal = data.get("meal", "").strip()

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

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
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
                "reason": f"Lemon Iced Tea adds a refreshing contrast and pairs nicely with {meal}."
            },
            {
                "drink": "Sparkling Water with Lime",
                "score": 7,
                "reason": f"Sparkling Water with Lime helps cleanse the palate and works well with {meal}."
            }
        ]

        return jsonify({
            "meal": meal,
            "recommendations": fallback
        })


@app.route("/diary", methods=["GET"])
def get_diary_entries():
    try:
        with open(DIARY_FILE, "r") as file:
            entries = json.load(file)
        return jsonify(entries)
    except FileNotFoundError:
        return jsonify([])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/diary", methods=["POST"])
def save_diary_entry():
    try:
        new_entry = request.get_json()

        try:
            with open(DIARY_FILE, "r") as file:
                entries = json.load(file)
        except FileNotFoundError:
            entries = []

        new_entry["id"] = len(entries) + 1
        entries.append(new_entry)

        with open(DIARY_FILE, "w") as file:
            json.dump(entries, file, indent=4)

        return jsonify({
            "message": "Diary entry saved successfully",
            "entry": new_entry
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/diary/<int:entry_id>", methods=["DELETE"])
def delete_diary_entry(entry_id):
    try:
        with open(DIARY_FILE, "r") as file:
            entries = json.load(file)

        updated_entries = [entry for entry in entries if entry.get("id") != entry_id]

        with open(DIARY_FILE, "w") as file:
            json.dump(updated_entries, file, indent=4)

        return jsonify({"message": "Entry deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)