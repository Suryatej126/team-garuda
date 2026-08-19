from server.database import engine
from server.models import Base
from server.seed import seed_db

def init():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Seeding database...")
    seed_db()
    print("Database initialized successfully!")

if __name__ == "__main__":
    init()
