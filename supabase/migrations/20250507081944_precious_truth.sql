/*
  # Update RLS policies for assignments
  
  1. Changes
    - Update RLS policy for anonymous users to update assignment completion status
    - Add policy for real-time subscription access
*/

-- Update the existing policy to allow students to update their assignments
DROP POLICY IF EXISTS "Students can update assignment completion" ON assignments;
CREATE POLICY "Students can update assignment completion"
  ON assignments FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (
    -- Only allow updating is_completed field
    (OLD.is_completed IS DISTINCT FROM NEW.is_completed)
    AND (
      OLD.program_id = NEW.program_id
      AND OLD.student_id = NEW.student_id
      AND OLD.book_id = NEW.book_id
      AND OLD.page_start = NEW.page_start
      AND OLD.page_end = NEW.page_end
      AND OLD.day = NEW.day
      AND OLD.time IS NOT DISTINCT FROM NEW.time
    )
  );

-- Add policy for real-time subscription access
CREATE POLICY "Enable read access for all users"
  ON assignments FOR SELECT
  TO anon
  USING (true);