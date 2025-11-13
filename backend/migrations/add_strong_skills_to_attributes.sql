-- Migration: Add strong_skills column to attributes table
-- Description: Adds a JSONB column to store the user's known/strong technical skills separately
-- Date: 2025-11-11

-- Add the strong_skills column
ALTER TABLE attributes 
ADD COLUMN IF NOT EXISTS strong_skills JSONB;

-- Add comment to document the column purpose
COMMENT ON COLUMN attributes.strong_skills IS 'Stores the technical skills the user considers themselves proficient in (known skills from questionnaire)';
