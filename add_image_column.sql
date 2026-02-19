-- Add image_url column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Optional: Add a comment
COMMENT ON COLUMN products.image_url IS 'URL to the product image (external or internal)';
