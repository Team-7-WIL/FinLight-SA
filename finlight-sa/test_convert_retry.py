import requests
import json
import time

BASE_URL = "http://localhost:5175/api"
QUOTATION_ID = "1D79935B-476A-45ED-B12D-66744B9DBB75"

def test_with_retry():
    max_retries = 10
    retry_delay = 1
    
    for attempt in range(max_retries):
        try:
            print(f"\n[Attempt {attempt + 1}/{max_retries}] Logging in...")
            login_response = requests.post(f"{BASE_URL}/auth/login", json={
                "email": "sboy@gmail.com",
                "password": "SharkBoy@123"
            }, timeout=10)

            print(f"Login status: {login_response.status_code}")
            if login_response.status_code == 200:
                data = login_response.json()
                if data.get('success'):
                    token = data['data']['token']
                    print(f"✓ Token received: {token[:30]}...")
                    
                    # Step 2: Try to convert quotation to invoice
                    print(f"\n[Converting] Quotation {QUOTATION_ID} to invoice...")
                    headers = {
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json"
                    }
                    
                    convert_response = requests.post(
                        f"{BASE_URL}/quotations/{QUOTATION_ID}/convert-to-invoice",
                        headers=headers,
                        json={},
                        timeout=10
                    )
                    
                    print(f"Convert status: {convert_response.status_code}")
                    response_json = convert_response.json()
                    print(f"Response:\n{json.dumps(response_json, indent=2)}")
                    
                    if response_json.get('success'):
                        print("\n✓ SUCCESS: Quotation converted to invoice!")
                    else:
                        print(f"\n✗ FAILED: {response_json.get('message')}")
                    return
                else:
                    print(f"✗ Login failed: {data.get('message')}")
                    return
            else:
                print(f"✗ Login returned status {login_response.status_code}")
                print(f"Response: {login_response.text[:200]}")
        except requests.exceptions.ConnectionError as e:
            print(f"✗ Connection refused")
            if attempt < max_retries - 1:
                print(f"  Retrying in {retry_delay}s...")
                time.sleep(retry_delay)
        except Exception as e:
            print(f"✗ Error: {e}")
            break
    
    print("\n✗ All retries failed")

test_with_retry()
