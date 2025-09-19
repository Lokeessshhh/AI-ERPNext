-- Fix schema to support UUID length
-- UUIDs are 36 characters long, but we had VARCHAR(20)

-- Disable foreign key checks temporarily
ALTER TABLE transactions DROP CONSTRAINT transactions_product_id_fkey;
ALTER TABLE products DROP CONSTRAINT products_supplier_id_fkey;

-- Update suppliers table
ALTER TABLE suppliers ALTER COLUMN id TYPE VARCHAR(50);

-- Update products table  
ALTER TABLE products ALTER COLUMN id TYPE VARCHAR(50);
ALTER TABLE products ALTER COLUMN supplier_id TYPE VARCHAR(50);

-- Update transactions table
ALTER TABLE transactions ALTER COLUMN id TYPE VARCHAR(50);
ALTER TABLE transactions ALTER COLUMN product_id TYPE VARCHAR(50);

-- Re-enable foreign key constraints
ALTER TABLE products ADD CONSTRAINT products_supplier_id_fkey 
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT;

ALTER TABLE transactions ADD CONSTRAINT transactions_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;