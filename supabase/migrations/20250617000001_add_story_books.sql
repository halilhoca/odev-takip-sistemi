-- Add is_story_book column to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS is_story_book BOOLEAN DEFAULT FALSE;

-- Add reading_status table for tracking read books
CREATE TABLE IF NOT EXISTS reading_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  reading_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create unique constraint to ensure one reading status per student per book
CREATE UNIQUE INDEX IF NOT EXISTS reading_status_student_book_unique 
ON reading_status(student_id, book_id);

-- Enable RLS
ALTER TABLE reading_status ENABLE ROW LEVEL SECURITY;

-- Create policies for reading_status
CREATE POLICY "Users can view reading status for their students" ON reading_status
FOR SELECT USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert reading status for their students" ON reading_status
FOR INSERT WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update reading status for their students" ON reading_status
FOR UPDATE USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete reading status for their students" ON reading_status
FOR DELETE USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- Public access policy for reading status (for shared reports)
CREATE POLICY "Public can view reading status for shared reports" ON reading_status
FOR SELECT USING (true);

-- Create updated_at trigger for reading_status
CREATE TRIGGER update_reading_status_updated_at BEFORE UPDATE
ON reading_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
