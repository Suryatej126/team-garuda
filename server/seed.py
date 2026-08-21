import datetime
from sqlalchemy.orm import Session
from .database import engine, SessionLocal
from .models import User, Member, Event, Contribution, Sponsorship, Expense, Media, Chandha, Contributor
from .auth import hash_password

def seed_db():
    db = SessionLocal()
    try:
        # Clear existing data in correct order
        db.query(Media).delete()
        db.query(Expense).delete()
        db.query(Sponsorship).delete()
        db.query(Contribution).delete()
        db.query(Event).delete()
        db.query(Member).delete()
        db.query(User).delete()
        db.query(Chandha).delete()
        db.query(Contributor).delete()
        db.commit()

        print("Cleared existing database tables.")

        # Define Members Data at the top
        members_data = [
            {"member_id": "TG001", "name": "Aditya", "phone": "8919823457"},
            {"member_id": "TG002", "name": "Narendra", "phone": "9666865197"},
            {"member_id": "TG003", "name": "Hema Raj", "phone": "8639273539"},
            {"member_id": "TG004", "name": "Bheemesh", "phone": "9398555549"},
            {"member_id": "TG005", "name": "Ram Ganesh", "phone": "6304934345"},
            {"member_id": "TG006", "name": "Prakash", "phone": "9440540886"},
            {"member_id": "TG007", "name": "Loku Tn", "phone": "9000100011"},
            {"member_id": "TG008", "name": "Surya", "phone": "9000100012"},
            {"member_id": "TG009", "name": "Vijay", "phone": "9000100013"},
            {"member_id": "TG010", "name": "Aditya Annaya", "phone": "9000100014"},
            {"member_id": "TG011", "name": "Lokesh Annaya", "phone": "9000100015"},
            {"member_id": "TG012", "name": "Kalyan", "phone": "9000100016"},
            {"member_id": "TG013", "name": "Sandeep", "phone": "9000100017"},
        ]

        # 1. Seed Users (Admin & 13 Committee Members)
        admin = User(
            username="admin",
            email="admin@teamgaruda.in",
            password_hash=hash_password("admin123"),
            role="ADMIN"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        comm_pass_hash = hash_password("garuda123")
        users_to_add = []
        for m in members_data:
            username = m["name"].lower().replace(" ", "")
            email = f"{username}@teamgaruda.in"
            u = User(
                username=username,
                email=email,
                password_hash=comm_pass_hash,
                role="COMMITTEE"
            )
            users_to_add.append(u)

        db.add_all(users_to_add)
        db.commit()
        for u in users_to_add:
            db.refresh(u)

        print("Seeded 1 Admin and 13 Committee users.")

        # 2. Seed Members (Committee & Core Members, all PINs are "123456")
        member_pin_hash = hash_password("123456")

        members = []
        for m in members_data:
            member = Member(
                member_id=m["member_id"],
                name=m["name"],
                phone=m["phone"],
                pin_hash=member_pin_hash,
                status="ACTIVE"
            )
            db.add(member)
            members.append(member)
        
        db.commit()
        for m in members:
            db.refresh(m)

        print("Seeded 10 normal members.")

        # Create matching Contributor records for all members
        contributors = []
        for m in members:
            contributor = Contributor(
                name=m.name,
                phone=m.phone
            )
            db.add(contributor)
            contributors.append(contributor)
        db.commit()
        for c in contributors:
            db.refresh(c)
        
        print("Created matching Contributor records for all members.")

        # 3. Seed Events (3 Events)
        ugadi = Event(
            name="Ugadi Fest 2026",
            date=datetime.date(2026, 3, 22),
            time=datetime.time(8, 0),
            location="VGP Community Park, Chennai",
            status="COMPLETED",
            description="Telugu New Year celebrations with traditional Ugadi Pachadi, Pooja, and cultural performances by members.",
            cover_image_url="https://images.unsplash.com/photo-1605051008471-7501a3507b5a?w=800&auto=format&fit=crop"
        )
        ganesh = Event(
            name="Vinayaka Chavithi 2026",
            date=datetime.date(2026, 8, 18),
            time=datetime.time(9, 30),
            location="Team Garuda Hall, Hyderabad",
            status="ONGOING",
            description="Grand Ganesh Chaturthi celebrations. Statuette installation, daily Aarti, distribution of prasadam, and cultural evening programs.",
            cover_image_url="https://images.unsplash.com/photo-1567591974573-ef3c675516e4?w=800&auto=format&fit=crop"
        )
        dussera = Event(
            name="Dussera Celebrations 2026",
            date=datetime.date(2026, 10, 20),
            time=datetime.time(17, 0),
            location="Garuda Grounds, Hyderabad",
            status="UPCOMING",
            description="Dussera Pooja, Ayudha Pooja ceremony, and Jammi Pooja followed by traditional food stalls.",
            cover_image_url="https://images.unsplash.com/photo-1601662528567-526cd06f6582?w=800&auto=format&fit=crop"
        )

        db.add_all([ugadi, ganesh, dussera])
        db.commit()
        db.refresh(ugadi)
        db.refresh(ganesh)
        db.refresh(dussera)

        print("Seeded 3 events.")

        # 4. Seed Member Contributions for Vinayaka Chavithi 2026 (Actual Committee list)
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
            
            if m_rec and c_rec:
                status_val = "PAID" if item["balance"] == 0 else ("PARTIAL" if item["paid"] > 0 else "PENDING")
                notes_val = f"[Pending: {int(item['balance'])}]" if item["balance"] > 0 else None
                
                print(f"DEBUG SEED: {item['name']} -> Member ID: {m_rec.id}, Contributor ID: {c_rec.id}, Amount: {item['paid']}, Status: {status_val}")
                contrib = Contribution(
                    contributor_id=c_rec.id,
                    member_id=m_rec.id,
                    amount=item["paid"],
                    date=datetime.date(2026, 8, 18),
                    payment_method=item["method"],
                    transaction_id=None,
                    event_id=ganesh.id,
                    status=status_val,
                    notes=notes_val
                )
                db.add(contrib)
        
        # Seed one pending contribution for Dussera to ensure future dashboard variety
        m_aditya = next(m for m in members if m.member_id == "TG001")
        c_aditya = next(c for c in contributors if c.name == m_aditya.name)
        c_dussera = Contribution(
            contributor_id=c_aditya.id,
            member_id=m_aditya.id,
            amount=0.00,
            date=datetime.date(2026, 8, 18),
            payment_method="UPI",
            transaction_id=None,
            event_id=dussera.id,
            status="PENDING",
            notes="[Pending: 1000] Pledged for Dussera festival."
        )
        db.add(c_dussera)
        db.commit()

        print("Seeded member contributions matching the actual committee list.")

        print("\nDATABASE SEEDING COMPLETED SUCCESSFULLY!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
