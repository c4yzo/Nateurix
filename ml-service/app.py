import os
import json
import numpy as np
import uuid
import cv2
import google.generativeai as genai
from dotenv import load_dotenv

from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model

load_dotenv()

app = Flask(__name__)
CORS(app)

# -------------------------
# 1. SETUP GEMINI
# -------------------------
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY is not set in the environment.")
genai.configure(api_key=api_key)

gemini_model = genai.GenerativeModel("models/gemini-2.5-flash")

# -------------------------
# 2. LOAD CNN MODEL
# -------------------------
MODEL_PATH = "plant_model.h5"
MAPPING_PATH = "class_indices.json"

if os.path.exists(MODEL_PATH) and os.path.exists(MAPPING_PATH):

    model = load_model(MODEL_PATH, compile=False)

    with open(MAPPING_PATH) as f:
        class_indices = json.load(f)

    class_names = list(class_indices.keys())

else:
    print("ERROR: plant_model.h5 or class_indices.json not found! Run training first.")
    exit()

# -------------------------
# 3. GEMINI CACHE SYSTEM
# -------------------------
CACHE_FILE = "plant_cache.json"

if os.path.exists(CACHE_FILE):

    with open(CACHE_FILE, "r") as f:
        plant_cache = json.load(f)

else:
    plant_cache = {}

# -------------------------
# 4. GEMINI FUNCTION
# -------------------------
def get_gemini_details(plant_name):

    plant_name = plant_name.lower()

    # If already stored, return cached result
    if plant_name in plant_cache:
        print("Loaded from cache")
        return plant_cache[plant_name]

    try:

        print("Calling Gemini API")

        prompt = (
            f"The AI model identified this plant as '{plant_name}'. "
            f"Provide the following information clearly:\n\n"
            f"1. Scientific Name\n"
            f"2. Best Fertilizer\n"
            f"3. Harvesting Tips\n"
            f"4. Medicinal Uses"
        )

        response = gemini_model.generate_content(prompt)

        plant_info = response.text

        # Save result to cache
        plant_cache[plant_name] = plant_info

        with open(CACHE_FILE, "w") as f:
            json.dump(plant_cache, f, indent=4)

        return plant_info

    except Exception as e:
        return f"Gemini Error: {str(e)}"

# -------------------------
# 5. PREDICTION API
# -------------------------
@app.route("/predict", methods=["POST"])
def predict():

    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]

    # Create temp folder if not exists
    if not os.path.exists("temp"):
        os.makedirs("temp")

    filename = str(uuid.uuid4()) + ".png"
    filepath = os.path.join("temp", filename)

    file.save(filepath)

    # -------------------------
    # Image preprocessing
    # -------------------------
    img = cv2.imread(filepath)
    img = cv2.resize(img, (224, 224))
    img = img / 255.0
    img = np.expand_dims(img, axis=0)

    # -------------------------
    # CNN Prediction
    # -------------------------
    prediction = model.predict(img)

    index = np.argmax(prediction)

    detected_plant = class_names[index]

    confidence = float(np.max(prediction))

    # -------------------------
    # CONFIDENCE FILTER
    # -------------------------
    if confidence < 0.6:
        detected_plant = "Unknown Plant"
        plant_info = "The model is not confident about this plant."
    else:
        plant_info = get_gemini_details(detected_plant)

    # Delete temp file after processing
    if os.path.exists(filepath):
        os.remove(filepath)

    # -------------------------
    # Send result to frontend
    # -------------------------
    return jsonify({
        "plant": detected_plant.replace("_", " ").title(),
        "confidence": f"{confidence * 100:.2f}%",
        "details": plant_info
    })

# -------------------------
# 6. RUN SERVER
# -------------------------
if __name__ == "__main__":
    app.run(port=5001, debug=True)