import sqlite3

db_path = r'backend\FinLightSA.API\finlight-local.db'

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get quotations
cursor.execute("""
SELECT Id, Number, Status, CustomerId, ConvertedToInvoiceId 
FROM Quotations 
LIMIT 5
""")

quotations = cursor.fetchall()
print("Quotations in database:")
if quotations:
    for q in quotations:
        print(f"  ID: {q[0]}, Number: {q[1]}, Status: {q[2]}, CustomerID: {q[3]}, ConvertedToInvoiceId: {q[4]}")
else:
    print("  No quotations found")

# Check if there are any invoices
cursor.execute("SELECT COUNT(*) FROM Invoices")
invoice_count = cursor.fetchone()[0]
print(f"\nTotal invoices in database: {invoice_count}")

conn.close()
