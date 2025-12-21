import sqlite3
import bcrypt

# The password we want to use
password = 'SharkBoy@123'
# Generate a new hash
new_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

print(f'New hash: {new_hash}')

# Update the database
db = sqlite3.connect('C:\\Users\\hanna\\Downloads\\finlight-sa\\backend\\FinLightSA.API\\finlight-local.db')
cursor = db.cursor()
cursor.execute('UPDATE users SET PasswordHash = ? WHERE Email = ?', (new_hash, 'sboy@gmail.com'))
db.commit()
db.close()

print('Password hash updated successfully!')
print(f'User can now login with:')
print(f'  Email: sboy@gmail.com')
print(f'  Password: SharkBoy@123')
