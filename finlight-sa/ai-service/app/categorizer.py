import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
import joblib
import os
from typing import Dict, List
from datetime import datetime

class TransactionCategorizer:
    def __init__(self, model_path="./models"):
        self.model_path = model_path
        self.model = None
        self.vectorizer = None
        self.categories = [
            "Rent", "Utilities", "Fuel", "Transport", "Office Supplies",
            "Marketing", "Salaries", "Inventory", "Meals & Entertainment",
            "Professional Fees", "Insurance", "Maintenance", "Technology",
            "Bank Charges", "Taxes", "Other"
        ]
        
        # Create models directory if it doesn't exist
        os.makedirs(model_path, exist_ok=True)
        
        # Load or create model
        self.load_or_create_model()
    
    def load_or_create_model(self):
        """Load existing model or create and train a new one"""
        model_file = os.path.join(self.model_path, "categorizer_model.pkl")
        
        if os.path.exists(model_file):
            try:
                self.model = joblib.load(model_file)
                print("Loaded existing model")
            except Exception as e:
                print(f"Error loading model: {e}. Creating new model.")
                self.create_initial_model()
        else:
            self.create_initial_model()
    
    def create_initial_model(self):
        """Create and train an initial model with synthetic data"""
        # Sample training data (in production, this would come from a database)
        training_data = [
            ("monthly rent payment", "Rent"),
            ("office space rental", "Rent"),
            ("electricity bill", "Utilities"),
            ("water and sanitation", "Utilities"),
            ("internet service provider", "Utilities"),
            ("petrol station", "Fuel"),
            ("diesel fuel", "Fuel"),
            ("uber trip", "Transport"),
            ("taxi fare", "Transport"),
            ("bus ticket", "Transport"),
            ("printer paper", "Office Supplies"),
            ("stationery store", "Office Supplies"),
            ("google ads", "Marketing"),
            ("facebook advertising", "Marketing"),
            ("salary payment", "Salaries"),
            ("staff wages", "Salaries"),
            ("stock purchase", "Inventory"),
            ("supplier payment", "Inventory"),
            ("restaurant", "Meals & Entertainment"),
            ("coffee shop", "Meals & Entertainment"),
            ("accountant fees", "Professional Fees"),
            ("legal services", "Professional Fees"),
            ("business insurance", "Insurance"),
            ("vehicle insurance", "Insurance"),
            ("repair services", "Maintenance"),
            ("building maintenance", "Maintenance"),
            ("software subscription", "Technology"),
            ("cloud hosting", "Technology"),
            ("bank service fee", "Bank Charges"),
            ("transaction fee", "Bank Charges"),
            ("vat payment", "Taxes"),
            ("income tax", "Taxes"),
        ]
        
        # Create DataFrame
        df = pd.DataFrame(training_data, columns=["description", "category"])
        
        # Create pipeline with TF-IDF vectorizer and Naive Bayes classifier
        self.model = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=1000, ngram_range=(1, 2))),
            ('clf', MultinomialNB())
        ])
        
        # Train model
        self.model.fit(df["description"], df["category"])
        
        # Save model
        model_file = os.path.join(self.model_path, "categorizer_model.pkl")
        joblib.dump(self.model, model_file)
        print("Created and trained new model")
    
    def predict(self, description: str, amount: float, direction: str) -> Dict:
        """Predict category for a transaction"""
        if self.model is None:
            raise ValueError("Model not loaded")
        
        # Get prediction
        prediction = self.model.predict([description])[0]
        
        # Get probability scores
        probabilities = self.model.predict_proba([description])[0]
        confidence = float(max(probabilities))
        
        # Get top 3 alternative categories
        top_indices = np.argsort(probabilities)[-3:][::-1]
        classes = self.model.classes_
        alternatives = [
            {"category": classes[i], "confidence": float(probabilities[i])}
            for i in top_indices[1:]  # Skip the top prediction
        ]
        
        return {
            "category": prediction,
            "confidence": confidence,
            "alternatives": alternatives
        }
    
    def add_feedback(self, description: str, predicted_category: str, 
                     correct_category: str, amount: float):
        """Store feedback for future retraining"""
        feedback_file = os.path.join(self.model_path, "feedback.csv")
        
        feedback_data = {
            "description": description,
            "predicted_category": predicted_category,
            "correct_category": correct_category,
            "amount": amount,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        df = pd.DataFrame([feedback_data])
        
        # Append to existing feedback file
        if os.path.exists(feedback_file):
            df.to_csv(feedback_file, mode='a', header=False, index=False)
        else:
            df.to_csv(feedback_file, index=False)
    
    def retrain(self):
        """Retrain model with accumulated feedback"""
        feedback_file = os.path.join(self.model_path, "feedback.csv")
        
        if not os.path.exists(feedback_file):
            return {"message": "No feedback data available for retraining"}
        
        # Load feedback data
        feedback_df = pd.read_csv(feedback_file)
        
        if len(feedback_df) < 10:
            return {"message": "Insufficient feedback data for retraining"}
        
        # Retrain model with correct categories
        X = feedback_df["description"]
        y = feedback_df["correct_category"]
        
        self.model.fit(X, y)
        
        # Save updated model
        model_file = os.path.join(self.model_path, "categorizer_model.pkl")
        joblib.dump(self.model, model_file)
        
        return {
            "message": "Model retrained successfully",
            "training_samples": len(feedback_df)
        }
