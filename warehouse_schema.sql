-- Warehouse Management System PostgreSQL Schema

-- USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL
);

-- ITEMS TABLE
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    note VARCHAR(255),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

-- Example: Insert demo user
INSERT INTO users (username, password) VALUES ('Crownee', '2005');

-- Example: Insert demo item
INSERT INTO items (name, category, quantity, min_stock, note, user_id)
VALUES ('Milk', 'Food', 10, 5, 'Requires cooling', 1);
