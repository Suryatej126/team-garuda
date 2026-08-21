import sys
import os
import datetime
from sqlalchemy import text, func

# Add parent directory to path so we can import server package
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.database import engine, SessionLocal
from server.models import Member, Event, Contribution, Contributor
from server.auth import hash_password

def get_next_member_id(db):
    members = db.query(Member.member_id).all()
    max_num = 10  # Start checking after TG010
    for (m_id,) in members:
        if m_id.startswith("TG") and m_id[2:].isdigit():
            num = int(m_id[2:])
            if num > max_num:
                max_num = num
    next_num = max_num + 1
    return f"TG{next_num:03d}"

def insert_data():
    db = SessionLocal()
    try:
        # 1. Update the database check constraint first to allow ₹0 given amount
        print("Modifying database check constraint on contributions amount...")
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE contributions DROP CONSTRAINT IF EXISTS contributions_amount_check;"))
            conn.execute(text("ALTER TABLE contributions ADD CONSTRAINT contributions_amount_check CHECK (amount >= 0);"))
            conn.commit()
        print("Check constraint updated successfully!")

        # 2. Find the Vinayaka Chavithi 2026 event
        event = db.query(Event).filter(Event.name == "Vinayaka Chavithi 2026").first()
        if not event:
            print("Event 'Vinayaka Chavithi 2026' not found in database. Creating it...")
            event = Event(
                name="Vinayaka Chavithi 2026",
                date=datetime.date(2026, 8, 18),
                time=datetime.time(9, 30),
                location="Team Garuda Hall, Hyderabad",
                status="ONGOING",
                description="Grand Ganesh Chaturthi celebrations. Statuette installation, daily Aarti, distribution of prasadam, and cultural evening programs.",
                cover_image_url="https://images.unsplash.com/photo-1567591974573-ef3c675516e4?w=800&auto=format&fit=crop"
            )
            db.add(event)
            db.commit()
            db.refresh(event)

        print(f"Target Event: {event.name} (ID: {event.id})")

        # 3. Define the actual committee contributions data
        actual_contributions = [
            {"name": "Loku Tn", "paid": 350.00, "balance": 550.00, "method": "UPI"},
            {"name": "Hema Raj", "paid": 1000.00, "balance": 0.00, "method": "BANK_TRANSFER"},
            {"name": "Surya", "paid": 100.00, "balance": 900.00, "method": "UPI"},
            {"name": "Gottam", "paid": 0.00, "balance": 1000.00, "method": "UPI"},
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

        member_pin_hash = hash_password("123456")

        for item in actual_contributions:
            name = item["name"]
            paid = item["paid"]
            balance = item["balance"]
            method = item["method"]

            print(f"\nProcessing: {name} (Paid: ₹{paid}, Balance: ₹{balance})")

            # A. Find or create member
            # Try exact case-insensitive match on name
            member = db.query(Member).filter(func.lower(Member.name) == name.lower()).first()
            if not member:
                # Generate a new TGxxx member ID
                new_mid = get_next_member_id(db)
                print(f"Creating new member: {name} with ID {new_mid}")
                member = Member(
                    member_id=new_mid,
                    name=name,
                    phone="9000100000",  # default placeholder phone
                    pin_hash=member_pin_hash,
                    status="ACTIVE"
                )
                db.add(member)
                db.commit()
                db.refresh(member)
            else:
                print(f"Found existing member: {name} ({member.member_id})")

            # B. Find or create contributor
            contributor = db.query(Contributor).filter(func.lower(Contributor.name) == name.lower()).first()
            if not contributor:
                print(f"Creating new contributor record for {name}")
                contributor = Contributor(
                    name=name,
                    phone=member.phone
                )
                db.add(contributor)
                db.commit()
                db.refresh(contributor)
            else:
                print(f"Found existing contributor: {name} (ID: {contributor.id})")

            # C. Check for existing contribution for this event
            contrib = db.query(Contribution).filter(
                Contribution.member_id == member.id,
                Contribution.event_id == event.id
            ).first()

            status_val = "PAID" if balance == 0 else ("PARTIAL" if paid > 0 else "PENDING")
            notes_val = f"[Pending: {int(balance)}]" if balance > 0 else None

            if contrib:
                print(f"Updating existing contribution record (ID: {contrib.id})")
                contrib.amount = paid
                contrib.status = status_val
                contrib.notes = notes_val
                contrib.payment_method = method
            else:
                print("Creating new contribution record")
                contrib = Contribution(
                    contributor_id=contributor.id,
                    member_id=member.id,
                    amount=paid,
                    date=datetime.date(2026, 8, 18),
                    payment_method=method,
                    transaction_id=None,
                    event_id=event.id,
                    status=status_val,
                    notes=notes_val
                )
                db.add(contrib)
            
            db.commit()
            print("Successfully saved!")

        print("\nAll committee financial data has been successfully imported!")

    except Exception as e:
        db.rollback()
        print(f"\nError occurred during data insertion: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    insert_data()
