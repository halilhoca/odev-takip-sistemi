/*
  # Initial Schema Setup
  
  1. Tables
    - students (user's students)
    - books (available books)
    - student_books (links students to books)
    - programs (homework programs)
    - assignments (homework assignments)
    
  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users to manage their data
    - Policies for anonymous access to view assignments
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create student_books table (linking students to books)
CREATE TABLE IF NOT EXISTS student_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, book_id)
);

-- Create programs table
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_scheduled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  page_start INTEGER NOT NULL,
  page_end INTEGER NOT NULL,
  day TEXT NOT NULL,
  time TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students table
CREATE POLICY "Users can read their own students"
  ON students FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own students"
  ON students FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own students"
  ON students FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for books table
CREATE POLICY "Users can read their own books"
  ON books FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own books"
  ON books FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own books"
  ON books FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own books"
  ON books FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for student_books table
CREATE POLICY "Users can read student_books for their students"
  ON student_books FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_books.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create student_books for their students"
  ON student_books FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_books.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete student_books for their students"
  ON student_books FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_books.student_id
      AND students.user_id = auth.uid()
    )
  );

-- RLS Policies for programs table
CREATE POLICY "Users can read their own programs"
  ON programs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own programs"
  ON programs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own programs"
  ON programs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own programs"
  ON programs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for assignments table
CREATE POLICY "Users can read assignments for their programs"
  ON assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = assignments.program_id
      AND programs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create assignments for their programs"
  ON assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = assignments.program_id
      AND programs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update assignments for their programs"
  ON assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = assignments.program_id
      AND programs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete assignments for their programs"
  ON assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = assignments.program_id
      AND programs.user_id = auth.uid()
    )
  );

-- Public access policies
CREATE POLICY "Students can view their assignments"
  ON assignments FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Students can update assignment completion"
  ON assignments FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (
    -- Only allow updating is_completed field
    xmax = 0 -- Ensures no concurrent updates
    AND (
      SELECT true
      FROM assignments a2
      WHERE a2.id = assignments.id
      AND a2.program_id = assignments.program_id
      AND a2.student_id = assignments.student_id
      AND a2.book_id = assignments.book_id
      AND a2.page_start = assignments.page_start
      AND a2.page_end = assignments.page_end
      AND a2.day = assignments.day
      AND (a2.time IS NULL AND assignments.time IS NULL OR a2.time = assignments.time)
    )
  );

CREATE POLICY "Anyone can view student details"
  ON students FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can view book details"
  ON books FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can view program details"
  ON programs FOR SELECT
  TO anon
  USING (true);