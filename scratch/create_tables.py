from server.database import engine, Base
from server.models import User, Member, Event, Contribution, Sponsorship, Expense, Media, Chandha

def create():
    print("Creating all tables in database...")
    Base.metadata.create_all(bind=engine)
    print("Done!")

if __name__ == "__main__":
    create()
