from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
from dotenv import load_dotenv
from app.categorizer import TransactionCategorizer
from app.ocr import OCRService

load_dotenv()

app = FastAPI(
    title="FinLight SA AI Service",
    description="AI-powered categorization and OCR for FinLight SA",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
categorizer = TransactionCategorizer()
ocr_service = OCRService()

# Pydantic models
class Transaction(BaseModel):
    description: str
    amount: float
    direction: str  # "Debit" or "Credit"

class CategoryPrediction(BaseModel):
    category: str
    confidence: float
    alternatives: List[dict]

class TransactionWithPrediction(BaseModel):
    description: str
    amount: float
    direction: str
    predicted_category: str
    confidence: float

class ReceiptData(BaseModel):
    vendor: str
    amount: float
    date: str
    vat_amount: Optional[float]
    items: List[dict]

class FeedbackRequest(BaseModel):
    description: str
    predicted_category: str
    correct_category: str
    amount: float

@app.get("/")
async def root():
    return {
        "service": "FinLight SA AI Service",
        "status": "online",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "categorizer_loaded": categorizer.model is not None,
        "ocr_available": ocr_service.is_available()
    }

@app.post("/categorize", response_model=CategoryPrediction)
async def categorize_transaction(transaction: Transaction):
    """
    Categorize a single transaction based on its description and amount
    """
    try:
        result = categorizer.predict(
            description=transaction.description,
            amount=transaction.amount,
            direction=transaction.direction
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Categorization error: {str(e)}")

@app.post("/categorize/batch", response_model=List[TransactionWithPrediction])
async def categorize_transactions_batch(transactions: List[Transaction]):
    """
    Categorize multiple transactions at once
    """
    try:
        results = []
        for txn in transactions:
            prediction = categorizer.predict(
                description=txn.description,
                amount=txn.amount,
                direction=txn.direction
            )
            results.append(TransactionWithPrediction(
                description=txn.description,
                amount=txn.amount,
                direction=txn.direction,
                predicted_category=prediction["category"],
                confidence=prediction["confidence"]
            ))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch categorization error: {str(e)}")

@app.post("/ocr/receipt", response_model=ReceiptData)
async def extract_receipt_data(file: UploadFile = File(...)):
    """
    Extract data from a receipt image using OCR
    """
    try:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        contents = await file.read()
        result = ocr_service.extract_receipt_data(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR error: {str(e)}")

@app.post("/feedback")
async def submit_feedback(feedback: FeedbackRequest):
    """
    Submit user feedback to improve model accuracy
    """
    try:
        categorizer.add_feedback(
            description=feedback.description,
            predicted_category=feedback.predicted_category,
            correct_category=feedback.correct_category,
            amount=feedback.amount
        )
        return {
            "status": "success",
            "message": "Feedback recorded successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feedback error: {str(e)}")

@app.post("/train")
async def train_model():
    """
    Retrain the categorization model with accumulated feedback
    """
    try:
        result = categorizer.retrain()
        return {
            "status": "success",
            "message": "Model retrained successfully",
            "metrics": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

# ai-service/app/categorizer.py
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

# ai-service/app/ocr.py
import re
from datetime import datetime
from typing import Dict, List, Optional
import base64

class OCRService:
    def __init__(self):
        # In production, initialize Google Cloud Vision API here
        self.vision_available = False
        try:
            # Attempt to import Google Cloud Vision
            # from google.cloud import vision
            # self.client = vision.ImageAnnotatorClient()
            # self.vision_available = True
            pass
        except Exception as e:
            print(f"Google Cloud Vision not available: {e}")
    
    def is_available(self) -> bool:
        return self.vision_available
    
    def extract_receipt_data(self, image_bytes: bytes) -> Dict:
        """
        Extract structured data from a receipt image
        """
        # Placeholder implementation - In production, use Google Cloud Vision API
        # For now, return a mock response
        
        # In production, you would:
        # 1. Call Google Cloud Vision API to extract text
        # 2. Parse the text to identify vendor, amount, date, items
        # 3. Return structured data
        
        return {
            "vendor": "Sample Vendor",
            "amount": 0.0,
            "date": datetime.now().isoformat(),
            "vat_amount": 0.0,
            "items": [
                {
                    "description": "Sample Item",
                    "quantity": 1,
                    "unit_price": 0.0,
                    "total": 0.0
                }
            ]
        }
    
    def extract_text_from_image(self, image_bytes: bytes) -> str:
        """
        Extract raw text from an image
        """
        # Placeholder - In production, use Google Cloud Vision API
        return "Sample text from receipt"
    
    def parse_amount(self, text: str) -> Optional[float]:
        """
        Extract monetary amounts from text
        """
        # Look for currency patterns
        patterns = [
            r'R\s*(\d+[\.,]\d{2})',  # R 100.00
            r'(\d+[\.,]\d{2})\s*ZAR',  # 100.00 ZAR
            r'Total[:\s]+R?\s*(\d+[\.,]\d{2})',  # Total: R 100.00
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(',', '.')
                try:
                    return float(amount_str)
                except ValueError:
                    continue
        
        return None
    
    def parse_date(self, text: str) -> Optional[str]:
        """
        Extract date from text
        """
        # Look for date patterns
        patterns = [
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',  # DD/MM/YYYY or MM/DD/YYYY
            r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})',  # YYYY/MM/DD
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1)
        
        return None