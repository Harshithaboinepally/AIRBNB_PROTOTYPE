# Database Setup Guide

Complete guide to setting up the MySQL database for the Airbnb Clone project.

##  Prerequisites

- MySQL 8.0 or higher
- MySQL Workbench (optional, for GUI)

##  Quick Setup
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE airbnb_db;

# Use database
USE airbnb_db;

# Run the schema (copy from below)
```

---

##  Complete Database Schema

Copy and paste this entire schema into your MySQL terminal:
```sql
-- ====================================
-- CREATE DATABASE
-- ====================================
CREATE DATABASE IF NOT EXISTS airbnb_db;
USE airbnb_db;

-- ====================================
-- USERS TABLE
-- ====================================
CREATE TABLE users (
    user_id INT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    user_type ENUM('traveler', 'owner') NOT NULL,
    phone_number VARCHAR(20),
    about_me TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    country VARCHAR(100),
    languages VARCHAR(255),
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    profile_picture VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY unique_email (email),
    INDEX idx_user_type (user_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- PROPERTIES TABLE
-- ====================================
CREATE TABLE properties (
    property_id INT NOT NULL AUTO_INCREMENT,
    owner_id INT NOT NULL,
    property_name VARCHAR(255) NOT NULL,
    property_type ENUM('house', 'apartment', 'condo', 'villa', 'cabin', 'other') NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2),
    country VARCHAR(100) NOT NULL,
    price_per_night DECIMAL(10,2) NOT NULL,
    bedrooms INT NOT NULL,
    bathrooms INT NOT NULL,
    max_guests INT NOT NULL,
    amenities JSON,
    is_available TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (property_id),
    FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_owner (owner_id),
    INDEX idx_city (city),
    INDEX idx_price (price_per_night),
    INDEX idx_available (is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- PROPERTY IMAGES TABLE
-- ====================================
CREATE TABLE property_images (
    image_id INT NOT NULL AUTO_INCREMENT,
    property_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary TINYINT(1) DEFAULT 0,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (image_id),
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE,
    INDEX idx_property (property_id),
    INDEX idx_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- BOOKINGS TABLE
-- ====================================
CREATE TABLE bookings (
    booking_id INT NOT NULL AUTO_INCREMENT,
    property_id INT NOT NULL,
    traveler_id INT NOT NULL,
    owner_id INT NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    num_guests INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('PENDING', 'ACCEPTED', 'CANCELLED') DEFAULT 'PENDING',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    cancelled_by INT,
    cancellation_reason TEXT,
    PRIMARY KEY (booking_id),
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE,
    FOREIGN KEY (traveler_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_property (property_id),
    INDEX idx_traveler (traveler_id),
    INDEX idx_owner (owner_id),
    INDEX idx_status (status),
    INDEX idx_dates (check_in_date, check_out_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- FAVORITES TABLE
-- ====================================
CREATE TABLE favorites (
    favorite_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    property_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (favorite_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (user_id, property_id),
    INDEX idx_user (user_id),
    INDEX idx_property (property_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- SESSIONS TABLE (for session management)
-- ====================================
CREATE TABLE sessions (
    session_id VARCHAR(128) NOT NULL,
    expires BIGINT UNSIGNED NOT NULL,
    data TEXT,
    PRIMARY KEY (session_id),
    INDEX idx_expires (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

##  Sample Data (Optional - For Testing)
```sql
-- Insert Sample Users
INSERT INTO users (email, password_hash, name, user_type, city, country) VALUES
('traveler@example.com', '$2a$10$examplehashedpassword1', 'John Traveler', 'traveler', 'New York', 'USA'),
('owner@example.com', '$2a$10$examplehashedpassword2', 'Jane Owner', 'owner', 'Los Angeles', 'USA'),
('bob@example.com', '$2a$10$examplehashedpassword3', 'Bob Wilson', 'owner', 'San Francisco', 'USA');

-- Insert Sample Properties
INSERT INTO properties (owner_id, property_name, property_type, description, location, city, state, country, price_per_night, bedrooms, bathrooms, max_guests, amenities, is_available) VALUES
(2, 'Cozy Downtown Apartment', 'apartment', 'Beautiful apartment in the heart of downtown with city views', '123 Main St', 'San Francisco', 'CA', 'USA', 150.00, 2, 1, 4, '["WiFi", "Kitchen", "Parking"]', 1),
(2, 'Beach House Paradise', 'house', 'Stunning beach house with ocean views and private beach access', '456 Ocean Drive', 'Miami', 'FL', 'USA', 350.00, 4, 3, 8, '["WiFi", "Pool", "Beach Access", "Parking"]', 1),
(3, 'Mountain Cabin Retreat', 'cabin', 'Peaceful cabin in the mountains, perfect for nature lovers', '789 Mountain Road', 'Denver', 'CO', 'USA', 200.00, 3, 2, 6, '["WiFi", "Fireplace", "Hiking", "Parking"]', 1),
(3, 'Luxury Villa', 'villa', 'Elegant villa with modern amenities and beautiful garden', '321 Palm Avenue', 'Los Angeles', 'CA', 'USA', 500.00, 5, 4, 10, '["WiFi", "Pool", "Garden", "Gym", "Parking"]', 1);

-- Insert Sample Property Images
INSERT INTO property_images (property_id, image_url, is_primary, display_order) VALUES
(1, '/uploads/properties/property-1-1.jpg', 1, 1),
(1, '/uploads/properties/property-1-2.jpg', 0, 2),
(2, '/uploads/properties/property-2-1.jpg', 1, 1),
(2, '/uploads/properties/property-2-2.jpg', 0, 2),
(3, '/uploads/properties/property-3-1.jpg', 1, 1),
(4, '/uploads/properties/property-4-1.jpg', 1, 1);

-- Insert Sample Bookings
INSERT INTO bookings (property_id, traveler_id, owner_id, check_in_date, check_out_date, num_guests, total_price, status) VALUES
(1, 1, 2, '2025-12-01', '2025-12-05', 2, 600.00, 'ACCEPTED'),
(2, 1, 2, '2025-12-10', '2025-12-15', 4, 1750.00, 'PENDING'),
(3, 1, 3, '2025-11-20', '2025-11-25', 4, 1000.00, 'CANCELLED');

-- Insert Sample Favorites
INSERT INTO favorites (user_id, property_id) VALUES
(1, 2),
(1, 4);
```

---

##  Verify Setup

After creating the database, verify everything is set up correctly:
```sql
-- Check all tables
SHOW TABLES;

-- Should show:
-- +---------------------+
-- | Tables_in_airbnb_db |
-- +---------------------+
-- | bookings            |
-- | favorites           |
-- | properties          |
-- | property_images     |
-- | sessions            |
-- | users               |
-- +---------------------+

-- Check users table structure
DESCRIBE users;

-- Check properties table structure
DESCRIBE properties;

-- Check bookings table structure
DESCRIBE bookings;

-- Check property_images table structure
DESCRIBE property_images;

-- Check favorites table structure
DESCRIBE favorites;

-- Check sessions table structure
DESCRIBE sessions;

-- Count records (if you inserted sample data)
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as property_count FROM properties;
SELECT COUNT(*) as booking_count FROM bookings;
SELECT COUNT(*) as image_count FROM property_images;
SELECT COUNT(*) as favorite_count FROM favorites;
```

---

##  Table Descriptions

### **1. users**
Stores user account information for both travelers and property owners.

| Field | Type | Description |
|-------|------|-------------|
| user_id | INT | Primary key, auto-increment |
| email | VARCHAR(255) | Unique email address |
| password_hash | VARCHAR(255) | Hashed password (bcrypt) |
| name | VARCHAR(100) | User's full name |
| user_type | ENUM | 'traveler' or 'owner' |
| phone_number | VARCHAR(20) | Contact phone number |
| about_me | TEXT | User biography |
| city | VARCHAR(100) | User's city |
| state | VARCHAR(2) | US state code (e.g., 'CA', 'NY') |
| country | VARCHAR(100) | User's country |
| languages | VARCHAR(255) | Languages spoken |
| gender | ENUM | Gender identity |
| profile_picture | VARCHAR(500) | Profile picture URL |
| created_at | TIMESTAMP | Account creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

---

### **2. properties**
Stores property listings created by owners.

| Field | Type | Description |
|-------|------|-------------|
| property_id | INT | Primary key, auto-increment |
| owner_id | INT | Foreign key to users table |
| property_name | VARCHAR(255) | Property title |
| property_type | ENUM | Type: house, apartment, condo, villa, cabin, other |
| description | TEXT | Property description |
| location | VARCHAR(255) | Full address |
| city | VARCHAR(100) | City name |
| state | VARCHAR(2) | State code |
| country | VARCHAR(100) | Country name |
| price_per_night | DECIMAL(10,2) | Nightly rate |
| bedrooms | INT | Number of bedrooms |
| bathrooms | INT | Number of bathrooms |
| max_guests | INT | Maximum guest capacity |
| amenities | JSON | Array of amenities |
| is_available | TINYINT(1) | Availability status (0 or 1) |
| created_at | TIMESTAMP | Property creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

---

### **3. property_images**
Stores URLs of property images.

| Field | Type | Description |
|-------|------|-------------|
| image_id | INT | Primary key, auto-increment |
| property_id | INT | Foreign key to properties table |
| image_url | VARCHAR(500) | Image file path/URL |
| is_primary | TINYINT(1) | Primary image flag (0 or 1) |
| display_order | INT | Image display order |
| created_at | TIMESTAMP | Upload timestamp |

---

### **4. bookings**
Stores reservation information.

| Field | Type | Description |
|-------|------|-------------|
| booking_id | INT | Primary key, auto-increment |
| property_id | INT | Foreign key to properties table |
| traveler_id | INT | Foreign key to users table (traveler) |
| owner_id | INT | Foreign key to users table (owner) |
| check_in_date | DATE | Check-in date |
| check_out_date | DATE | Check-out date |
| num_guests | INT | Number of guests |
| total_price | DECIMAL(10,2) | Total booking price |
| status | ENUM | 'PENDING', 'ACCEPTED', 'CANCELLED' |
| booking_date | TIMESTAMP | Booking creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| cancelled_by | INT | User ID who cancelled |
| cancellation_reason | TEXT | Reason for cancellation |

---

### **5. favorites**
Stores users' favorite properties.

| Field | Type | Description |
|-------|------|-------------|
| favorite_id | INT | Primary key, auto-increment |
| user_id | INT | Foreign key to users table |
| property_id | INT | Foreign key to properties table |
| created_at | TIMESTAMP | Favorite added timestamp |

---

### **6. sessions**
Stores session data for user authentication.

| Field | Type | Description |
|-------|------|-------------|
| session_id | VARCHAR(128) | Primary key, session identifier |
| expires | BIGINT | Session expiration timestamp |
| data | TEXT | Serialized session data |

---

##  Create Database User (Recommended for Production)
```sql
-- Create dedicated user for the application
CREATE USER 'airbnb_user'@'localhost' IDENTIFIED BY 'secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON airbnb_db.* TO 'airbnb_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Verify
SHOW GRANTS FOR 'airbnb_user'@'localhost';
```

---

##  Reset Database (If Needed)
```sql
-- Option 1: Drop all tables
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS property_images;
DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS users;

-- Option 2: Drop entire database
DROP DATABASE IF EXISTS airbnb_db;
CREATE DATABASE airbnb_db;
USE airbnb_db;
-- Then run the schema again
```

---

##  Useful Queries

### Get all properties with owner information
```sql
SELECT 
    p.property_id,
    p.property_name,
    p.city,
    p.country,
    p.price_per_night,
    u.name as owner_name,
    u.email as owner_email
FROM properties p
JOIN users u ON p.owner_id = u.user_id
WHERE p.is_available = 1;
```

### Get bookings with property and traveler details
```sql
SELECT 
    b.booking_id,
    b.check_in_date,
    b.check_out_date,
    b.status,
    b.total_price,
    p.property_name,
    p.city,
    t.name as traveler_name,
    t.email as traveler_email,
    o.name as owner_name
FROM bookings b
JOIN properties p ON b.property_id = p.property_id
JOIN users t ON b.traveler_id = t.user_id
JOIN users o ON b.owner_id = o.user_id
ORDER BY b.booking_date DESC;
```

### Get property statistics
```sql
SELECT 
    p.property_name,
    p.city,
    p.price_per_night,
    COUNT(b.booking_id) as total_bookings,
    SUM(CASE WHEN b.status = 'ACCEPTED' THEN b.total_price ELSE 0 END) as total_revenue,
    COUNT(f.favorite_id) as times_favorited
FROM properties p
LEFT JOIN bookings b ON p.property_id = b.property_id
LEFT JOIN favorites f ON p.property_id = f.property_id
GROUP BY p.property_id
ORDER BY total_revenue DESC;
```

### Get user's favorite properties
```sql
SELECT 
    p.*,
    u.name as owner_name
FROM favorites f
JOIN properties p ON f.property_id = p.property_id
JOIN users u ON p.owner_id = u.user_id
WHERE f.user_id = 1;  -- Replace with actual user_id
```

### Get upcoming bookings
```sql
SELECT 
    b.*,
    p.property_name,
    p.city,
    p.country
FROM bookings b
JOIN properties p ON b.property_id = p.property_id
WHERE b.traveler_id = 1  -- Replace with actual user_id
  AND b.check_in_date >= CURDATE()
  AND b.status = 'ACCEPTED'
ORDER BY b.check_in_date ASC;
```

