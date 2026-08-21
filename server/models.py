from sqlalchemy import Column, Integer, String, Numeric, Date, Time, Text, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # 'ADMIN', 'COMMITTEE'
    created_at = Column(TIMESTAMP, server_default=func.now())

    sponsorships = relationship("Sponsorship", back_populates="sponsor")
    paid_expenses = relationship("Expense", back_populates="paid_by_user")
    media_uploads = relationship("Media", back_populates="uploader")


class Member(Base):
    __tablename__ = 'members'

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    pin_hash = Column(String(255), nullable=False)
    status = Column(String(20), default='ACTIVE', index=True)  # 'ACTIVE', 'INACTIVE'
    created_at = Column(TIMESTAMP, server_default=func.now())

    contributions = relationship("Contribution", back_populates="member")


class Event(Base):
    __tablename__ = 'events'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    date = Column(Date, nullable=False, index=True)
    time = Column(Time, nullable=False)
    location = Column(String(150), nullable=False)
    status = Column(String(20), default='UPCOMING', index=True)  # 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'
    description = Column(Text)
    cover_image_url = Column(String(255))
    created_at = Column(TIMESTAMP, server_default=func.now())

    contributions = relationship("Contribution", back_populates="event")
    sponsorships = relationship("Sponsorship", back_populates="event")
    expenses = relationship("Expense", back_populates="event")
    media = relationship("Media", back_populates="event", cascade="all, delete-orphan")


class Contributor(Base):
    __tablename__ = 'contributors'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    contributions = relationship("Contribution", back_populates="contributor", cascade="all, delete-orphan")


class Contribution(Base):
    __tablename__ = 'contributions'

    id = Column(Integer, primary_key=True, index=True)
    contributor_id = Column(Integer, ForeignKey('contributors.id', ondelete='CASCADE'), nullable=False)
    member_id = Column(Integer, ForeignKey('members.id', ondelete='SET NULL'), nullable=True)
    amount = Column(Numeric(12, 2), nullable=False)
    date = Column(Date, nullable=False, index=True)
    payment_method = Column(String(30), nullable=False)  # 'UPI', 'CASH', 'BANK_TRANSFER', 'OTHER'
    transaction_id = Column(String(100), index=True)
    event_id = Column(Integer, ForeignKey('events.id', ondelete='SET NULL'))
    purpose = Column(String(100), nullable=True)
    status = Column(String(20), default='PAID', index=True)  # 'PENDING', 'PAID'
    notes = Column(Text)
    recorded_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    collected_by = Column(String(100), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    contributor = relationship("Contributor", back_populates="contributions")
    member = relationship("Member", back_populates="contributions")
    event = relationship("Event", back_populates="contributions")


class Sponsorship(Base):
    __tablename__ = 'sponsorships'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    date = Column(Date, nullable=False, index=True)
    payment_method = Column(String(30), nullable=False)  # 'UPI', 'CASH', 'BANK_TRANSFER', 'OTHER'
    transaction_id = Column(String(100), index=True)
    event_id = Column(Integer, ForeignKey('events.id', ondelete='SET NULL'))
    status = Column(String(20), default='PENDING', index=True)  # 'PENDING', 'PAID'
    notes = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

    sponsor = relationship("User", back_populates="sponsorships")
    event = relationship("Event", back_populates="sponsorships")


class Expense(Base):
    __tablename__ = 'expenses'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    date = Column(Date, nullable=False, index=True)
    category = Column(String(50), nullable=False)  # 'DECORATION', 'FOOD', 'TRANSPORT', 'PRINTING', 'EQUIPMENT', 'VENUE', 'POOJA', 'MEDIA', 'MAINTENANCE', 'OTHER'
    payment_method = Column(String(30), nullable=False)
    event_id = Column(Integer, ForeignKey('events.id', ondelete='SET NULL'))
    paid_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'))
    receipt_url = Column(String(255))
    notes = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

    event = relationship("Event", back_populates="expenses")
    paid_by_user = relationship("User", back_populates="paid_expenses")


class Media(Base):
    __tablename__ = 'media'

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey('events.id', ondelete='CASCADE'), nullable=False)
    type = Column(String(10), nullable=False)  # 'PHOTO', 'VIDEO'
    file_url = Column(String(255), nullable=False)
    thumbnail_url = Column(String(255))
    caption = Column(String(255))
    uploaded_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'))
    created_at = Column(TIMESTAMP, server_default=func.now())

    event = relationship("Event", back_populates="media")
    uploader = relationship("User", back_populates="media_uploads")


class Chandha(Base):
    __tablename__ = 'chandhalu'

    id = Column(Integer, primary_key=True, index=True)
    donor_name = Column(String(100), nullable=False)
    donor_phone = Column(String(20), nullable=True)
    amount = Column(Numeric(12, 2), nullable=False)
    date = Column(Date, nullable=False, index=True)
    payment_method = Column(String(30), nullable=False, default='UPI')  # 'UPI', 'CASH', 'BANK_TRANSFER', 'OTHER'
    notes = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

