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

class ProcessDocumentRequest(BaseModel):
    image: str  # base64 encoded image
    document_type: str  # "receipt" or "invoice"

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

@app.post("/process-document")
async def process_document(request: ProcessDocumentRequest):
    """
    Process a document (receipt or invoice) from base64 image data
    """
    try:
        import base64
        image_bytes = base64.b64decode(request.image)

        if request.document_type.lower() == "receipt":
            result = ocr_service.extract_receipt_data(image_bytes)
            raw_text = ocr_service.extract_text_from_image(image_bytes) if ocr_service.is_available() else ""
            return {
                "vendor": result.get("vendor", "Unknown"),
                "amount": result.get("amount", 0.0),
                "date": result.get("date", ""),
                "vat_amount": result.get("vat_amount", 0.0),
                "items": result.get("items", []),
                "raw_text": raw_text,
                "confidence": 0.8 if ocr_service.is_available() else 0.3  # Lower confidence if OCR not available
            }
        elif request.document_type.lower() == "invoice":
            # For invoices, we can use the same receipt processing for now
            # In a more advanced implementation, we'd have separate invoice parsing
            result = ocr_service.extract_receipt_data(image_bytes)
            return {
                "invoice_number": "",  # Would need separate parsing
                "vendor": result.get("vendor", "Unknown"),
                "customer": "",  # Invoices might have customer info
                "amount": result.get("amount", 0.0),
                "date": result.get("date", ""),
                "due_date": "",  # Would calculate based on terms
                "vat_amount": result.get("vat_amount", 0.0),
                "items": result.get("items", []),
                "raw_text": "",
                "confidence": 0.8
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid document type. Use 'receipt' or 'invoice'")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document processing error: {str(e)}")

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