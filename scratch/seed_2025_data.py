import os
import datetime
from dotenv import load_dotenv

load_dotenv()

from server.database import SessionLocal
from server.models import Event, Contribution, Contributor, Member

db = SessionLocal()

# 1. Create or retrieve the 2025 Ganesh Festival Event
event_2025 = db.query(Event).filter(Event.name.ilike('%Vinayaka Chavithi 2025%')).first()
if not event_2025:
    event_2025 = Event(
        name="Vinayaka Chavithi 2025",
        date=datetime.date(2025, 8, 27),
        time=datetime.time(9, 0),
        location="Garuda Pandal, Hyderabad",
        status="COMPLETED",
        description="Ganesh Chaturthi 2025 annual celebrations and daily aarti.",
        cover_image_url="https://images.unsplash.com/photo-1605051008471-7501a3507b5a?w=800"
    )
    db.add(event_2025)
    db.commit()
    db.refresh(event_2025)
    print(f"Created Event: {event_2025.name} (ID: {event_2025.id})")
else:
    print(f"Using existing Event: {event_2025.name} (ID: {event_2025.id})")

# 2. Translated & cleaned 2025 Contributions List
contributions_2025 = [
    {"name": "Garnipudi Satish & Sailaja", "amount": 5000, "phone": None, "notes": "Top Contributor 2025"},
    {"name": "Donga Simhachalam & Sai Amma (Pedalanka)", "amount": 3000, "phone": None, "notes": "Rice Bags 2"},
    {"name": "Gubbala Satyanarayana & Rajeshwari", "amount": 3000, "phone": None, "notes": None},
    {"name": "Maddula Trinadha Rao & Premalatha", "amount": 1500, "phone": None, "notes": None},
    {"name": "Katta Seshagiri Rao & Ammaji", "amount": 1500, "phone": None, "notes": "Near RTC"},
    {"name": "Gubbala Hema Naga Ravi Kumar & Subhashini", "amount": 1500, "phone": None, "notes": None},
    {"name": "Kadali Gouri & Shiva Narayana", "amount": 1500, "phone": None, "notes": None},
    {"name": "Manikanta Juice Shop", "amount": 1500, "phone": None, "notes": None},
    {"name": "Bokka Satyanarayana & Durga (Abbu)", "amount": 1116, "phone": None, "notes": None},
    {"name": "Kadali Naresh", "amount": 1116, "phone": None, "notes": "Anganwadi Teacher's Brother"},
    {"name": "Bokka Satyanarayana & Bharathi (PWD)", "amount": 1116, "phone": None, "notes": None},
    {"name": "Kadali Shiva Prasad & Nageswari", "amount": 1116, "phone": None, "notes": None},
    {"name": "Gubbala Gopala Krishna & Mahalakshmi Deepika", "amount": 1116, "phone": None, "notes": None},
    {"name": "Chutturi Apparao", "amount": 1116, "phone": None, "notes": None},
    {"name": "Geddada Adi Narayana", "amount": 1116, "phone": None, "notes": None},
    {"name": "Mamidisetti Annavaram & Leela Kumari", "amount": 1020, "phone": None, "notes": None},
    {"name": "Chelluboyina Arjun & Lakshmi", "amount": 1002, "phone": None, "notes": None},
    {"name": "Chelluboyina Madhava Rao & Kanaka Kumari", "amount": 1001, "phone": None, "notes": None},
    {"name": "Kanchi Venkata Lakshmi", "amount": 1001, "phone": None, "notes": None},
    {"name": "T.V.S. Murthy", "amount": 1250, "phone": None, "notes": "25kg Rice Bag contribution"},
    {"name": "Katta Durga Bhavani", "amount": 601, "phone": None, "notes": "Anganwadi Teacher"},
    {"name": "Bonthu Sai Babu & Rama Lakshmi", "amount": 558, "phone": None, "notes": None},
    {"name": "Gubbala Seetha Mahalakshmi", "amount": 558, "phone": None, "notes": None},
    {"name": "Mattaparthi Narasimha Rao", "amount": 555, "phone": None, "notes": None},
    {"name": "Aditya", "amount": 551, "phone": "8919823457", "notes": "Committee Member"},
    {"name": "Geddada Srinivasa Rao & Vara Lakshmi", "amount": 550, "phone": None, "notes": None},
    {"name": "Illa Satyanarayana & Dhana Lakshmi", "amount": 510, "phone": None, "notes": None},
    {"name": "Bonthu Srinivasa Rao & Sri Lakshmi", "amount": 505, "phone": None, "notes": None},
    {"name": "Gubbala Dharma Rao & Durga Devi", "amount": 501, "phone": None, "notes": "Hyderabad"},
    {"name": "Kurma Satyanarayana", "amount": 501, "phone": None, "notes": None},
    {"name": "Harini Fashions", "amount": 501, "phone": None, "notes": None},
    {"name": "Donga Srinivasa Rao & Vijaya Lakshmi", "amount": 500, "phone": None, "notes": None},
    {"name": "Khambala Vijaya Bhaskar & Sushma Sri", "amount": 500, "phone": None, "notes": None},
    {"name": "Rayudu Nagendra Srinivas & Sandhya", "amount": 500, "phone": None, "notes": "Dry Fruits"},
    {"name": "Chelluboyina Srinu & Aruna", "amount": 500, "phone": None, "notes": None},
    {"name": "K. Lakshmana Murthy", "amount": 500, "phone": None, "notes": None},
    {"name": "Suriboyina Hari Chandra Prasad", "amount": 500, "phone": None, "notes": None},
    {"name": "Chellingi Trimurthulu", "amount": 500, "phone": None, "notes": None},
    {"name": "N. Pullaiah", "amount": 500, "phone": None, "notes": None},
    {"name": "Kodi Dattudu", "amount": 500, "phone": None, "notes": None},
    {"name": "Bangalore Iyengar Bakery", "amount": 500, "phone": None, "notes": None},
    {"name": "Soma Yagni", "amount": 500, "phone": None, "notes": None},
    {"name": "Bokka Satyanarayana Murthy", "amount": 500, "phone": None, "notes": None},
    {"name": "V. Papayya Panthulu", "amount": 500, "phone": None, "notes": None},
    {"name": "Pati Veeraswami & Lakshmi", "amount": 500, "phone": None, "notes": "Sankaraguptam"},
    {"name": "Pechetti Seetha Mahalakshmi", "amount": 300, "phone": None, "notes": None},
    {"name": "Donga Rambabu & Mani", "amount": 300, "phone": None, "notes": None},
    {"name": "Koppisetti Srinivas", "amount": 300, "phone": None, "notes": None},
    {"name": "Koppati Krishna", "amount": 300, "phone": None, "notes": None},
    {"name": "Chelluboyina Parama Srinivas & Adi Lakshmi", "amount": 255, "phone": None, "notes": None},
    {"name": "Erraganti Shiva Sankara Prasad", "amount": 202, "phone": None, "notes": None},
    {"name": "Seelam Lakshmi", "amount": 200, "phone": None, "notes": None},
    {"name": "Dharmadi Krishna", "amount": 200, "phone": None, "notes": None},
    {"name": "Sunka Krishnaveni", "amount": 200, "phone": None, "notes": None},
    {"name": "Donga Kanakadurga", "amount": 200, "phone": None, "notes": None},
    {"name": "B. Nagamani", "amount": 200, "phone": None, "notes": None},
    {"name": "Gubbala Apparao", "amount": 200, "phone": None, "notes": None},
    {"name": "Chelluboyina Nataraj", "amount": 200, "phone": None, "notes": None},
    {"name": "G. Venkata Sai Krishna", "amount": 200, "phone": None, "notes": None},
    {"name": "Gubbala Satya Prakash", "amount": 200, "phone": None, "notes": "RTC"},
    {"name": "S. Naga Bushanam", "amount": 200, "phone": None, "notes": "Conductor"},
    {"name": "Kadali Krishna Murthy", "amount": 200, "phone": None, "notes": None},
    {"name": "K. Veerendra Rao", "amount": 200, "phone": None, "notes": None},
    {"name": "Appari Hema Chandra Rao", "amount": 200, "phone": None, "notes": None},
    {"name": "Ravindra Kumar", "amount": 150, "phone": None, "notes": None},
    {"name": "Kadali Chandra Murthy", "amount": 120, "phone": None, "notes": None},
    {"name": "Susheela Printing Press", "amount": 116, "phone": None, "notes": None},
    {"name": "A.N. Raghuram", "amount": 116, "phone": None, "notes": None},
    {"name": "M. Krishna", "amount": 100, "phone": None, "notes": None},
    {"name": "Molleti Rama Krishna", "amount": 100, "phone": None, "notes": None},
    {"name": "Molleti Satya", "amount": 100, "phone": None, "notes": None},
    {"name": "Ch. Prasad", "amount": 100, "phone": None, "notes": None},
    {"name": "Chutturi Geetha Rathnam", "amount": 100, "phone": None, "notes": None},
    {"name": "U. Prakash", "amount": 100, "phone": None, "notes": None},
    {"name": "U. Narsanna", "amount": 100, "phone": None, "notes": "Egg Shop"},
    {"name": "Yadama Babu", "amount": 100, "phone": None, "notes": None},
    {"name": "Ch. Venkata Lakshmi", "amount": 100, "phone": None, "notes": None},
    {"name": "K. Shyam", "amount": 100, "phone": None, "notes": None},
    {"name": "Seetha Rambabu", "amount": 100, "phone": None, "notes": None},
    {"name": "Rajesh", "amount": 100, "phone": None, "notes": None},
    {"name": "Donga Nageswara", "amount": 100, "phone": None, "notes": None},
    {"name": "Pithani Venkatarao", "amount": 100, "phone": None, "notes": None},
    {"name": "Koppadi Pothu Raju", "amount": 100, "phone": None, "notes": None},
]

added_count = 0
total_amount = 0

for item in contributions_2025:
    # Match or create Contributor
    contributor = db.query(Contributor).filter(Contributor.name.ilike(item["name"])).first()
    if not contributor:
        contributor = Contributor(
            name=item["name"],
            phone=item["phone"]
        )
        db.add(contributor)
        db.commit()
        db.refresh(contributor)
    elif item["phone"] and not contributor.phone:
        contributor.phone = item["phone"]
        db.commit()

    # Check if this contributor is also a registered Member
    member = None
    if item["phone"]:
        member = db.query(Member).filter(Member.phone == item["phone"]).first()
    if not member:
        member = db.query(Member).filter(Member.name.ilike(item["name"])).first()

    # Check if duplicate contribution exists for 2025
    existing_c = db.query(Contribution).filter(
        Contribution.contributor_id == contributor.id,
        Contribution.date >= datetime.date(2025, 1, 1),
        Contribution.date <= datetime.date(2025, 12, 31),
        Contribution.amount == item["amount"]
    ).first()

    if not existing_c:
        c = Contribution(
            contributor_id=contributor.id,
            member_id=member.id if member else None,
            amount=item["amount"],
            date=datetime.date(2025, 8, 27),
            payment_method="CASH",
            event_id=event_2025.id,
            purpose="CHANDHA",
            status="PAID",
            notes=item["notes"]
        )
        db.add(c)
        added_count += 1
        total_amount += item["amount"]

db.commit()
print(f"Successfully added {added_count} records for 2025! Total Collected: Rs. {total_amount:,}")
