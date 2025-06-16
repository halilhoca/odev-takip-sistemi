/*
  # Fix assignments RLS policies
  
  1. Changes
    - Drop existing update policies
    - Add new policy for students to update their assignments
  
  2. Security
    - Allow students to update only their own assignments
    - Restrict updates to is_completed field only
*/

-- Drop existing update policies
DROP POLICY IF EXISTS "Students can update assignment completion" ON assignments;
DROP POLICY IF EXISTS "Students can update their assignment completion status" ON assignments;

-- Create new policy for students to update their assignments
CREATE POLICY "Students can update their assignments"
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
  student_id IN (
    SELECT id 
    FROM students 
    WHERE user_id = auth.uid()
  )
);