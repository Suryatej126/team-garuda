import sys
from server.database import SessionLocal
from server.models import User, Member, Event, Contribution, Sponsorship, Expense, Chandha

def inspect():
    db = SessionLocal()
    try:
        print("--- USERS ---")
        for u in db.query(User).all():
            print(f"ID: {u.id}, Username: {u.username}, Role: {u.role}")
            
        print("\n--- MEMBERS ---")
        for m in db.query(Member).all():
            print(f"ID: {m.id}, MemberID: {m.member_id}, Name: {m.name}, Status: {m.status}")
            
        print("\n--- EVENTS ---")
        for e in db.query(Event).all():
            print(f"ID: {e.id}, Name: {e.name}, Status: {e.status}")
            
        print("\n--- CONTRIBUTIONS ---")
        for c in db.query(Contribution).all():
            print(f"ID: {c.id}, MemberID: {c.member_id}, Amount: {c.amount}, Status: {c.status}")
            
        print("\n--- SPONSORSHIPS ---")
        for s in db.query(Sponsorship).all():
            print(f"ID: {s.id}, UserID: {s.user_id}, Amount: {s.amount}, Status: {s.status}")
            
        print("\n--- EXPENSES ---")
        for ex in db.query(Expense).all():
            print(f"ID: {ex.id}, Name: {ex.name}, Amount: {ex.amount}, EventID: {ex.event_id}")
            
        print("\n--- CHANDHALU ---")
        for ch in db.query(Chandha).all():
            print(f"ID: {ch.id}, Donor: {ch.donor_name}, Amount: {ch.amount}")
            
    finally:
        db.close()

if __name__ == "__main__":
    inspect()
