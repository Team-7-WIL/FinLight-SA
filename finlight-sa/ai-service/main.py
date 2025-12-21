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

@app.post("/extract-bank-statement")
async def extract_bank_statement(file: UploadFile = File(...)):
    """
    Extract bank statement transactions from PDF or Excel file
    Returns structured transaction data
    """
    try:
        if file.content_type not in ["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "text/csv"]:
            raise HTTPException(status_code=400, detail="File must be PDF, Excel, or CSV")

        contents = await file.read()
        
        # For PDF files, use OCR to extract text
        if file.content_type == "application/pdf" or file.filename.endswith(".pdf"):
            try:
                import PyPDF2
                from io import BytesIO
                
                pdf_file = BytesIO(contents)
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                
                extracted_text = ""
                for page in pdf_reader.pages:
                    extracted_text += page.extract_text() + "\n"
                
                # Parse the extracted text for transactions
                transactions = parse_bank_statement_text(extracted_text)
                
                return {
                    "success": True,
                    "transactions": transactions,
                    "source": "PDF_OCR",
                    "raw_text": extracted_text[:500]  # Return first 500 chars of raw text
                }
            except Exception as e:
                print(f"PDF extraction error: {e}")
                # Try with Tesseract as fallback
                if ocr_service.is_available():
                    extracted_text = extract_text_from_pdf_via_ocr(contents)
                    transactions = parse_bank_statement_text(extracted_text)
                    return {
                        "success": True,
                        "transactions": transactions,
                        "source": "OCR_Tesseract",
                        "raw_text": extracted_text[:500]
                    }
        
        # For CSV files
        if file.filename.endswith(".csv"):
            csv_text = contents.decode('utf-8')
            transactions = parse_csv_bank_statement(csv_text)
            return {
                "success": True,
                "transactions": transactions,
                "source": "CSV"
            }
        
        return {
            "success": False,
            "message": "Unable to extract transactions from this file",
            "transactions": []
        }
        
    except Exception as e:
        print(f"Bank statement extraction error: {e}")
        raise HTTPException(status_code=500, detail=f"Extraction error: {str(e)}")

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


def parse_bank_statement_text(text: str) -> List[dict]:
    """
    Parse bank statement text to extract transactions
    Looks for common bank statement formats with date, description, and amount
    """
    import re
    from datetime import datetime
    
    transactions = []
    lines = text.split('\n')
    
    # Pattern to match transaction lines: Date | Description | Amount
    # Patterns for common formats:
    # 1. DD/MM/YYYY, description, amount
    # 2. DD-MM-YYYY, description, amount
    # 3. YYYY-MM-DD, description, amount
    
    patterns = [
        # Date (various formats) | Description | Amount (with currency)
        r'(\d{1,2}[-/]\d{1,2}[-/]\d{4})\s*[|\t]\s*(.+?)\s*[|\t]\s*([-]?\d+[\.,\d]*)\s*',
        # Date | Description | Debit/Credit | Amount
        r'(\d{1,2}[-/]\d{1,2}[-/]\d{4})\s*[|\t]\s*(.+?)\s*[|\t]\s*(Debit|Credit)\s*[|\t]\s*([\d\.,]+)',
        # Amount at end with currency symbol
        r'(\d{1,2}[-/]\d{1,2}[-/]\d{4})\s+(.+?)\s+([\d\.,]+)\s*(R|ZAR|USD)',
    ]
    
    for line in lines:
        line = line.strip()
        if not line or len(line) < 10:
            continue
        
        for pattern in patterns:
            matches = re.search(pattern, line)
            if matches:
                try:
                    # Extract components
                    if len(matches.groups()) >= 3:
                        date_str = matches.group(1)
                        description = matches.group(2)
                        
                        # Handle different group counts for amount
                        if len(matches.groups()) == 4:
                            amount_str = matches.group(4)
                        else:
                            amount_str = matches.group(3)
                        
                        # Parse date
                        for date_format in ['%d/%m/%Y', '%d-%m-%Y', '%m/%d/%Y', '%Y-%m-%d', '%d %b %Y', '%d %B %Y']:
                            try:
                                parsed_date = datetime.strptime(date_str, date_format)
                                break
                            except ValueError:
                                continue
                        else:
                            parsed_date = datetime.now()
                        
                        # Parse amount
                        amount_str = amount_str.replace(',', '.').replace('-', '')
                        amount = float(amount_str) if amount_str else 0.0
                        
                        # Determine direction
                        direction = "Credit" if amount >= 0 else "Debit"
                        
                        # Clean description
                        description = description.strip().replace('|', '').replace('\t', '').strip()
                        
                        if description and amount > 0:
                            transactions.append({
                                "date": parsed_date.isoformat(),
                                "description": description,
                                "amount": str(abs(amount)),
                                "direction": direction,
                                "reference": ""
                            })
                            break
                except Exception as e:
                    print(f"Error parsing line: {line} - {e}")
                    continue
    
    return transactions


def parse_csv_bank_statement(csv_content: str) -> List[dict]:
    """
    Parse CSV bank statement format
    Expected format: Date, Description, Amount, Reference (header row)
    """
    import csv
    from io import StringIO
    from datetime import datetime
    
    transactions = []
    
    try:
        reader = csv.reader(StringIO(csv_content))
        header = next(reader, None)  # Skip header
        
        for row in reader:
            if len(row) < 3 or not row[0].strip():
                continue
            
            try:
                date_str = row[0].strip()
                description = row[1].strip() if len(row) > 1 else ""
                amount_str = row[2].strip() if len(row) > 2 else "0"
                reference = row[3].strip() if len(row) > 3 else ""
                
                # Parse date
                parsed_date = None
                for date_format in ['%d/%m/%Y', '%d-%m-%Y', '%m/%d/%Y', '%Y-%m-%d']:
                    try:
                        parsed_date = datetime.strptime(date_str, date_format)
                        break
                    except ValueError:
                        continue
                
                if not parsed_date:
                    continue
                
                # Parse amount
                amount_str = amount_str.replace(',', '.').replace('R', '').replace('ZAR', '').strip()
                amount = float(amount_str) if amount_str else 0.0
                
                direction = "Credit" if amount >= 0 else "Debit"
                
                if description and amount != 0:
                    transactions.append({
                        "date": parsed_date.isoformat(),
                        "description": description,
                        "amount": str(abs(amount)),
                        "direction": direction,
                        "reference": reference
                    })
            except Exception as e:
                print(f"Error parsing CSV row: {row} - {e}")
                continue
    except Exception as e:
        print(f"CSV parsing error: {e}")
    
    return transactions


def extract_text_from_pdf_via_ocr(pdf_bytes: bytes) -> str:
    """
    Extract text from PDF using Tesseract OCR
    Converts PDF pages to images and runs OCR on them
    """
    try:
        import io
        from pdf2image import convert_from_bytes
        
        # Convert PDF to images
        images = convert_from_bytes(pdf_bytes)
        
        extracted_text = ""
        for image in images:
            # Run OCR on each image
            text = ocr_service.extract_text_from_image(image)
            extracted_text += text + "\n---PAGE BREAK---\n"
        
        return extracted_text
    except Exception as e:
        print(f"PDF OCR extraction error: {e}")
        return ""


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)