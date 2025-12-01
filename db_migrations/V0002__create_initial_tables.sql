-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(restaurant_id, name)
);

-- Create uniform_items table
CREATE TABLE IF NOT EXISTS uniform_items (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('tshirt', 'pants', 'jacket', 'badge')),
    size VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, item_type)
);

-- Create monthly_records table
CREATE TABLE IF NOT EXISTS monthly_records (
    id SERIAL PRIMARY KEY,
    uniform_item_id INTEGER NOT NULL REFERENCES uniform_items(id),
    month VARCHAR(50) NOT NULL,
    condition VARCHAR(50) NOT NULL CHECK (condition IN ('good', 'bad')),
    issue_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(uniform_item_id, month)
);

-- Insert default restaurants
INSERT INTO restaurants (name) VALUES 
    ('port'),
    ('dickens'),
    ('bar'),
    ('hookah'),
    ('runners')
ON CONFLICT (name) DO NOTHING;
