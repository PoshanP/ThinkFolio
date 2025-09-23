-- Fix RLS policies for chat_messages table
-- Run this in Supabase SQL Editor

-- First, check if the table has user_id column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'chat_messages';

-- Add user_id column if it doesn't exist
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view messages in their sessions" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in their sessions" ON chat_messages;

-- Create new, more permissive policies for chat_messages
-- Allow users to view messages in sessions they own
CREATE POLICY "Users can view messages in their sessions" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Allow users to insert messages in sessions they own
CREATE POLICY "Users can insert messages in their sessions" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Allow users to update their own messages
CREATE POLICY "Users can update messages in their sessions" ON chat_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Allow users to delete their own messages
CREATE POLICY "Users can delete messages in their sessions" ON chat_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Verify the policies
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'chat_messages';

-- Test message
SELECT 'RLS policies for chat_messages have been updated!' as message;