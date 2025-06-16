-- Create coach_notes table
CREATE TABLE IF NOT EXISTS coach_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create unique constraint to ensure one note per student per coach
CREATE UNIQUE INDEX IF NOT EXISTS coach_notes_student_coach_unique 
ON coach_notes(student_id, coach_id);

-- Enable RLS
ALTER TABLE coach_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own coach notes" ON coach_notes
FOR SELECT USING (coach_id = auth.uid());

CREATE POLICY "Users can insert their own coach notes" ON coach_notes
FOR INSERT WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Users can update their own coach notes" ON coach_notes
FOR UPDATE USING (coach_id = auth.uid());

CREATE POLICY "Users can delete their own coach notes" ON coach_notes
FOR DELETE USING (coach_id = auth.uid());

-- Public access policy for sharing reports
CREATE POLICY "Public can view coach notes for shared reports" ON coach_notes
FOR SELECT USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_coach_notes_updated_at BEFORE UPDATE
ON coach_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
