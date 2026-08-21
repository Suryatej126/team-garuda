import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.database import SessionLocal
from server.models import User, Member, Contribution, Event, Contributor

def main():
    db = SessionLocal()
    try:
        print("--- EVENTS ---")
        for e in db.query(Event).all():
            print(f"ID: {e.id}, Name: {e.name}, Date: {e.date}, Status: {e.status}")
        
        print("\n--- USERS ---")
        for u in db.query(User).all():
            print(f"ID: {u.id}, Username: {u.username}, Role: {u.role}")

        print("\n--- MEMBERS ---")
        for m in db.query(Member).all():
            print(f"ID: {m.id}, Member_ID: {m.member_id}, Name: {m.name}, Phone: {m.phone}, Status: {m.status}")

        print("\n--- CONTRIBUTORS ---")
        for c in db.query(Contributor).all():
            print(f"ID: {c.id}, Name: {c.name}, Phone: {c.phone}")

        print("\n--- CONTRIBUTIONS ---")
        for c in db.query(Contribution).all():
            member_name = c.member.name if c.member else "None"
            contributor_name = c.contributor.name if c.contributor else "None"
            print(f"ID: {c.id}, Contributor: {contributor_name}, Member: {member_name}, Amount: {c.amount}, Date: {c.date}, Status: {c.status}, Notes: {c.notes}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
