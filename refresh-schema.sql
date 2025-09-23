-- Force refresh the PostgREST schema cache
-- Run this in Supabase SQL Editor to refresh the schema cache

NOTIFY pgrst, 'reload schema';