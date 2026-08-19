from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
import os
import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr

from .database import get_db, engine
from .config import ALLOWED_ORIGINS, UPLOAD_DIR
from .models import Base, User, Member, Event, Contribution, Sponsorship, Expense, Media, Chandha, Contributor
from .auth import hash_password, verify_password, create_access_token, get_current_user, require_admin, require_committee
from .storage import storage_client

# Initialize FastAPI App
app = FastAPI(title="Team Garuda API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Uploads directory for static access
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Health check endpoint (used by Render to verify the server is up)
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Team Garuda API"}

# --- Pydantic Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class LoginRequest(BaseModel):
    username: str
    password: str

class MemberVerifyRequest(BaseModel):
    member_id: str
    pin: str

class MemberResponse(BaseModel):
    id: int
    member_id: str
    name: str
    phone: str
    status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class MemberCreate(BaseModel):
    member_id: str
    name: str
    phone: str
    pin: str
    status: Optional[str] = "ACTIVE"

class MemberUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    pin: Optional[str] = None
    status: Optional[str] = None

class EventResponse(BaseModel):
    id: int
    name: str
    date: datetime.date
    time: datetime.time
    location: str
    status: str
    description: Optional[str]
    cover_image_url: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class EventCreate(BaseModel):
    name: str
    date: datetime.date
    time: str  # Format: HH:MM
    location: str
    status: Optional[str] = "UPCOMING"
    description: Optional[str] = None
    cover_image_url: Optional[str] = None

class ContributorResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class ContributorCreate(BaseModel):
    name: str
    phone: Optional[str] = None

class ContributionResponse(BaseModel):
    id: int
    contributor_id: int
    contributor: ContributorResponse
    member_id: Optional[int] = None
    member: Optional[MemberResponse] = None
    amount: float
    date: datetime.date
    payment_method: str
    transaction_id: Optional[str] = None
    event_id: Optional[int] = None
    event: Optional[EventResponse] = None
    purpose: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class ContributionCreate(BaseModel):
    member_id: Optional[int] = None
    contributor_id: Optional[int] = None
    contributor_name: Optional[str] = None
    contributor_phone: Optional[str] = None
    amount: float
    date: datetime.date
    payment_method: str
    transaction_id: Optional[str] = None
    event_id: Optional[int] = None
    purpose: Optional[str] = None
    status: Optional[str] = "PAID"
    notes: Optional[str] = None

class ContributionUpdate(BaseModel):
    member_id: Optional[int] = None
    contributor_id: Optional[int] = None
    contributor_name: Optional[str] = None
    contributor_phone: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[datetime.date] = None
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    event_id: Optional[int] = None
    purpose: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str

class SponsorshipResponse(BaseModel):
    id: int
    amount: float
    date: datetime.date
    payment_method: str
    transaction_id: Optional[str]
    status: str
    notes: Optional[str]
    sponsor: UserResponse
    event: Optional[EventResponse]

    class Config:
        from_attributes = True

class SponsorshipCreate(BaseModel):
    user_id: int
    amount: float
    date: datetime.date
    payment_method: str
    transaction_id: Optional[str] = None
    event_id: Optional[int] = None
    status: Optional[str] = "PENDING"
    notes: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: int
    name: str
    amount: float
    date: datetime.date
    category: str
    payment_method: str
    receipt_url: Optional[str]
    notes: Optional[str]
    paid_by_user: Optional[UserResponse]
    event: Optional[EventResponse]

    class Config:
        from_attributes = True

class MediaResponse(BaseModel):
    id: int
    event_id: int
    type: str
    file_url: str
    thumbnail_url: Optional[str]
    caption: Optional[str]
    uploaded_by: Optional[int]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class FinanceSummaryResponse(BaseModel):
    total_contributions: float
    total_sponsorships: float
    total_chandhalu: float
    total_funds: float
    total_expenses: float
    current_balance: float
    expense_by_category: dict

class ChandhaResponse(BaseModel):
    id: int
    donor_name: str
    donor_phone: Optional[str]
    amount: float
    date: datetime.date
    payment_method: str
    notes: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class ChandhaCreate(BaseModel):
    donor_name: str
    donor_phone: Optional[str] = None
    amount: float
    date: datetime.date
    payment_method: str
    notes: Optional[str] = None

class ChandhaUpdate(BaseModel):
    donor_name: Optional[str] = None
    donor_phone: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[datetime.date] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None

# --- Routes ---

@app.post("/api/auth/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    access_token = create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
    }

@app.post("/api/auth/verify-member", response_model=MemberResponse)
def verify_member_pin(verify_data: MemberVerifyRequest, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.member_id == verify_data.member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member ID not found.",
        )
    if member.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Member account is inactive.",
        )
    if not verify_password(verify_data.pin, member.pin_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect 6-digit PIN.",
        )
    return member

# --- Member Contribution Retrieval ---
@app.get("/api/member/contributions", response_model=List[ContributionResponse])
def get_member_contributions(member_id: str, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.member_id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found.",
        )
    # Return all contributions for this member
    return db.query(Contribution).filter(Contribution.member_id == member.id).order_by(Contribution.date.desc()).all()

# --- Public Endpoints ---
@app.get("/api/public/events", response_model=List[EventResponse])
def get_public_events(db: Session = Depends(get_db)):
    return db.query(Event).order_by(Event.date.desc()).all()

@app.get("/api/public/events/{event_id}", response_model=EventResponse)
def get_public_event_details(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@app.get("/api/public/media", response_model=List[MediaResponse])
def get_public_media(event_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Media)
    if event_id is not None:
        query = query.filter(Media.event_id == event_id)
    return query.order_by(Media.created_at.desc()).all()

# --- Committee/Admin Protected Management Endpoints ---

# Finance Summary
@app.get("/api/finance/summary", response_model=FinanceSummaryResponse)
def get_finance_summary(db: Session = Depends(get_db), current_user: User = Depends(require_committee)):
    # Total Paid Contributions
    total_contributions = float(db.query(func.sum(Contribution.amount)).filter(Contribution.status == "PAID", Contribution.member_id != None).scalar() or 0.0)
    # Total Paid Sponsorships
    total_sponsorships = float(db.query(func.sum(Sponsorship.amount)).filter(Sponsorship.status == "PAID").scalar() or 0.0)
    # Total Public Donations (Chandhalu)
    total_chandhalu = float(db.query(func.sum(Contribution.amount)).filter(Contribution.status == "PAID", Contribution.member_id == None).scalar() or 0.0)
    
    # Total Funds
    total_funds = total_contributions + total_sponsorships + total_chandhalu
    
    # Total Expenses
    total_expenses = float(db.query(func.sum(Expense.amount)).scalar() or 0.0)
    
    # Current Balance
    current_balance = total_funds - total_expenses
    
    # Expenses by Category
    category_summary = db.query(Expense.category, func.sum(Expense.amount)).group_by(Expense.category).all()
    expense_by_category = {cat: float(amt) for cat, amt in category_summary}

    return {
        "total_contributions": float(total_contributions),
        "total_sponsorships": float(total_sponsorships),
        "total_chandhalu": float(total_chandhalu),
        "total_funds": total_funds,
        "total_expenses": total_expenses,
        "current_balance": current_balance,
        "expense_by_category": expense_by_category
    }

# Member Management
@app.get("/api/committee/members", response_model=List[MemberResponse])
def get_members(db: Session = Depends(get_db), current_user: User = Depends(require_committee)):
    return db.query(Member).order_by(Member.member_id.asc()).all()

@app.post("/api/committee/members", response_model=MemberResponse)
def create_member(member_data: MemberCreate, db: Session = Depends(get_db), current_user: User = Depends(require_committee)):
    existing = db.query(Member).filter(Member.member_id == member_data.member_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Member ID already exists")
    
    member = Member(
        member_id=member_data.member_id,
        name=member_data.name,
        phone=member_data.phone,
        pin_hash=hash_password(member_data.pin),
        status=member_data.status
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    
    # Auto-create contributor for the member
    c_name = member.name.strip()
    c_phone = member.phone.strip() if member.phone else None
    
    contributor = db.query(Contributor).filter(Contributor.name == c_name)
    if c_phone:
        contributor = contributor.filter(Contributor.phone == c_phone)
    else:
        contributor = contributor.filter(Contributor.phone == None)
        
    contributor = contributor.first()
    if not contributor:
        contributor = Contributor(name=c_name, phone=c_phone)
        db.add(contributor)
        db.commit()
        
    return member

@app.put("/api/committee/members/{member_id}", response_model=MemberResponse)
def update_member(member_id: int, member_data: MemberUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_committee)):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    old_name = member.name
    old_phone = member.phone

    if member_data.name is not None:
        member.name = member_data.name
    if member_data.phone is not None:
        member.phone = member_data.phone
    if member_data.pin is not None and member_data.pin != "":
        member.pin_hash = hash_password(member_data.pin)
    if member_data.status is not None:
        member.status = member_data.status
        
    db.commit()
    db.refresh(member)
    
    # Resolve and update associated contributor record
    contributor = db.query(Contributor).filter(Contributor.name == old_name)
    if old_phone:
        contributor = contributor.filter(Contributor.phone == old_phone)
    else:
        contributor = contributor.filter(Contributor.phone == None)
        
    contributor = contributor.first()
    if contributor:
        if member_data.name is not None:
            contributor.name = member_data.name
        if member_data.phone is not None:
            contributor.phone = member_data.phone
        db.commit()
        
    return member

# Contributors Management
@app.get("/api/committee/contributors", response_model=List[ContributorResponse])
def get_contributors(search: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(require_committee)):
    query = db.query(Contributor)
    if search:
        search_term = f"%{search}%"
        query = query.filter((Contributor.name.ilike(search_term)) | (Contributor.phone.ilike(search_term)))
    return query.order_by(Contributor.name.asc()).all()

@app.post("/api/committee/contributors", response_model=ContributorResponse)
def create_contributor(contributor_data: ContributorCreate, db: Session = Depends(get_db), current_user: User = Depends(require_committee)):
    c_name = contributor_data.name.strip()
    c_phone = contributor_data.phone.strip() if contributor_data.phone else None
    
    query = db.query(Contributor).filter(Contributor.name == c_name)
    if c_phone:
        query = query.filter(Contributor.phone == c_phone)
    else:
        query = query.filter(Contributor.phone == None)
        
    existing = query.first()
    if existing:
        return existing
        
    new_c = Contributor(name=c_name, phone=c_phone)
    db.add(new_c)
    db.commit()
    db.refresh(new_c)
    return new_c

# Contributions Management
@app.get("/api/committee/contributions", response_model=List[ContributionResponse])
def get_contributions(
    year: Optional[int] = None,
    payment_method: Optional[str] = None,
    event_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_committee)
):
    query = db.query(Contribution).join(Contributor)
    
    if year is not None:
        query = query.filter(func.extract('year', Contribution.date) == year)
    if payment_method:
        query = query.filter(Contribution.payment_method == payment_method)
    if event_id is not None:
        query = query.filter(Contribution.event_id == event_id)
    if status:
        query = query.filter(Contribution.status == status)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Contributor.name.ilike(search_term)) | 
            (Contributor.phone.ilike(search_term)) |
            (Contribution.transaction_id.ilike(search_term))
        )
        
    return query.order_by(Contribution.date.desc()).all()

@app.post("/api/committee/contributions", response_model=ContributionResponse)
def create_contribution(contrib_data: ContributionCreate, db: Session = Depends(get_db), current_user: User = Depends(require_committee)):
    member = None
    if contrib_data.member_id:
        member = db.query(Member).filter(Member.id == contrib_data.member_id).first()
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
            
    contributor = None
    if contrib_data.contributor_id:
        contributor = db.query(Contributor).filter(Contributor.id == contrib_data.contributor_id).first()
        
    if not contributor:
        c_name = contrib_data.contributor_name.strip() if contrib_data.contributor_name else (member.name if member else None)
        c_phone = contrib_data.contributor_phone.strip() if contrib_data.contributor_phone else (member.phone if member else None)
        
        if not c_name:
            raise HTTPException(status_code=400, detail="Contributor name is required")
            
        # Resolve contributor
        contributor = db.query(Contributor).filter(Contributor.name == c_name)
        if c_phone:
            contributor = contributor.filter(Contributor.phone == c_phone)
        else:
            contributor = contributor.filter(Contributor.phone == None)
            
        contributor = contributor.first()
        if not contributor:
            contributor = Contributor(name=c_name, phone=c_phone)
            db.add(contributor)
            db.commit()
            db.refresh(contributor)
        
    contrib = Contribution(
        contributor_id=contributor.id,
        member_id=contrib_data.member_id,
        amount=contrib_data.amount,
        date=contrib_data.date,
        payment_method=contrib_data.payment_method,
        transaction_id=contrib_data.transaction_id,
        event_id=contrib_data.event_id,
        purpose=contrib_data.purpose,
        status=contrib_data.status or "PAID",
        notes=contrib_data.notes
    )
    db.add(contrib)
    db.commit()
    db.refresh(contrib)
    return contrib

@app.put("/api/committee/contributions/{contrib_id}", response_model=ContributionResponse)
def update_contribution(contrib_id: int, contrib_data: ContributionUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_committee)):
    contrib = db.query(Contribution).filter(Contribution.id == contrib_id).first()
    if not contrib:
        raise HTTPException(status_code=404, detail="Contribution not found")
        
    # Resolve contributor updates
    if contrib_data.contributor_id:
        contributor = db.query(Contributor).filter(Contributor.id == contrib_data.contributor_id).first()
        if contributor:
            contrib.contributor_id = contributor.id
    elif contrib_data.contributor_name is not None or contrib_data.contributor_phone is not None:
        c_name = contrib_data.contributor_name.strip() if contrib_data.contributor_name is not None else contrib.contributor.name
        c_phone = contrib_data.contributor_phone.strip() if contrib_data.contributor_phone is not None else contrib.contributor.phone
        
        contributor = db.query(Contributor).filter(Contributor.name == c_name)
        if c_phone:
            contributor = contributor.filter(Contributor.phone == c_phone)
        else:
            contributor = contributor.filter(Contributor.phone == None)
            
        contributor = contributor.first()
        if not contributor:
            contributor = Contributor(name=c_name, phone=c_phone)
            db.add(contributor)
            db.commit()
            db.refresh(contributor)
            
        contrib.contributor_id = contributor.id
        
    if contrib_data.member_id is not None:
        contrib.member_id = contrib_data.member_id
    if contrib_data.amount is not None:
        contrib.amount = contrib_data.amount
    if contrib_data.date is not None:
        contrib.date = contrib_data.date
    if contrib_data.payment_method is not None:
        contrib.payment_method = contrib_data.payment_method
    if contrib_data.transaction_id is not None:
        contrib.transaction_id = contrib_data.transaction_id
    if contrib_data.event_id is not None:
        contrib.event_id = contrib_data.event_id
    if contrib_data.purpose is not None:
        contrib.purpose = contrib_data.purpose
    if contrib_data.status is not None:
        contrib.status = contrib_data.status
    if contrib_data.notes is not None:
        contrib.notes = contrib_data.notes
        
    db.commit()
    db.refresh(contrib)
    return contrib

@app.delete("/api/committee/contributions/{contrib_id}")
def delete_contribution(contrib_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_committee)):
    contrib = db.query(Contribution).filter(Contribution.id == contrib_id).first()
    if not contrib:
        raise HTTPException(status_code=404, detail="Contribution not found")
    db.delete(contrib)
    db.commit()
    return {"message": "Contribution deleted successfully"}

# Sponsorships Management
@app.get("/api/committee/sponsorships", response_model=List[SponsorshipResponse])
def get_sponsorships(db: Session = Depends(get_db), current_user: User = Depends(require_committee)):
    return db.query(Sponsorship).order_by(Sponsorship.date.desc()).all()

@app.post("/api/committee/sponsorships", response_model=SponsorshipResponse)
def create_sponsorship(spons_data: SponsorshipCreate, db: Session = Depends(get_db), current_user: User = Depends(require_committee)):
    spons = Sponsorship(
        user_id=spons_data.user_id,
        amount=spons_data.amount,
        date=spons_data.date,
        payment_method=spons_data.payment_method,
        transaction_id=spons_data.transaction_id,
        event_id=spons_data.event_id,
        status=spons_data.status,
        notes=spons_data.notes
    )
    db.add(spons)
    db.commit()
    db.refresh(spons)
    return spons

@app.delete("/api/committee/sponsorships/{spons_id}")
def delete_sponsorship(spons_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_committee)):
    spons = db.query(Sponsorship).filter(Sponsorship.id == spons_id).first()
    if not spons:
        raise HTTPException(status_code=404, detail="Sponsorship not found")
    db.delete(spons)
    db.commit()
    return {"message": "Sponsorship deleted successfully"}

# Public Contributions (Chandhalu) Management
# Mapped to contributions where member_id == None for backward compatibility with Finance Page
def map_contribution_to_chandha(c: Contribution) -> dict:
    return {
        "id": c.id,
        "donor_name": c.contributor.name,
        "donor_phone": c.contributor.phone,
        "amount": float(c.amount),
        "date": c.date,
        "payment_method": c.payment_method,
        "notes": c.notes,
        "created_at": c.created_at
    }

@app.get("/api/committee/chandhalu", response_model=List[ChandhaResponse])
def get_chandhalu(db: Session = Depends(get_db), current_user: User = Depends(require_committee)):
    contributions = db.query(Contribution).filter(Contribution.member_id == None).order_by(Contribution.date.desc()).all()
    return [map_contribution_to_chandha(c) for c in contributions]

@app.post("/api/committee/chandhalu", response_model=ChandhaResponse)
def create_chandha(chandha_data: ChandhaCreate, db: Session = Depends(get_db), current_user: User = Depends(require_committee)):
    c_name = chandha_data.donor_name.strip()
    c_phone = chandha_data.donor_phone.strip() if chandha_data.donor_phone else None
    
    contributor = db.query(Contributor).filter(Contributor.name == c_name)
    if c_phone:
        contributor = contributor.filter(Contributor.phone == c_phone)
    else:
        contributor = contributor.filter(Contributor.phone == None)
        
    contributor = contributor.first()
    if not contributor:
        contributor = Contributor(name=c_name, phone=c_phone)
        db.add(contributor)
        db.commit()
        db.refresh(contributor)
        
    contrib = Contribution(
        contributor_id=contributor.id,
        member_id=None,
        amount=chandha_data.amount,
        date=chandha_data.date,
        payment_method=chandha_data.payment_method,
        status="PAID",
        notes=chandha_data.notes
    )
    db.add(contrib)
    db.commit()
    db.refresh(contrib)
    return map_contribution_to_chandha(contrib)

@app.put("/api/committee/chandhalu/{chandha_id}", response_model=ChandhaResponse)
def update_chandha(chandha_id: int, chandha_data: ChandhaUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_committee)):
    contrib = db.query(Contribution).filter(Contribution.id == chandha_id, Contribution.member_id == None).first()
    if not contrib:
        raise HTTPException(status_code=404, detail="Public contribution record not found")
        
    c_name = chandha_data.donor_name.strip() if chandha_data.donor_name is not None else contrib.contributor.name
    c_phone = chandha_data.donor_phone.strip() if chandha_data.donor_phone is not None else contrib.contributor.phone
    
    contributor = db.query(Contributor).filter(Contributor.name == c_name)
    if c_phone:
        contributor = contributor.filter(Contributor.phone == c_phone)
    else:
        contributor = contributor.filter(Contributor.phone == None)
        
    contributor = contributor.first()
    if not contributor:
        contributor = Contributor(name=c_name, phone=c_phone)
        db.add(contributor)
        db.commit()
        db.refresh(contributor)
        
    contrib.contributor_id = contributor.id
    
    if chandha_data.amount is not None:
        contrib.amount = chandha_data.amount
    if chandha_data.date is not None:
        contrib.date = chandha_data.date
    if chandha_data.payment_method is not None:
        contrib.payment_method = chandha_data.payment_method
    if chandha_data.notes is not None:
        contrib.notes = chandha_data.notes
        
    db.commit()
    db.refresh(contrib)
    return map_contribution_to_chandha(contrib)

@app.delete("/api/committee/chandhalu/{chandha_id}")
def delete_chandha(chandha_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_committee)):
    contrib = db.query(Contribution).filter(Contribution.id == chandha_id, Contribution.member_id == None).first()
    if not contrib:
        raise HTTPException(status_code=404, detail="Public contribution record not found")
    db.delete(contrib)
    db.commit()
    return {"message": "Public contribution deleted successfully"}

# Expenses Management
@app.get("/api/committee/expenses", response_model=List[ExpenseResponse])
def get_expenses(db: Session = Depends(get_db), current_user: User = Depends(require_committee)):
    return db.query(Expense).order_by(Expense.date.desc()).all()

@app.post("/api/committee/expenses", response_model=ExpenseResponse)
def create_expense(
    name: str = Form(...),
    amount: float = Form(...),
    date: str = Form(...),  # YYYY-MM-DD
    category: str = Form(...),
    payment_method: str = Form(...),
    event_id: Optional[int] = Form(None),
    notes: Optional[str] = Form(None),
    receipt: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_committee)
):
    receipt_url = None
    if receipt:
        receipt_url = storage_client.save_file(receipt, subfolder="receipts")

    expense = Expense(
        name=name,
        amount=amount,
        date=datetime.datetime.strptime(date, "%Y-%m-%d").date(),
        category=category,
        payment_method=payment_method,
        event_id=event_id,
        paid_by=current_user.id,
        receipt_url=receipt_url,
        notes=notes
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

@app.delete("/api/committee/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_committee)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Delete receipt file from local storage if exists
    if expense.receipt_url:
        storage_client.delete_file(expense.receipt_url)
        
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}

# Media Management (Upload photo/video)
@app.post("/api/committee/media", response_model=MediaResponse)
def upload_media(
    event_id: int = Form(...),
    type: str = Form(...),  # 'PHOTO' or 'VIDEO'
    caption: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_committee)
):
    # Save the file using storage service
    file_url = storage_client.save_file(file, subfolder="media")
    thumbnail_url = file_url  # For local driver, we can use same url as thumbnail

    media_item = Media(
        event_id=event_id,
        type=type,
        file_url=file_url,
        thumbnail_url=thumbnail_url,
        caption=caption,
        uploaded_by=current_user.id
    )
    db.add(media_item)
    db.commit()
    db.refresh(media_item)
    return media_item

@app.delete("/api/committee/media/{media_id}")
def delete_media(media_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_committee)):
    media_item = db.query(Media).filter(Media.id == media_id).first()
    if not media_item:
        raise HTTPException(status_code=404, detail="Media not found")
    
    # Delete file from local storage
    storage_client.delete_file(media_item.file_url)
    
    db.delete(media_item)
    db.commit()
    return {"message": "Media item deleted successfully"}

# Events Management
@app.post("/api/committee/events", response_model=EventResponse)
def create_event(event_data: EventCreate, db: Session = Depends(get_db), current_user: User = Depends(require_committee)):
    try:
        t_parsed = datetime.datetime.strptime(event_data.time, "%H:%M").time()
    except Exception:
        t_parsed = datetime.time(9, 0) # fallback default

    event = Event(
        name=event_data.name,
        date=event_data.date,
        time=t_parsed,
        location=event_data.location,
        status=event_data.status,
        description=event_data.description,
        cover_image_url=event_data.cover_image_url
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@app.put("/api/committee/events/{event_id}", response_model=EventResponse)
def update_event(event_id: int, event_data: EventCreate, db: Session = Depends(get_db), current_user: User = Depends(require_committee)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    try:
        t_parsed = datetime.datetime.strptime(event_data.time, "%H:%M").time()
    except Exception:
        t_parsed = event.time

    event.name = event_data.name
    event.date = event_data.date
    event.time = t_parsed
    event.location = event_data.location
    event.status = event_data.status
    event.description = event_data.description
    if event_data.cover_image_url:
        event.cover_image_url = event_data.cover_image_url
        
    db.commit()
    db.refresh(event)
    return event

@app.delete("/api/committee/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_committee)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully"}

# Admin-only user management
@app.get("/api/admin/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(User).order_by(User.id.asc()).all()

@app.post("/api/admin/users", response_model=UserResponse)
def create_user(user_data: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")
        
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=user_data.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
