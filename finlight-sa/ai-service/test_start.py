#!/usr/bin/env python3

try:
    print("Testing AI service imports...")

    from app.categorizer import TransactionCategorizer
    print("✓ Categorizer imported successfully")

    from app.ocr import OCRService
    print("✓ OCR service imported successfully")

    from fastapi import FastAPI
    print("✓ FastAPI imported successfully")

    # Try to initialize services
    categorizer = TransactionCategorizer()
    print("✓ Categorizer initialized successfully")

    ocr_service = OCRService()
    print("✓ OCR service initialized successfully")

    print("\nAll imports and initializations successful!")
    print("AI service should start properly now.")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()