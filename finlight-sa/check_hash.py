import sqlite3

db = sqlite3.connect('C:\\Users\\hanna\\Downloads\\finlight-sa\\backend\\FinLightSA.API\\finlight-local.db')
cursor = db.cursor()
cursor.execute('SELECT Email, PasswordHash FROM users WHERE Email = ?', ('sboy@gmail.com',))
result = cursor.fetchone()
if result:
    print(f'Email: {result[0]}')
    print(f'Full Hash: {result[1]}')
    print(f'Hash length: {len(result[1])}')
else:
    print('User not found')
db.close()
