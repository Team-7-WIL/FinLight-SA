import sqlite3

db_path = r"c:\Users\hanna\Downloads\finlight-sa\backend\FinLightSA.API\finlight-local.db"

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all users
    cursor.execute("SELECT Id, FullName, Email, PasswordHash FROM users")
    users = cursor.fetchall()
    
    print("=" * 80)
    print("USERS IN DATABASE:")
    print("=" * 80)
    
    if not users:
        print("❌ NO USERS FOUND IN DATABASE")
    else:
        for user in users:
            user_id, full_name, email, password_hash = user
            print(f"\nID: {user_id}")
            print(f"Name: {full_name}")
            print(f"Email: {email}")
            print(f"Password Hash: {password_hash[:50]}...")  # Show first 50 chars
            
    # Check if sboy@gmail.com exists
    cursor.execute("SELECT COUNT(*) FROM users WHERE Email = ?", ("sboy@gmail.com",))
    count = cursor.fetchone()[0]
    print(f"\n✓ sboy@gmail.com exists: {count > 0}")
    
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
