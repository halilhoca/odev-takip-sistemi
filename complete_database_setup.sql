-- Önce books tablosuna is_story_book kolonunu ekleyelim
ALTER TABLE books ADD COLUMN is_story_book BOOLEAN DEFAULT FALSE;

-- Books tablosuna subject kolonunu ekleyelim
ALTER TABLE books ADD COLUMN subject TEXT;

-- Assignments tablosundaki book_id'yi nullable yap (kitap seçmeden not ekleyebilmek için)
ALTER TABLE assignments ALTER COLUMN book_id DROP NOT NULL;

-- Coach notes tablosunu oluşturalım
CREATE TABLE IF NOT EXISTS coach_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Coach notes için unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS coach_notes_student_coach_unique 
ON coach_notes(student_id, coach_id);

-- Reading status tablosunu oluşturalım
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

-- Reading status için unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS reading_status_student_book_unique 
ON reading_status(student_id, book_id);

-- RLS'i etkinleştir
ALTER TABLE coach_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_status ENABLE ROW LEVEL SECURITY;

-- Coach notes için policies
DROP POLICY IF EXISTS "Users can view their own coach notes" ON coach_notes;
CREATE POLICY "Users can view their own coach notes" ON coach_notes
FOR SELECT USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own coach notes" ON coach_notes;
CREATE POLICY "Users can insert their own coach notes" ON coach_notes
FOR INSERT WITH CHECK (coach_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own coach notes" ON coach_notes;
CREATE POLICY "Users can update their own coach notes" ON coach_notes
FOR UPDATE USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own coach notes" ON coach_notes;
CREATE POLICY "Users can delete their own coach notes" ON coach_notes
FOR DELETE USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "Public can view coach notes for shared reports" ON coach_notes;
CREATE POLICY "Public can view coach notes for shared reports" ON coach_notes
FOR SELECT USING (true);

-- Reading status için policies
DROP POLICY IF EXISTS "Users can view reading status for their students" ON reading_status;
CREATE POLICY "Users can view reading status for their students" ON reading_status
FOR SELECT USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert reading status for their students" ON reading_status;
CREATE POLICY "Users can insert reading status for their students" ON reading_status
FOR INSERT WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update reading status for their students" ON reading_status;
CREATE POLICY "Users can update reading status for their students" ON reading_status
FOR UPDATE USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete reading status for their students" ON reading_status;
CREATE POLICY "Users can delete reading status for their students" ON reading_status
FOR DELETE USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Public can view reading status for shared reports" ON reading_status;
CREATE POLICY "Public can view reading status for shared reports" ON reading_status
FOR SELECT USING (true);

-- Updated_at trigger fonksiyonu (eğer yoksa)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger'ları oluştur
DROP TRIGGER IF EXISTS update_coach_notes_updated_at ON coach_notes;
CREATE TRIGGER update_coach_notes_updated_at BEFORE UPDATE
ON coach_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reading_status_updated_at ON reading_status;
CREATE TRIGGER update_reading_status_updated_at BEFORE UPDATE
ON reading_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
