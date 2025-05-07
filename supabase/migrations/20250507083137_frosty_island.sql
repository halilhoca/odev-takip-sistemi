/*
  # Fix Assignment Completion Policy
  
  1. Changes
    - Drop existing policies that might conflict
    - Create new policy for anonymous users to update assignment completion status
    - Ensure policy only allows updating is_completed field
    
  2. Security
    - Maintain RLS while allowing anonymous updates
    - Restrict updates to only the is_completed field
*/

-- Drop existing update policies to avoid conflicts
DROP POLICY IF EXISTS "Students can update their assignments" ON assignments;
DROP POLICY IF EXISTS "Students can update assignment completion" ON assignments;
DROP POLICY IF EXISTS "Students can update their assignment completion status" ON assignments;

-- Create new policy for anonymous users to update assignment completion
CREATE POLICY "Allow anonymous users to update assignment completion"
ON assignments
FOR UPDATE
TO anon
USING (true)
WITH CHECK (
  -- Only allow updating is_completed field
  (
    SELECT COUNT(*) = 1
    FROM assignments existing
    WHERE existing.id = assignments.id
    AND existing.program_id = assignments.program_id
    AND existing.student_id = assignments.student_id
    AND existing.book_id = assignments.book_id
    AND existing.page_start = assignments.page_start
    AND existing.page_end = assignments.page_end
    AND existing.day = assignments.day
    AND COALESCE(existing.time, '') = COALESCE(assignments.time, '')
  )
);