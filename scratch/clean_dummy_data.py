import sys
import os
import datetime
from sqlalchemy import text, func

# Add parent directory to path so we can import server package
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.database import engine, SessionLocal
from server.models import Member, Event, Contribution, Contributor, Sponsorship, Expense, Media

def clean_database():
    db = SessionLocal()
    try:
        # 1. Rename Gottam to Vijay in database if present
        print("Checking if Gottam needs to be renamed to Vijay...")
        gottam_member = db.query(Member).filter(func.lower(Member.name) == "gottam").first()
        if gottam_member:
            print("Renaming Gottam to Vijay in members table...")
            gottam_member.name = "Vijay"
            db.commit()

        gottam_contributor = db.query(Contributor).filter(func.lower(Contributor.name) == "gottam").first()
        if gottam_contributor:
            print("Renaming Gottam to Vijay in contributors table...")
            gottam_contributor.name = "Vijay"
            db.commit()

        # 2. Delete all sponsorships, expenses, and media records (dummy data)
        print("\nDeleting all sponsorships (dummy data)...")
        db.query(Sponsorship).delete()
        print("Deleting all expenses (dummy data)...")
        db.query(Expense).delete()
        print("Deleting all media (dummy data)...")
        db.query(Media).delete()
        db.commit()

        # 3. Define the list of 13 real committee members
        real_names = [
            "Aditya", "Narendra", "Hema Raj", "Bheemesh", "Ram Ganesh", 
            "Prakash", "Loku Tn", "Surya", "Vijay", "Aditya Annaya", 
            "Lokesh Annaya", "Kalyan", "Sandeep"
        ]
        real_names_lower = [name.lower() for name in real_names]

        # 4. Remove contributions that do not belong to the 13 real members
        print("\nChecking for dummy contributions...")
        all_contributions = db.query(Contribution).all()
        for contrib in all_contributions:
            name_to_check = None
            if contrib.member:
                name_to_check = contrib.member.name.lower()
            elif contrib.contributor:
                name_to_check = contrib.contributor.name.lower()
            
            if name_to_check not in real_names_lower:
                print(f"Deleting dummy contribution (ID: {contrib.id}, Name: {name_to_check})")
                db.delete(contrib)
        db.commit()

        # 5. Remove members who are not in the 13 real list
        print("\nChecking for dummy members...")
        all_members = db.query(Member).all()
        for m in all_members:
            if m.name.lower() not in real_names_lower:
                print(f"Deleting dummy member: {m.name} ({m.member_id})")
                db.delete(m)
        db.commit()

        # 6. Remove contributors who are not in the 13 real list
        print("\nChecking for dummy contributors...")
        all_contributors = db.query(Contributor).all()
        for c in all_contributors:
            if c.name.lower() not in real_names_lower:
                print(f"Deleting dummy contributor: {c.name}")
                db.delete(c)
        db.commit()

        # 7. Re-assign TG IDs and order the 13 members correctly
        print("\nRe-ordering and re-assigning member IDs...")
        reordered_members = [
            {"name": "Aditya", "mid": "TG001"},
            {"name": "Narendra", "mid": "TG002"},
            {"name": "Hema Raj", "mid": "TG003"},
            {"name": "Bheemesh", "mid": "TG004"},
            {"name": "Ram Ganesh", "mid": "TG005"},
            {"name": "Prakash", "mid": "TG006"},
            {"name": "Loku Tn", "mid": "TG007"},
            {"name": "Surya", "mid": "TG008"},
            {"name": "Vijay", "mid": "TG009"},
            {"name": "Aditya Annaya", "mid": "TG010"},
            {"name": "Lokesh Annaya", "mid": "TG011"},
            {"name": "Kalyan", "mid": "TG012"},
            {"name": "Sandeep", "mid": "TG013"},
        ]

        for item in reordered_members:
            m_rec = db.query(Member).filter(func.lower(Member.name) == item["name"].lower()).first()
            if m_rec:
                if m_rec.member_id != item["mid"]:
                    print(f"Re-assigning {m_rec.name}: {m_rec.member_id} -> {item['mid']}")
                    m_rec.member_id = item["mid"]
            else:
                print(f"Warning: Member {item['name']} not found in database.")
        db.commit()

        print("\nDatabase cleaned successfully! Only the 13 real committee members remain.")

    except Exception as e:
        db.rollback()
        print(f"\nError cleaning database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    clean_database()
