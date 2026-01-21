import requests
import json
import sys

BASE_URL = "http://localhost:5175/api"
QUOTATION_ID = "1D79935B-476A-45ED-B12D-66744B9DBB75"

# Step 1: Login
print("[1] Logging in...")
login_response = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "sboy@gmail.com",
    "password": "SharkBoy@123"
})

print(f"Login status: {login_response.status_code}")
if login_response.status_code == 200:
    data = login_response.json()
    if data.get('success'):
        token = data['data']['token']
        print(f"Token received: {token[:30]}...")
        
        # Step 2: Try to convert quotation to invoice
        print(f"\n[2] Converting quotation {QUOTATION_ID} to invoice...")
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        convert_response = requests.post(
            f"{BASE_URL}/quotations/{QUOTATION_ID}/convert-to-invoice",
            headers=headers,
            json={}
        )
        
        print(f"Convert status: {convert_response.status_code}")
        print(f"Response: {json.dumps(convert_response.json(), indent=2)}")
    else:
        print(f"Login failed: {data.get('message')}")
        print(f"Full response: {json.dumps(data, indent=2)}")
else:
    print(f"Login error response: {json.dumps(login_response.json(), indent=2)}")
