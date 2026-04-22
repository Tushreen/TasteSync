import os
import json
import re
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

DIARY_FILE = "backend/diary_entries.json"

UPLOAD_FOLDER = 'static/uploads/'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

FRONTEND_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../Frontend")
)

@app.route("/")
def home():
    return send_from_directory(FRONTEND_PATH, "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(FRONTEND_PATH, path)   


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

        if entries:
            max_id = max(entry.get("id", 0) for entry in entries)
        else:
            max_id = 0

        new_entry["id"] = max_id + 1
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

@app.route("/upload", methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return "No file part"

    file = request.files['image']

    if file:
    
        path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(path)
        return f"File saved to {path}"
    return "No file selected"

if __name__ == "__main__":
    app.run(debug=True)