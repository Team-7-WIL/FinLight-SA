@echo off
echo Installing AI Service Dependencies...
echo.

python -m pip install --upgrade pip
echo.

python -m pip install -r requirements.txt
echo.

echo.
echo Checking installation...
python -c "import pandas; print('pandas:', pandas.__version__)"
python -c "import fastapi; print('fastapi:', fastapi.__version__)"
python -c "import sklearn; print('scikit-learn:', sklearn.__version__)"
python -c "import pytesseract; print('pytesseract:', pytesseract.__version__)"
echo.

echo.
echo Installation complete!
echo You can now start the AI service with: python -m uvicorn main:app --reload --port 8000
pause
