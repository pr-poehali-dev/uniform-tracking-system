-- Создание таблицы ресторанов
CREATE TABLE IF NOT EXISTS restaurants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы сотрудников
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(restaurant_id, name)
);

-- Создание таблицы униформы
CREATE TABLE IF NOT EXISTS uniform_items (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('tshirt', 'pants', 'jacket', 'badge')),
  size VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, item_type)
);

-- Создание таблицы ежемесячных записей
CREATE TABLE IF NOT EXISTS monthly_records (
  id SERIAL PRIMARY KEY,
  uniform_item_id INTEGER NOT NULL REFERENCES uniform_items(id),
  month VARCHAR(20) NOT NULL,
  condition VARCHAR(20) NOT NULL CHECK (condition IN ('good', 'bad', 'needs_replacement')),
  issue_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(uniform_item_id, month)
);

-- Вставка начальных данных ресторанов
INSERT INTO restaurants (name) VALUES 
  ('port'),
  ('dickens'),
  ('bar'),
  ('hookah'),
  ('runners')
ON CONFLICT (name) DO NOTHING;

-- Индексы для ускорения запросов
CREATE INDEX IF NOT EXISTS idx_employees_restaurant ON employees(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_uniform_items_employee ON uniform_items(employee_id);
CREATE INDEX IF NOT EXISTS idx_monthly_records_uniform_item ON monthly_records(uniform_item_id);
CREATE INDEX IF NOT EXISTS idx_monthly_records_month ON monthly_records(month);