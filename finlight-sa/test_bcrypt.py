import bcrypt

stored_hash = '$2a$11$.t8JF2ecxBkwJ4ck7yYgauhnVM9USJWBjHBfVPz3mIWFPcYwVVvpi'
password = 'SharkBoy@123'

# Test if password matches the hash
try:
    is_valid = bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8'))
    print(f'Password valid: {is_valid}')
except Exception as e:
    print(f'Error: {e}')

# Also try creating a new hash and checking it
new_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
print(f'New hash would be: {new_hash.decode()}')
