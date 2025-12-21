import re
from datetime import datetime
from typing import Dict, List, Optional
import base64
from io import BytesIO
from PIL import Image
import pytesseract
import os

class OCRService:
    def __init__(self):
        self.vision_available = False
        try:
            # Try to use Tesseract OCR
            # Check if tesseract is available
            try:
                # Test if tesseract is installed
                pytesseract.get_tesseract_version()
                self.vision_available = True
                print("✓ Tesseract OCR service enabled")
            except Exception as e:
                print(f"⚠ Tesseract not found in PATH: {e}")
                print("ℹ Attempting to locate Tesseract installation...")
                # Try to set tesseract path (common Windows location)
                if os.name == 'nt':  # Windows
                    possible_paths = [
                        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
                        r'C:\Users\{}\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'.format(os.environ.get('USERNAME', '')),
                        r'C:\Users\{}\tesseract-ocr\tesseract.exe'.format(os.environ.get('USERNAME', '')),
                        r'C:\ProgramData\chocolatey\lib\tesseract\tools\tesseract.exe',
                        # Additional Windows paths
                        r'C:\Tesseract-OCR\tesseract.exe',
                        r'C:\tesseract\tesseract.exe',
                        # Check environment variable
                        os.environ.get('TESSERACT_PATH', ''),
                    ]
                    found = False
                    for path in possible_paths:
                        if path and os.path.exists(path):
                            pytesseract.pytesseract.tesseract_cmd = path
                            try:
                                pytesseract.get_tesseract_version()
                                self.vision_available = True
                                print(f"✓ Tesseract found at: {path}")
                                found = True
                                break
                            except Exception as verify_error:
                                print(f"✗ Path exists but failed to verify: {path} ({verify_error})")
                                continue
                    
                    if not found:
                        print("\n✗ Tesseract OCR not found!")
                        print("📍 Please install Tesseract from: https://github.com/tesseract-ocr/tesseract")
                        print("📍 Common installation paths:")
                        print("   - Default: C:\\Program Files\\Tesseract-OCR\\tesseract.exe")
                        print("   - Alternative: C:\\Program Files (x86)\\Tesseract-OCR\\tesseract.exe")
                        print("🔧 Or set TESSERACT_PATH environment variable")
                else:
                    # Non-Windows systems
                    possible_paths = [
                        '/usr/bin/tesseract',
                        '/usr/local/bin/tesseract',
                        '/opt/tesseract/bin/tesseract',
                        os.environ.get('TESSERACT_PATH', ''),
                    ]
                    for path in possible_paths:
                        if path and os.path.exists(path):
                            pytesseract.pytesseract.tesseract_cmd = path
                            try:
                                pytesseract.get_tesseract_version()
                                self.vision_available = True
                                print(f"✓ Tesseract found at: {path}")
                                break
                            except:
                                continue
                    
                    if not self.vision_available:
                        print("✗ Tesseract OCR not found!")
                        print("Install with: apt-get install tesseract-ocr (Ubuntu/Debian)")
        except Exception as e:
            print(f"✗ OCR initialization error: {e}")

    def is_available(self) -> bool:
        return self.vision_available
    
    def extract_receipt_data(self, image_bytes: bytes) -> Dict:
        """
        Extract structured data from a receipt image using Tesseract OCR
        """
        if not self.vision_available:
            # Fallback to mock data if Tesseract is not available
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
        
        try:
            # Convert bytes to PIL Image
            image = Image.open(BytesIO(image_bytes))
            
            # Perform OCR
            text = pytesseract.image_to_string(image, lang='eng')
            
            # Parse the extracted text
            vendor = self.parse_vendor(text)
            amount = self.parse_amount(text)
            date = self.parse_date(text)
            vat_amount = self.parse_vat(text)
            items = self.parse_items(text)
            
            return {
                "vendor": vendor or "Unknown Vendor",
                "amount": amount or 0.0,
                "date": date or datetime.now().isoformat(),
                "vat_amount": vat_amount,
                "items": items
            }
        except Exception as e:
            print(f"OCR extraction error: {e}")
            # Return minimal data on error
            return {
                "vendor": "Unknown Vendor",
                "amount": 0.0,
                "date": datetime.now().isoformat(),
                "vat_amount": 0.0,
                "items": []
            }
    
    def extract_text_from_image(self, image_bytes: bytes) -> str:
        """
        Extract raw text from an image using Tesseract OCR
        """
        if not self.vision_available:
            return "OCR not available"
        
        try:
            image = Image.open(BytesIO(image_bytes))
            text = pytesseract.image_to_string(image, lang='eng')
            return text
        except Exception as e:
            print(f"Text extraction error: {e}")
            return ""
    
    def parse_amount(self, text: str) -> Optional[float]:
        """
        Extract monetary amounts from text
        """
        # Look for currency patterns - prioritize TOTAL line
        patterns = [
            r'(?:TOTAL|Total)\s+[\$R]?\s*(\d+[\.,\-]\d{2})',  # TOTAL $27.96 or Total 255-00
            r'R\s*(\d+[\.,]\d{2})',  # R 100.00
            r'[\$R]\s*(\d+[\.,\-]\d{2})',  # $100.00 or R100.00
            r'(\d+[\.,]\d{2})\s*(?:ZAR|USD|EUR)',  # 100.00 ZAR
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(',', '.').replace('-', '.')
                try:
                    return float(amount_str)
                except ValueError:
                    continue
        
        return None
    
    def parse_vendor(self, text: str) -> Optional[str]:
        """
        Extract vendor name from text (usually first line or after "FROM", "VENDOR", etc.)
        """
        lines = text.split('\n')
        for i, line in enumerate(lines[:5]):  # Check first 5 lines
            line = line.strip()
            if line and len(line) > 3:
                # Skip common receipt headers
                if not any(keyword in line.upper() for keyword in ['RECEIPT', 'INVOICE', 'DATE', 'TOTAL', 'AMOUNT']):
                    return line
        return None
    
    def parse_vat(self, text: str) -> Optional[float]:
        """
        Extract VAT amount from text
        """
        patterns = [
            r'(?:GST|VAT)\s+(?:Included in Total|Amount)[:\s]+[\$R]?\s*(\d+[\.,\-]\d{2})',
            r'(?:GST|VAT)[:\s]+[\$R]?\s*(\d+[\.,\-]\d{2})',
            r'TAX[:\s]+[\$R]?\s*(\d+[\.,\-]\d{2})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(',', '.').replace('-', '.')
                try:
                    return float(amount_str)
                except ValueError:
                    continue
        
        return None
    
    def parse_items(self, text: str) -> List[dict]:
        """
        Extract line items from receipt text
        """
        items = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Look for lines that might be items (contain numbers and text)
            # Pattern: description followed by price
            item_pattern = r'(.+?)\s+R?\s*(\d+[\.,]\d{2})\s*$'
            match = re.search(item_pattern, line)
            if match:
                description = match.group(1).strip()
                price_str = match.group(2).replace(',', '.')
                
                # Skip if it's a total or subtotal
                if any(keyword in description.upper() for keyword in ['TOTAL', 'SUBTOTAL', 'VAT', 'TAX', 'BALANCE']):
                    continue
                
                try:
                    price = float(price_str)
                    items.append({
                        "description": description,
                        "quantity": 1,
                        "unit_price": price,
                        "total": price
                    })
                except ValueError:
                    continue
        
        return items[:10]  # Limit to 10 items
    
    def parse_date(self, text: str) -> Optional[str]:
        """
        Extract date from text
        """
        # Look for date patterns
        patterns = [
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',  # DD/MM/YYYY or MM/DD/YYYY
            r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})',  # YYYY/MM/DD
            r'(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})',  # DD Mon YYYY
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        
        return None
