import requests
import json

url = 'http://localhost:5175/api/auth/login'
data = {'email': 'sboy@gmail.com', 'password': 'SharkBoy@123'}

response = requests.post(url, json=data)
print(f'Status: {response.status_code}')
if response.status_code == 200:
    print('✅ Login successful!')
    resp_json = response.json()
    print(f'User: {resp_json["data"]["user"]["fullName"]}')
    print(f'Business: {resp_json["data"]["defaultBusiness"]["name"]}')
else:
    print('❌ Login failed')
    print(f'Response: {json.dumps(response.json(), indent=2)}')
