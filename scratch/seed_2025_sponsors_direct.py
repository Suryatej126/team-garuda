import sys
import os
import datetime
import json
from sqlalchemy import text

# Add parent directory to path so we can import server package
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.database import engine, SessionLocal
from server.models import Event, Sponsorship, User

def seed_sponsors():
    db = SessionLocal()
    try:
        # 1. Update the database check constraint first on sponsorships
        print("Modifying database check constraints on sponsorships table...")
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE sponsorships DROP CONSTRAINT IF EXISTS sponsorships_amount_check;"))
            conn.execute(text("ALTER TABLE sponsorships ADD CONSTRAINT sponsorships_amount_check CHECK (amount >= 0);"))
            conn.execute(text("ALTER TABLE sponsorships DROP CONSTRAINT IF EXISTS sponsorships_payment_method_check;"))
            conn.execute(text("ALTER TABLE sponsorships ADD CONSTRAINT sponsorships_payment_method_check CHECK (payment_method IN ('UPI', 'CASH', 'BANK_TRANSFER', 'OTHER', 'IN_KIND'));"))
            conn.commit()
        print("Check constraints updated successfully!")

        # 2. Find the Vinayaka Chavithi 2025 event
        event = db.query(Event).filter(Event.name.ilike("%Vinayaka Chavithi 2025%")).first()
        if not event:
            print("Vinayaka Chavithi 2025 event not found! Creating it...")
            event = Event(
                name="Vinayaka Chavithi 2025",
                date=datetime.date(2025, 8, 27),
                time=datetime.time(9, 0),
                location="Garuda Pandal, Hyderabad",
                status="COMPLETED",
                description="Ganesh Chaturthi 2025 annual celebrations and daily aarti.",
                cover_image_url="https://images.unsplash.com/photo-1605051008471-7501a3507b5a?w=800"
            )
            db.add(event)
            db.commit()
            db.refresh(event)

        print(f"Target Event: {event.name} (ID: {event.id})")

        # 3. Find the admin user
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            raise Exception("Admin user not found. Please run seed.py first.")
        admin_id = admin_user.id

        # 4. Define the 2025 sponsorships data
        sponsors_data = [
            {
                "sponsor_name": "Sri Gubbala Lakshmi, Son Durga Prasad, Raji (శ్రీ గుబ్బల లక్ష్మి, కుమారుడు దుర్గా ప్రసాద్, రాజీ)",
                "item_name": "Ksheerannam (క్షీరాన్నం)",
                "notes": "Sweet Milk Rice Annadanam Prasadam"
            },
            {
                "sponsor_name": "Sri Vanamala Srinu, Chadalada Srinu, Chadalada Venkateswara Rao, Kumpatla Anjaneyulu, Tirumala Konda Babu (శ్రీ వనమాల శ్రీను, చదలాడ శ్రీను, చదలాడ వెంకటేశ్వరరావు, కుంపట్ల ఆంజనేయులు, తిరుముల కొండ బాబు)",
                "item_name": "Poori (పూరి / బురి)",
                "notes": "Annadanam Tiffin & Prasadam"
            },
            {
                "sponsor_name": "Smt. Chelluboyina Satyavathi (శ్రీమతి చెల్లుబోయిన సత్యవతి)",
                "item_name": "Sweet / Delicacy (మధురమైనది)",
                "notes": "Traditional Sweet Prasadam"
            },
            {
                "sponsor_name": "Sri Nunnaboyina Vijaya Bhaskar & Swathi (శ్రీ నున్నబోయిన విజయభాస్కర్, స్వాతి గారు)",
                "item_name": "Pulihora (పులిహోర)",
                "notes": "Tamarind Rice Holy Prasadam"
            },
            {
                "sponsor_name": "Sri Goli Brihaspathi & Satyavathi (శ్రీ గోలి బృహస్పతి, సత్యవతి గారు)",
                "item_name": "Pappu Mamidikaya (పప్పు మామిడికాయ)",
                "notes": "Mango Dal for Community Annadanam"
            },
            {
                "sponsor_name": "Sri Geddada Jayaram, Jyothi & Geddada Dhanuj Kumar (శ్రీ గెద్దాడ జయరామ్, జ్యోతి, గెద్దాడ ధనుజ్ కుమార్)",
                "item_name": "Vankaya Jeedipappu (వంకాయ జీడిపప్పు)",
                "notes": "Brinjal Cashew Special Curry"
            },
            {
                "sponsor_name": "Sri Gubbala Ratna Sekhar Reddy & Venkata Ramanamma (శ్రీ గుబ్బల రత్నశేఖర్ రెడ్డి, వెంకట రమణమ్మ గారు)",
                "item_name": "Gongura Chutney (గోంగూర పచ్చడి)",
                "notes": "Traditional Andhra Gongura Chutney"
            },
            {
                "sponsor_name": "Sri Gubbala Satya Sai Babu & Sujatha (శ్రీ గుబ్బల సత్య సాయి బాబు, సుజాత గారు)",
                "item_name": "Kandi Podi, Ghee & Mirapakaya Pachadi (కంది పొడి, నెయ్యి, మిరపకాయ పచ్చడి)",
                "notes": "Gunpowder, Pure Ghee & Chilli Chutney for Annadanam"
            },
            {
                "sponsor_name": "Sri Gubbala Jyothi Prasad & Madhavi (శ్రీ గుబ్బల జ్యోతి ప్రసాద్, మాధవి గారు)",
                "item_name": "50L Curd (50లీ పెరుగు)",
                "notes": "50 Litres Fresh Curd for Community Meal"
            },
            {
                "sponsor_name": "Sri Gubbala Satyanarayana & Srinivas (Bujji) (శ్రీ గుబ్బల సత్యనారాయణ, శ్రీనివాస్ బుజ్జి)",
                "item_name": "Bananas / Fruits (అరటి పండ్లు)",
                "notes": "Pooja & Prasadam Bananas"
            },
            {
                "sponsor_name": "Bonthu Satyanarayana, Durgadevi & Pitani Srinivas, Nageswari (బొంతు సత్యనారాయణ, దుర్గాదేవి, పితాని శ్రీనివాస్, నాగేశ్వరి గారు)",
                "item_name": "Meal Plates (భోజనం ప్లేట్లు)",
                "notes": "Dining plates for Annadanam devotees"
            },
            {
                "sponsor_name": "Kodigudla Chowdary Garu (కోడిగుడ్ల చౌదరి గారు)",
                "item_name": "Glass Bangles (గాజులు)",
                "notes": "Sacred Pooja Bangles"
            },
            {
                "sponsor_name": "Sri Kancharla Sekhar Garu (శ్రీ కంచర్ల శేఖర్ గారు)",
                "item_name": "2 Gas Cylinders (2 గ్యాస్ బండలు)",
                "notes": "Cooking Gas for Annadanam Kitchen"
            }
        ]

        added_count = 0
        for item in sponsors_data:
            notes_str = json.dumps({
                "sponsor_name": item["sponsor_name"],
                "item_name": item["item_name"],
                "notes": item["notes"]
            })

            # Check if this sponsorship already exists for this event
            existing = db.query(Sponsorship).filter(
                Sponsorship.event_id == event.id,
                Sponsorship.notes == notes_str
            ).first()

            if not existing:
                spons = Sponsorship(
                    user_id=admin_id,
                    amount=0.00,
                    date=datetime.date(2025, 8, 27),
                    payment_method="IN_KIND",
                    event_id=event.id,
                    status="PAID",
                    notes=notes_str
                )
                db.add(spons)
                added_count += 1

        db.commit()
        print(f"Successfully seeded {added_count} 2025 item sponsorships directly!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding 2025 sponsorships: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_sponsors()
