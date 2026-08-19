import os
from dotenv import load_dotenv

load_dotenv()

from server.database import SessionLocal
from server.models import User, Member, Contributor
from server.auth import hash_password

db = SessionLocal()

committee_members = [
    {'name': 'Aditya', 'username': 'aditya', 'phone': '8919823457', 'member_id': 'TG001'},
    {'name': 'Narendra', 'username': 'narendra', 'phone': '9666865197', 'member_id': 'TG002'},
    {'name': 'Hema Raj', 'username': 'hemaraj', 'phone': '8639273539', 'member_id': 'TG003'},
    {'name': 'Bhimeesh', 'username': 'bhimeesh', 'phone': '9398555549', 'member_id': 'TG004'},
    {'name': 'Ganesh', 'username': 'ganesh', 'phone': '6304934345', 'member_id': 'TG005'},
    {'name': 'Prakash', 'username': 'prakash', 'phone': '9440540886', 'member_id': 'TG006'},
]

password_hash = hash_password('garuda123')
pin_hash = hash_password('123456')

for cm in committee_members:
    # 1. Create or update User
    user = db.query(User).filter(User.username == cm['username']).first()
    if not user:
        user = User(
            username=cm['username'],
            email=cm['username'] + '@teamgaruda.in',
            password_hash=password_hash,
            role='COMMITTEE'
        )
        db.add(user)
        print(f"Created User: {cm['username']}")
    else:
        user.password_hash = password_hash
        user.role = 'COMMITTEE'
        print(f"Updated User: {cm['username']}")

    # 2. Create or update Member
    member = db.query(Member).filter(Member.member_id == cm['member_id']).first()
    if not member:
        member = Member(
            member_id=cm['member_id'],
            name=cm['name'],
            phone=cm['phone'],
            pin_hash=pin_hash,
            status='ACTIVE'
        )
        db.add(member)
        print(f"Created Member: {cm['name']} ({cm['member_id']})")
    else:
        member.name = cm['name']
        member.phone = cm['phone']
        member.pin_hash = pin_hash
        member.status = 'ACTIVE'
        print(f"Updated Member: {cm['name']} ({cm['member_id']})")

    # 3. Create or update Contributor
    contributor = db.query(Contributor).filter(Contributor.name.ilike(cm['name'])).first()
    if not contributor:
        contributor = Contributor(
            name=cm['name'],
            phone=cm['phone']
        )
        db.add(contributor)
        print(f"Created Contributor: {cm['name']}")
    else:
        contributor.phone = cm['phone']
        print(f"Updated Contributor: {cm['name']}")

db.commit()
print("All 6 committee members successfully added to Database!")
