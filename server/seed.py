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

        # 1. Seed Users (Admin & Committee)
        admin = User(
            username="admin",
            email="admin@teamgaruda.in",
            password_hash=hash_password("admin123"),
            role="ADMIN"
        )
        suriya = User(
            username="suriya",
            email="suriya@teamgaruda.in",
            password_hash=hash_password("committeepassword"),
            role="COMMITTEE"
        )
        teja = User(
            username="teja",
            email="teja@teamgaruda.in",
            password_hash=hash_password("committeepassword"),
            role="COMMITTEE"
        )
        vinay = User(
            username="vinay",
            email="vinay@teamgaruda.in",
            password_hash=hash_password("committeepassword"),
            role="COMMITTEE"
        )

        db.add_all([admin, suriya, teja, vinay])
        db.commit()
        db.refresh(admin)
        db.refresh(suriya)
        db.refresh(teja)
        db.refresh(vinay)

        print("Seeded 1 Admin and 3 Committee users.")

        # 2. Seed Members (10 Normal Members, all PINs are "123456")
        member_pin_hash = hash_password("123456")
        members_data = [
            {"member_id": "TG001", "name": "Surya Teja", "phone": "+91 98765 43210"},
            {"member_id": "TG002", "name": "Vinayaka Sharma", "phone": "+91 91234 56789"},
            {"member_id": "TG003", "name": "Karthik Raja", "phone": "+91 99887 76655"},
            {"member_id": "TG004", "name": "Divya Sri", "phone": "+91 88877 66554"},
            {"member_id": "TG005", "name": "Lakshmi Prasad", "phone": "+91 77766 55443"},
            {"member_id": "TG006", "name": "Mohan Babu", "phone": "+91 66655 44332"},
            {"member_id": "TG007", "name": "Sridhar Reddy", "phone": "+91 95544 33221"},
            {"member_id": "TG008", "name": "Anusha Rao", "phone": "+91 84433 22110"},
            {"member_id": "TG009", "name": "Ramesh Kumar", "phone": "+91 73322 11009"},
            {"member_id": "TG010", "name": "Venkatesh Naidu", "phone": "+91 92211 00998"},
        ]

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

        # 4. Seed Member Contributions (Total paid ₹10,000, pending ₹1,000)
        c1 = Contribution(
            contributor_id=contributors[0].id, # Surya Teja
            member_id=members[0].id,
            amount=2000.00,
            date=datetime.date(2026, 8, 15),
            payment_method="UPI",
            transaction_id="TXN8892019",
            event_id=ganesh.id,
            status="PAID",
            notes="Annual contribution for Ganesh Chaturthi."
        )
        c2 = Contribution(
            contributor_id=contributors[1].id, # Vinayaka Sharma
            member_id=members[1].id,
            amount=3000.00,
            date=datetime.date(2026, 8, 16),
            payment_method="CASH",
            transaction_id=None,
            event_id=ganesh.id,
            status="PAID",
            notes="Paid in cash to Suriya."
        )
        c3 = Contribution(
            contributor_id=contributors[2].id, # Karthik Raja
            member_id=members[2].id,
            amount=5000.00,
            date=datetime.date(2026, 8, 17),
            payment_method="BANK_TRANSFER",
            transaction_id="IMPS9988220",
            event_id=ganesh.id,
            status="PAID",
            notes="Direct bank transfer to Garuda account."
        )
        c4 = Contribution(
            contributor_id=contributors[0].id, # Surya Teja
            member_id=members[0].id,
            amount=1000.00,
            date=datetime.date(2026, 8, 18),
            payment_method="UPI",
            transaction_id=None,
            event_id=dussera.id,
            status="PENDING",
            notes="Pledged for Dussera festival."
        )

        db.add_all([c1, c2, c3, c4])
        db.commit()

        print("Seeded member contributions: Rs. 10,000 paid, Rs. 1,000 pending.")

        # 5. Seed Sponsorships (Committee Member A = ₹10,000 paid)
        s1 = Sponsorship(
            user_id=suriya.id,
            amount=10000.00,
            date=datetime.date(2026, 8, 14),
            payment_method="UPI",
            transaction_id="TXN77881122",
            event_id=ganesh.id,
            status="PAID",
            notes="Personal sponsorship from committee member Suriya."
        )
        s2 = Sponsorship(
            user_id=teja.id,
            amount=5000.00,
            date=datetime.date(2026, 8, 18),
            payment_method="BANK_TRANSFER",
            transaction_id=None,
            event_id=dussera.id,
            status="PENDING",
            notes="Pledged sponsorship for Dussera."
        )

        db.add_all([s1, s2])
        db.commit()

        print("Seeded sponsorships: Rs. 10,000 paid, Rs. 5,000 pending.")

        # 6. Seed Expenses (Decoration ₹5,000, Food ₹3,000)
        e1 = Expense(
            name="Pandal Decoration & Lighting",
            amount=5000.00,
            date=datetime.date(2026, 8, 17),
            category="DECORATION",
            payment_method="CASH",
            event_id=ganesh.id,
            paid_by=suriya.id,
            receipt_url="/uploads/receipt_decoration_demo.jpg",
            notes="Stage decoration and flowers. Paid cash to builder."
        )
        e2 = Expense(
            name="Pooja Prasadam and Catering",
            amount=3000.00,
            date=datetime.date(2026, 8, 18),
            category="FOOD",
            payment_method="UPI",
            event_id=ganesh.id,
            paid_by=teja.id,
            receipt_url="/uploads/receipt_prasadam_demo.jpg",
            notes="Prasadam preparation (Laddus, Puliohara)."
        )

        db.add_all([e1, e2])
        db.commit()

        print("Seeded expenses: Rs. 8,000 total (Rs. 5,000 decoration, Rs. 3,000 food).")

        # 7. Seed Media Photos & Videos for Ganesh Festival
        m1 = Media(
            event_id=ganesh.id,
            type="PHOTO",
            file_url="https://images.unsplash.com/photo-1605051008471-7501a3507b5a?w=800&auto=format&fit=crop",
            thumbnail_url="https://images.unsplash.com/photo-1605051008471-7501a3507b5a?w=400&auto=format&fit=crop",
            caption="Lord Ganesha Idol Installation",
            uploaded_by=suriya.id
        )
        m2 = Media(
            event_id=ganesh.id,
            type="PHOTO",
            file_url="https://images.unsplash.com/photo-1567591974573-ef3c675516e4?w=800&auto=format&fit=crop",
            thumbnail_url="https://images.unsplash.com/photo-1567591974573-ef3c675516e4?w=400&auto=format&fit=crop",
            caption="Morning Pooja Aarti",
            uploaded_by=suriya.id
        )
        m3 = Media(
            event_id=ganesh.id,
            type="PHOTO",
            file_url="https://images.unsplash.com/photo-1601662528567-526cd06f6582?w=800&auto=format&fit=crop",
            thumbnail_url="https://images.unsplash.com/photo-1601662528567-526cd06f6582?w=400&auto=format&fit=crop",
            caption="Prasadam Distribution",
            uploaded_by=teja.id
        )
        m4 = Media(
            event_id=ganesh.id,
            type="VIDEO",
            file_url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            thumbnail_url="https://images.unsplash.com/photo-1567591974573-ef3c675516e4?w=400&auto=format&fit=crop",
            caption="Procession Aarti Video",
            uploaded_by=vinay.id
        )

        db.add_all([m1, m2, m3, m4])
        db.commit()

        print("Seeded 3 photos and 1 video gallery elements.")
        print("\nDATABASE SEEDING COMPLETED SUCCESSFULLY!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
