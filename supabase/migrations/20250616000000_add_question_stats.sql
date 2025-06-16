-- Add columns for question statistics to assignments table
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS correct_answers INTEGER DEFAULT 0;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS wrong_answers INTEGER DEFAULT 0;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS blank_answers INTEGER DEFAULT 0;
