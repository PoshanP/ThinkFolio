# Storage Setup Instructions

## Quick Fix for Upload Error

The error "Storage bucket not configured" means the Supabase storage bucket for papers hasn't been created yet. Follow these steps:

### Step 1: Open Supabase Dashboard
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar

### Step 2: Run the Setup Script
1. Click on "New query" button
2. Copy the ENTIRE contents of `setup-storage.sql` file
3. Paste it into the SQL editor
4. Click "Run" button (or press Cmd/Ctrl + Enter)

### Step 3: Verify Success
You should see:
- A success message: "Storage bucket "papers" has been successfully configured!"
- A table showing the created bucket details

### Alternative: Manual Setup via UI

If the SQL script doesn't work, you can create the bucket manually:

1. Go to Supabase Dashboard
2. Click on "Storage" in the left sidebar
3. Click "New bucket" button
4. Enter:
   - Bucket name: `papers`
   - Public bucket: **UNCHECKED** (keep it private)
   - File size limit: 50MB
   - Allowed MIME types: application/pdf
5. Click "Create bucket"
6. After creating, click on the bucket name "papers"
7. Go to "Policies" tab
8. Add the following policies:
   - **INSERT Policy**: Allow authenticated users to upload to their own folder
   - **SELECT Policy**: Allow authenticated users to view their own files
   - **DELETE Policy**: Allow authenticated users to delete their own files

### Step 4: Test Upload
After setting up the storage bucket:
1. Go back to your application
2. Try uploading a PDF file again
3. It should now work!

## Troubleshooting

### If you still get errors:

1. **Check authentication**: Make sure you're logged in
2. **Check file size**: File must be under 50MB
3. **Check file type**: Only PDF files are allowed
4. **Check browser console**: Look for detailed error messages

### Common Issues:

- **"Bucket not found"**: The bucket wasn't created. Run the SQL script again.
- **"Permission denied"**: The RLS policies weren't set up correctly. Check the policies tab.
- **"Invalid file type"**: Make sure you're uploading a PDF file.

## Need Help?

If you continue to have issues:
1. Check the browser console for detailed error messages
2. Check Supabase logs in Dashboard > Logs > API
3. Verify your environment variables are set correctly