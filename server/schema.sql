-- Database schema for Team Garuda application

-- Drop tables if they exist (clean setup)
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS sponsorships CASCADE;
DROP TABLE IF EXISTS contributions CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS chandhalu CASCADE;

-- Users table (Admins and Committee members)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'COMMITTEE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Members table (Normal Team Members)
CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    member_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(150) NOT NULL,
    status VARCHAR(20) DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED')),
    description TEXT,
    cover_image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contributions table (Member income)
CREATE TABLE contributions (
    id SERIAL PRIMARY KEY,
    member_id INT REFERENCES members(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    date DATE NOT NULL,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('UPI', 'CASH', 'BANK_TRANSFER', 'OTHER')),
    transaction_id VARCHAR(100),
    event_id INT REFERENCES events(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sponsorships table (Committee member income)
CREATE TABLE sponsorships (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('UPI', 'CASH', 'BANK_TRANSFER', 'OTHER')),
    transaction_id VARCHAR(100),
    event_id INT REFERENCES events(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'DECORATION', 'FOOD', 'TRANSPORT', 'PRINTING', 'EQUIPMENT', 
        'VENUE', 'POOJA', 'MEDIA', 'MAINTENANCE', 'OTHER'
    )),
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('UPI', 'CASH', 'BANK_TRANSFER', 'OTHER')),
    event_id INT REFERENCES events(id) ON DELETE SET NULL,
    paid_by INT REFERENCES users(id) ON DELETE SET NULL,
    receipt_url VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Media table (Organized by event)
CREATE TABLE media (
    id SERIAL PRIMARY KEY,
    event_id INT REFERENCES events(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('PHOTO', 'VIDEO')),
    file_url VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(255),
    caption VARCHAR(255),
    uploaded_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chandhalu table (General public contributions)
CREATE TABLE chandhalu (
    id SERIAL PRIMARY KEY,
    donor_name VARCHAR(100) NOT NULL,
    donor_phone VARCHAR(20),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('UPI', 'CASH', 'BANK_TRANSFER', 'OTHER')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance and lookup indexes
CREATE INDEX idx_members_member_id ON members(member_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_contributions_member ON contributions(member_id);
CREATE INDEX idx_sponsorships_user ON sponsorships(user_id);
CREATE INDEX idx_expenses_event ON expenses(event_id);
CREATE INDEX idx_media_event ON media(event_id);
CREATE INDEX idx_chandhalu_date ON chandhalu(date);
