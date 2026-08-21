import sys
import os

# Add parent directory to path so we can import server package
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.database import SessionLocal
from server.models import Member, Contributor, Event

def test():
    db = SessionLocal()
    try:
        members = db.query(Member).all()
        contributors = db.query(Contributor).all()
        
        actual_contributions = [
            {"name": "Loku Tn", "paid": 350.00, "balance": 550.00, "method": "UPI"},
            {"name": "Hema Raj", "paid": 1000.00, "balance": 0.00, "method": "BANK_TRANSFER"},
            {"name": "Surya", "paid": 100.00, "balance": 900.00, "method": "UPI"},
            {"name": "Vijay", "paid": 0.00, "balance": 1000.00, "method": "UPI"},
            {"name": "Ram Ganesh", "paid": 1000.00, "balance": 0.00, "method": "UPI"},
            {"name": "Aditya", "paid": 1000.00, "balance": 0.00, "method": "UPI"},
            {"name": "Bheemesh", "paid": 200.00, "balance": 800.00, "method": "UPI"},
            {"name": "Aditya Annaya", "paid": 1000.00, "balance": 0.00, "method": "UPI"},
            {"name": "Lokesh Annaya", "paid": 0.00, "balance": 1000.00, "method": "UPI"},
            {"name": "Prakash", "paid": 1000.00, "balance": 0.00, "method": "UPI"},
            {"name": "Kalyan", "paid": 300.00, "balance": 700.00, "method": "UPI"},
            {"name": "Narendra", "paid": 1000.00, "balance": 0.00, "method": "UPI"},
            {"name": "Sandeep", "paid": 400.00, "balance": 500.00, "method": "UPI"},
        ]

        for item in actual_contributions:
            m_rec = next((m for m in members if m.name == item["name"]), None)
            c_rec = next((c for c in contributors if c.name == item["name"]), None)
            print(f"Item Name: {item['name']}, m_rec: {m_rec.name if m_rec else 'None'} (ID: {m_rec.id if m_rec else 'N/A'}), c_rec: {c_rec.name if c_rec else 'None'} (ID: {c_rec.id if c_rec else 'N/A'})")
            
    finally:
        db.close()

if __name__ == "__main__":
    test()
