-- Mini ERP Inventory Management System
-- PostgreSQL Database Schema

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- Create suppliers table
CREATE TABLE suppliers (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE products (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    supplier_id VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT
);

-- Create transactions table
CREATE TABLE transactions (
    id VARCHAR(20) PRIMARY KEY,
    product_id VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    type VARCHAR(10) NOT NULL CHECK (type IN ('purchase', 'sale')),
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- Create indexes for better performance
CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_stock ON products(stock);
CREATE INDEX idx_transactions_product_id ON transactions(product_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(date);

-- Create a view for low stock products (stock < 10)
CREATE VIEW low_stock_products AS
SELECT 
    p.id,
    p.name,
    p.category,
    p.price,
    p.stock,
    s.name as supplier_name
FROM products p
JOIN suppliers s ON p.supplier_id = s.id
WHERE p.stock < 10
ORDER BY p.stock ASC;

-- Create a view for inventory value report
CREATE VIEW inventory_value_report AS
SELECT 
    p.id,
    p.name,
    p.category,
    p.price,
    p.stock,
    (p.price * p.stock) as total_value,
    s.name as supplier_name
FROM products p
JOIN suppliers s ON p.supplier_id = s.id
ORDER BY total_value DESC;

-- Create a view for transaction summary
CREATE VIEW transaction_summary AS
SELECT 
    t.id,
    t.product_id,
    p.name as product_name,
    p.category,
    t.quantity,
    t.type,
    t.date,
    (t.quantity * p.price) as transaction_value
FROM transactions t
JOIN products p ON t.product_id = p.id
ORDER BY t.date DESC;

-- Create a function to update product stock automatically
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update stock based on transaction type
        IF NEW.type = 'purchase' THEN
            UPDATE products 
            SET stock = stock + NEW.quantity,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.product_id;
        ELSIF NEW.type = 'sale' THEN
            -- Check if sufficient stock exists
            IF (SELECT stock FROM products WHERE id = NEW.product_id) < NEW.quantity THEN
                RAISE EXCEPTION 'Insufficient stock for product %', NEW.product_id;
            END IF;
            
            UPDATE products 
            SET stock = stock - NEW.quantity,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.product_id;
        END IF;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        -- Reverse the stock change when transaction is deleted
        IF OLD.type = 'purchase' THEN
            UPDATE products 
            SET stock = stock - OLD.quantity,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = OLD.product_id;
        ELSIF OLD.type = 'sale' THEN
            UPDATE products 
            SET stock = stock + OLD.quantity,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = OLD.product_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update stock on transaction changes
CREATE TRIGGER trigger_update_product_stock
    AFTER INSERT OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stock();

-- Create a function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_products', (SELECT COUNT(*) FROM products),
        'total_suppliers', (SELECT COUNT(*) FROM suppliers),
        'total_transactions', (SELECT COUNT(*) FROM transactions),
        'inventory_value', (SELECT COALESCE(SUM(price * stock), 0) FROM products),
        'low_stock_count', (SELECT COUNT(*) FROM products WHERE stock < 10)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample data validation constraints
ALTER TABLE products ADD CONSTRAINT check_product_name_length CHECK (LENGTH(name) >= 2);
ALTER TABLE suppliers ADD CONSTRAINT check_supplier_name_length CHECK (LENGTH(name) >= 2);
ALTER TABLE suppliers ADD CONSTRAINT check_email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at timestamps
CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;