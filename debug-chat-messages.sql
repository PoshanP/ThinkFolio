-- Debug chat_messages table structure and constraints
-- Run this in Supabase SQL Editor to see what's wrong

-- 1. Check table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'chat_messages'
ORDER BY ordinal_position;

-- 2. Check constraints
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'chat_messages'::regclass;

-- 3. Check if RLS is enabled
SELECT
    relname,
    relrowsecurity,
    relforcerowsecurity
FROM pg_class
WHERE relname = 'chat_messages';

-- 4. Check current RLS policies
SELECT
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'chat_messages';

-- 5. Check if user_id column exists and its constraints
SELECT
    a.attname AS column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
    a.attnotnull AS is_required
FROM pg_attribute a
WHERE a.attrelid = 'chat_messages'::regclass
AND a.attname = 'user_id'
AND a.attnum > 0
AND NOT a.attisdropped;

-- 6. Try to insert a test message directly (replace with your actual IDs)
-- This will show the exact error if it fails
/*
INSERT INTO chat_messages (session_id, role, content, user_id)
VALUES (
    'YOUR_SESSION_ID_HERE',
    'assistant',
    'Test message',
    'YOUR_USER_ID_HERE'
);
*/

-- 7. Show all columns with their properties
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'chat_messages';