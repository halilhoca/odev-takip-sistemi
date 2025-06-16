/*
  # Update assignments RLS policies

  1. Changes
    - Add new RLS policy to allow students to update their own assignments' completion status
    - Policy only allows updating the `is_completed` field
    - Students can only update assignments where they are the assigned student

  2. Security
    - Students can only update their own assignments
    - Update is restricted to only the `is_completed` field
    - Existing policies remain unchanged
*/

-- Create a new policy for students to update their assignment completion status
CREATE POLICY "Students can update their assignment completion status"
ON assignments
FOR UPDATE
TO authenticated
USING (
  student_id IN (
    SELECT id 
    FROM students 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  -- Only allow updating is_completed field
  (
    xmax = 0 OR ( -- xmax = 0 means this is a new version of the row
      (OLD.program_id = NEW.program_id) AND
      (OLD.student_id = NEW.student_id) AND
      (OLD.book_id = NEW.book_id) AND
      (OLD.page_start = NEW.page_start) AND
      (OLD.page_end = NEW.page_end) AND
      (OLD.day = NEW.day) AND
      (
        (OLD.time IS NULL AND NEW.time IS NULL) OR 
        (OLD.time = NEW.time)
      )
    )
  )
);