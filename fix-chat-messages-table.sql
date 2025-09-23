-- Fix chat_messages table structure
-- Run this in Supabase SQL Editor

-- Add metadata column if it doesn't exist
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Check if we have the metadata column now
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'chat_messages'
AND column_name = 'metadata';

-- Now let's test if we can insert a message
-- First get a valid session ID to test with
SELECT id, user_id, paper_id, created_at
FROM chat_sessions
ORDER BY created_at DESC
LIMIT 5;

-- Show the updated table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'chat_messages'
ORDER BY ordinal_position;

SELECT 'Table structure updated! The metadata column should now exist.' as message;