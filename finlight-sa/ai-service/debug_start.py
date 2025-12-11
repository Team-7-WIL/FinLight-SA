#!/usr/bin/env python3

import sys
import traceback

try:
    with open('debug.log', 'w') as f:
        f.write("Starting AI service debug...\n")

        f.write("Python version: " + sys.version + "\n")
        f.write("Python path: " + str(sys.path) + "\n")

        f.write("\nTesting imports...\n")

        # Test basic imports
        import fastapi
        f.write("✓ FastAPI imported\n")

        import uvicorn
        f.write("✓ Uvicorn imported\n")

        import numpy as np
        f.write("✓ NumPy imported\n")

        import pandas as pd
        f.write("✓ Pandas imported (version: " + pd.__version__ + ")\n")

        from sklearn.feature_extraction.text import TfidfVectorizer
        f.write("✓ Scikit-learn imported\n")

        import joblib
        f.write("✓ Joblib imported\n")

        # Test app imports
        from app.categorizer import TransactionCategorizer
        f.write("✓ Categorizer imported\n")

        from app.ocr import OCRService
        f.write("✓ OCR service imported\n")

        # Test service initialization
        categorizer = TransactionCategorizer()
        f.write("✓ Categorizer initialized\n")

        ocr_service = OCRService()
        f.write("✓ OCR service initialized\n")

        f.write("\nAll tests passed! AI service should work.\n")

except Exception as e:
    with open('debug.log', 'a') as f:
        f.write(f"\n❌ Error: {e}\n")
        f.write("Traceback:\n")
        f.write(traceback.format_exc())

print("Debug log written to debug.log")