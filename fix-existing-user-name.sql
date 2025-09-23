-- Fix for existing users who signed up without their name being saved
-- Run this in Supabase SQL Editor

-- Update your profile with your name
UPDATE profiles
SET
    name = 'Poshan', -- Replace with your actual name
    updated_at = NOW()
WHERE email = 'poshan@twentyideas.com';

-- Verify the update
SELECT * FROM profiles WHERE email = 'poshan@twentyideas.com';