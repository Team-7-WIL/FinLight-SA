import sqlite3
import bcrypt

password = "SharkBoy@123"
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

db_path = r"c:\Users\hanna\Downloads\finlight-sa\backend\FinLightSA.API\finlight-local.db"

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("UPDATE users SET PasswordHash = ? WHERE Email = ?", (hashed, "sboy@gmail.com"))
    conn.commit()
    
    if cursor.rowcount > 0:
        print(f"✅ Password updated successfully!")
        print(f"Email: sboy@gmail.com")
        print(f"New Password: {password}")
        print(f"New Hash: {hashed}")
    else:
        print("❌ User not found")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
