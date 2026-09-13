import os
try:
    import joblib
except ImportError:
    joblib = None

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "ml_training", "models", "difficulty_predictor.pkl")

# We will load the model globally so it's only loaded once in memory when the server starts
model_pipeline = None

def load_model():
    global model_pipeline
    if model_pipeline is None:
        try:
            if joblib and os.path.exists(MODEL_PATH):
                model_pipeline = joblib.load(MODEL_PATH)
                print(f"Successfully loaded ML model from {MODEL_PATH}")
            elif not joblib:
                print("Warning: joblib not installed, ML model cannot be loaded.")
            else:
                print(f"Warning: ML model not found at {MODEL_PATH}. Prediction features will be disabled.")
        except Exception as e:
            print(f"Error loading ML model: {e}")

def predict_difficulty(question_text: str) -> str:
    if model_pipeline is None:
        load_model()
        
    if model_pipeline is None:
        return "Unknown (Model Not Loaded)"
        
    try:
        # The pipeline expects an iterable of strings
        prediction = model_pipeline.predict([question_text])
        return prediction[0]
    except Exception as e:
        print(f"Prediction error: {e}")
        return "Error predicting difficulty"
