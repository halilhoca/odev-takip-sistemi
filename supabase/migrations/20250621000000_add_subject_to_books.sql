-- Add subject column to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS subject TEXT;

-- Update existing books with default subject if needed
-- Kitaplar için varsayılan ders kategorileri
UPDATE books SET subject = 'Genel' WHERE subject IS NULL OR subject = '';
