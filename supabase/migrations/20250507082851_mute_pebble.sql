/*
  # Update Assignment Policies
  
  1. Changes
    - Fix student assignment completion policy
    - Add real-time subscription access policy
  
  2. Security
    - Allow anonymous users to update assignment completion status
    - Enable read access for real-time updates
*/

-- Update the existing policy to allow students to update their assignments
DROP POLICY IF EXISTS "Students can update assignment completion" ON assignments;
CREATE POLICY "Students can update assignment completion"
  ON assignments FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (
    -- Only allow updating is_completed field
    xmax = 0 AND (
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

-- Add policy for real-time subscription access
CREATE POLICY "Enable read access for all users"
  ON assignments FOR SELECT
  TO anon
  USING (true);