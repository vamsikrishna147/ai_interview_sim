import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report
import joblib

def preprocess_and_train(csv_file_path):
    print(f"Loading dataset from {csv_file_path}...")
    
    if not os.path.exists(csv_file_path):
        print(f"Error: Could not find dataset at {csv_file_path}")
        return
        
    df = pd.read_csv(csv_file_path)
    
    print("Dataset columns found:", df.columns.tolist())
    df = df.dropna()
    
    # We will build a model to predict 'difficulty' based on the 'question' text.
    if 'question' not in df.columns or 'difficulty' not in df.columns:
        print("Error: The dataset must contain 'question' and 'difficulty' columns.")
        return
        
    X = df['question']
    y = df['difficulty']
    
    print("Splitting data into train/test sets...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Building NLP Pipeline (TF-IDF + Random Forest)...")
    # Using a Pipeline to bundle the vectorizer and the classifier together
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=5000, stop_words='english')),
        ('clf', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    
    print("Training the model... this might take a moment.")
    pipeline.fit(X_train, y_train)
    
    print("Evaluating Model...")
    predictions = pipeline.predict(X_test)
    acc = accuracy_score(y_test, predictions)
    print(f"Model Accuracy on Test Set: {acc:.2f}")
    print("\nClassification Report:\n", classification_report(y_test, predictions))
    
    # Save the pipeline
    os.makedirs('models', exist_ok=True)
    model_path = 'models/difficulty_predictor.pkl'
    
    joblib.dump(pipeline, model_path)
    print(f"Model pipeline saved to {model_path}")

if __name__ == "__main__":
    print("--- Starting Local ML Training Pipeline ---")
    dataset_path = "data/full_interview_questions_dataset.csv" 
    preprocess_and_train(dataset_path)
    print("--- Training Complete ---")
