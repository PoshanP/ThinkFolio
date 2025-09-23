-- ========================================
-- SETUP STORAGE BUCKET FOR PAPERS
-- Run this entire script in Supabase SQL Editor
-- ========================================

-- Step 1: Create the storage bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'papers',
  'papers',
  false,
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf']::text[];

-- Step 2: Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload their own papers" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own papers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own papers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own papers" ON storage.objects;

-- Step 4: Create comprehensive RLS policies
-- Policy for INSERT - users can upload to their own folder
CREATE POLICY "Users can upload their own papers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'papers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for SELECT - users can view their own papers
CREATE POLICY "Users can view their own papers"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'papers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for UPDATE - users can update their own papers
CREATE POLICY "Users can update their own papers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'papers' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'papers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for DELETE - users can delete their own papers
CREATE POLICY "Users can delete their own papers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'papers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 5: Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'papers';

-- Step 6: Test message
SELECT 'Storage bucket "papers" has been successfully configured!' as message;