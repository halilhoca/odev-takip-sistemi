-- Make book_id nullable in assignments table
ALTER TABLE assignments ALTER COLUMN book_id DROP NOT NULL;

-- Add comment to explain the change
COMMENT ON COLUMN assignments.book_id IS 'Book ID - can be null for general notes without specific book';
