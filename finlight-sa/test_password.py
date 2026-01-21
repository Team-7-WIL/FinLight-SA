import sqlite3
import bcrypt

db_path = r"c:\Users\hanna\Downloads\finlight-sa\backend\FinLightSA.API\finlight-local.db"
test_password = "123456"

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get the user's password hash
    cursor.execute("SELECT Email, PasswordHash FROM users WHERE Email = ?", ("sboy@gmail.com",))
    user = cursor.fetchone()
    
    if not user:
        print("❌ User not found")
    else:
        email, stored_hash = user
        print(f"Email: {email}")
        print(f"Stored Hash: {stored_hash}")
        print(f"\nTesting password: '{test_password}'")
        
        # Test password verification
        try:
            is_valid = bcrypt.checkpw(test_password.encode('utf-8'), stored_hash.encode('utf-8'))
            print(f"✓ Password Match: {is_valid}")
            
            if is_valid:
                print("\n✅ PASSWORD IS CORRECT - Login should succeed!")
            else:
                print("\n❌ PASSWORD IS WRONG - Try different password")
        except Exception as e:
            print(f"Error verifying password: {e}")
    
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
