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

# DIARY_FILE = "backend/diary_entries.json"
DIARY_FILE = "diary_entries.json"

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
        data = request.get_json()

        new_entry = {
            "meal": data.get("meal"),
            "drink": data.get("drink"),
            "rating": data.get("rating"),
            "likedIt": data.get("likedIt"),

            "cost": data.get("cost"),
            "alcohol": data.get("alcohol"),
            "abv": data.get("abv"),
            "notes": data.get("notes"),
            "ingredients": data.get("ingredients"),
            "date": data.get("date"),

            # NEW FIELDS (IMPORTANT)
            "thumbUp": 0,
            "thumbDown": 0
        }

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

# user and profile
USERS_FILE = "backend/users.json"
def load_users():
    try:
        with open(USERS_FILE, "r") as f:
            return json.load(f)
    except:
        return []

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=4)

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    username = data.get("username")
    password = data.get("password")

    users = load_users()

    # check if user exists
    for user in users:
        if user["username"] == username:
            return jsonify({"error": "User already exists"}), 400

    new_user = {
        "id": len(users) + 1,
        "username": username,
        "password": password,
        "profile": {
            "first_name": "",
            "last_name": "",
            "email": "",
            "bio": "",
            "favorite_drink": "",
            "avatar": ""  # store image as base64 string
        }
    }

    users.append(new_user)
    save_users(users)

    return jsonify({"message": "User registered successfully"})

# Login
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    username = data.get("username")
    password = data.get("password")

    users = load_users()

    for user in users:
        if user["username"] == username and user["password"] == password:
            return jsonify({
                "message": "Login successful",
                "user": {
                    "id": user["id"],
                    "username": user["username"]
                }
            })

    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/profile/<int:user_id>", methods=["GET"])
def get_profile(user_id):
    users = load_users()

    for user in users:
        if user["id"] == user_id:
            return jsonify(user["profile"])

    return jsonify({"error": "User not found"}), 404

@app.route("/profile/<int:user_id>", methods=["PUT"])
def update_profile(user_id):
    data = request.get_json()
    users = load_users()

    for user in users:
        if user["id"] == user_id:
            user["profile"]["first_name"] = data.get("first_name", "")
            user["profile"]["last_name"] = data.get("last_name", "")
            user["profile"]["email"] = data.get("email", "")
            user["profile"]["bio"] = data.get("bio", "")
            user["profile"]["favorite_drink"] = data.get("favorite_drink", "")
            user["profile"]["avatar"] = data.get("avatar", "")

            save_users(users)
            return jsonify({"message": "Profile updated"})

    return jsonify({"error": "User not found"}), 404

@app.route("/change-password/<int:user_id>", methods=["PUT"])
def change_password(user_id):
    data = request.get_json()
    users = load_users()

    for user in users:
        if user["id"] == user_id:
            user["password"] = data.get("new_password")
            save_users(users)
            return jsonify({"message": "Password updated"})

    return jsonify({"error": "User not found"}), 404


# Function use in questionnaire
@app.route("/recommend-ai", methods=["POST"])
def generate_ai_drink_recommendations():
    data = request.json

    prompt = f"""
        You are a beverage AI expert.
        
        User preferences:
        - Diet: {data.get('diet')}
        - Drink Type: {data.get('drinkType')}
        - Alcohol: {data.get('alcohol')}
        - Cocktail: {data.get('cocktail')}
        - Style: {data.get('style')}
        - Flavor: {data.get('flavor')}
        - Sweet-Bitter Scale: {data.get('scale')}
        - Temperature: {data.get('temp')}
        
        Return ONLY valid JSON:
        {{
          "recommendations": [
            {{
              "drink": "string",
              "score": 1,
              "reason": "string"
            }},
            {{
              "drink": "string",
              "score": 1,
              "reason": "string"
            }},
            {{
              "drink": "string",
              "score": 1,
              "reason": "string"
            }}
          ]
        }}
        """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        text = response.text.strip()

        print("RAW GEMINI OUTPUT:\n", text)  # <--- IMPORTANT DEBUG

        text = text.replace("```json", "").replace("```", "").strip()

        result = json.loads(text)

        return jsonify({
            "mode": "taste_intelligence",
            "recommendations": result["recommendations"]
        })

    except Exception as e:
        print("ERROR:", e)

        return jsonify({
            "mode": "taste_intelligence",
            "recommendations": [
                {
                    "drink": "Citrus Basil Spritz",
                    "score": 9,
                    "reason": "Bright citrus notes with herbal basil freshness. Great for light and refreshing taste preferences."
                },
                {
                    "drink": "Smoked Vanilla Old Fashioned",
                    "score": 8,
                    "reason": "Deep smoky sweetness balanced with smooth vanilla warmth. Ideal for bold and classic profiles."
                },
                {
                    "drink": "Hibiscus Ginger Cooler",
                    "score": 8,
                    "reason": "Floral hibiscus combined with spicy ginger creates a refreshing and slightly tangy profile."
                }
            ]
        })



# HELPER FUNCTIONS for generate_ai_drink_recommendations();
def build_taste_profile(data):
    prompt = f"""
        You are a beverage psychology AI.
        Return ONLY valid JSON.
        User:
        - Diet: {data.get('diet')}
        - Drink Type: {data.get('drinkType')}
        - Alcohol: {data.get('alcohol')}
        - Flavor: {data.get('flavor')}
        - Sweet-Bitter Scale: {data.get('scale')}
        - Style: {data.get('style')}
        
        Format:
        {{
          "category": "",
          "description": "",
          "recommendation_style": ""
        }}
        """
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    text = response.text.strip()
    # Clean code blocks
    text = text.replace("```json", "").replace("```", "").strip()

    json_match = re.search(r"\{[\s\S]*\}", text)
    if not json_match:
        raise ValueError("Invalid taste profile JSON")

    return json.loads(json_match.group())


# Review
@app.route("/review", methods=["POST"])
def add_review():
    data = request.get_json()

    # Load existing diary entries
    try:
        with open(DIARY_FILE, "r") as f:
            entries = json.load(f)
    except FileNotFoundError:
        entries = []

    # Assign new ID
    max_id = max([entry.get("id", 0) for entry in entries], default=0)
    new_entry = {
        "id": max_id + 1,
        "user_id": data.get("user_id", 0),
        "meal": data.get("meal", ""),
        "drink": data.get("drink", ""),
        "likedIt": data.get("likedIt", ""),
        "cost": data.get("cost", ""),
        "rating": data.get("rating", ""),
        "alcohol": data.get("alcohol", ""),
        "abv": data.get("abv", ""),
        "notes": data.get("notes", ""),
        "ingredients": data.get("ingredients", ""),
        "date": data.get("date", "")
    }

    entries.append(new_entry)

    with open(DIARY_FILE, "w") as f:
        json.dump(entries, f, indent=4)

    return jsonify({"message": "Review saved", "entry": new_entry}), 201


# Get post reviews for a user
@app.route("/reviews/<int:user_id>", methods=["GET"])
def get_reviews(user_id):
    try:
        with open(DIARY_FILE, "r") as f:
            entries = json.load(f)
    except FileNotFoundError:
        entries = []

    user_reviews = [e for e in entries if e.get("user_id") == user_id]
    return jsonify(user_reviews)



# Review feedback
@app.route("/diary/<int:entry_id>/feedback", methods=["POST"])
def review_feedback(entry_id):
    data = request.get_json()

    try:
        with open(DIARY_FILE, "r") as f:
            entries = json.load(f)

        for entry in entries:
            if entry["id"] == entry_id:
                entry["feedback"] = data.get("feedback")

        with open(DIARY_FILE, "w") as f:
            json.dump(entries, f, indent=4)

        return jsonify({"message": "Feedback updated"})
    except Exception as e:
        return jsonify({"error": str(e)})


# Count thumb up and thumb down
@app.route("/diary/<int:entry_id>/thumb", methods=["POST"])
def update_thumb(entry_id):
    data = request.get_json()
    action = data.get("action")  # "up" or "down"

    try:
        with open(DIARY_FILE, "r") as f:
            entries = json.load(f)

        for entry in entries:
            if entry["id"] == entry_id:

                # initialize if missing
                if "thumbUp" not in entry:
                    entry["thumbUp"] = 0
                if "thumbDown" not in entry:
                    entry["thumbDown"] = 0

                if action == "up":
                    entry["thumbUp"] += 1
                elif action == "down":
                    entry["thumbDown"] += 1

        with open(DIARY_FILE, "w") as f:
            json.dump(entries, f, indent=4)

        return jsonify({"message": "updated"})

    except Exception as e:
        return jsonify({"error": str(e)})


@app.route("/review/thumb-up/<int:entry_id>", methods=["POST"])
def thumb_up(entry_id):
    with open(DIARY_FILE, "r") as f:
        entries = json.load(f)

    for entry in entries:
        if entry["id"] == entry_id:
            entry["thumbUp"] = entry.get("thumbUp", 0) + 1

    with open(DIARY_FILE, "w") as f:
        json.dump(entries, f, indent=4)

    return jsonify({"message": "thumb up updated"})


@app.route("/review/thumb-down/<int:entry_id>", methods=["POST"])
def thumb_down(entry_id):
    with open(DIARY_FILE, "r") as f:
        entries = json.load(f)

    for entry in entries:
        if entry["id"] == entry_id:
            entry["thumbDown"] = entry.get("thumbDown", 0) + 1

    with open(DIARY_FILE, "w") as f:
        json.dump(entries, f, indent=4)

    return jsonify({"message": "thumb down updated"})


if __name__ == "__main__":
    app.run(debug=True)