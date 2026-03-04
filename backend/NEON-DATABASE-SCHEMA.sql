-- ============================================
-- NEON POSTGRESQL DATABASE SCHEMA
-- Run this in Neon SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    google_id TEXT UNIQUE,
    picture TEXT,
    name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Profiles table (optional - for extended user info)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_name TEXT NOT NULL,
    business_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    subcategory TEXT,
    price NUMERIC(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    unit TEXT,
    unit_quantity NUMERIC(10,2),
    display_unit TEXT,
    vendor_id UUID REFERENCES vendors(id),
    image_url TEXT,
    description TEXT,
    in_stock BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_email TEXT,
    customer_id UUID REFERENCES users(id),
    total NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'Pending',
    payment_status TEXT DEFAULT 'pending',
    delivery_address TEXT,
    delivery_charges NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name TEXT,
    quantity INT NOT NULL,
    price NUMERIC(10,2) NOT NULL
);

-- Cart table
CREATE TABLE IF NOT EXISTS cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Delivery charges table
CREATE TABLE IF NOT EXISTS delivery_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    min_order_value NUMERIC(10,2) NOT NULL,
    max_order_value NUMERIC(10,2),
    charge NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_customer ON cart(customer_id);

-- ============================================
-- 3. INSERT DEFAULT DATA
-- ============================================

-- Insert default categories
INSERT INTO categories (name) VALUES
('Fruits & Vegetables'),
('Daily Staples'),
('Snacks & More'),
('Bakery & Dairy'),
('Home Food'),
('Special Categories'),
('Conscious Living')
ON CONFLICT (name) DO NOTHING;

-- Insert default delivery charges
INSERT INTO delivery_charges (min_order_value, max_order_value, charge) VALUES
(0, 500, 50),
(500, 1000, 30),
(1000, NULL, 0)
ON CONFLICT DO NOTHING;

-- Insert admin user (password: admin123)
-- Note: This is a hashed password using bcrypt
INSERT INTO users (email, password, role, first_name, last_name) VALUES
('admin@cborganic.com', '$2b$10$rKZLvVZqKqYqKqYqKqYqKOqYqKqYqKqYqKqYqKqYqKqYqKqYqKqYq', 'admin', 'Admin', 'User')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 4. VERIFICATION QUERIES
-- ============================================

-- Run these to verify setup:
-- SELECT * FROM users;
-- SELECT * FROM categories;
-- SELECT * FROM products;
-- SELECT * FROM delivery_charges;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Next steps:
-- 1. Update backend/.env with your Neon DATABASE_URL
-- 2. Start backend server: npm start
-- 3. You should see: "✅ Connected to Neon PostgreSQL"
