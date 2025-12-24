#!/usr/bin/env python3
"""
Script to recreate Shark Boy user account in FinLight SA
"""
import requests
import json

API_URL = "http://localhost:5175/api"

# Register Shark Boy
register_data = {
    "email": "sboy@gmail.com",
    "password": "SharkBoy@123",
    "fullName": "Shark Boy",
    "businessName": "Shark Boy Enterprises",
    "phone": "+27123456789"
}

print("Registering Shark Boy account...")
try:
    response = requests.post(
        f"{API_URL}/auth/register",
        json=register_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("\n✅ Shark Boy account created successfully!")
        auth_response = response.json().get("data", {})
        if auth_response:
            print(f"Token: {auth_response.get('token', 'N/A')[:50]}...")
            print(f"Business ID: {auth_response.get('businessId', 'N/A')}")
            print(f"User ID: {auth_response.get('userId', 'N/A')}")
    else:
        print("\n❌ Failed to create account")
        
except Exception as e:
    print(f"Error: {e}")
    print("Make sure the backend API is running on http://localhost:5175")
