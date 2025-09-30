# CLAUDE.md - Feature 3: PDF URL Upload

## Mission
Extend the existing upload functionality to accept PDF URLs. When a user pastes a URL, the system validates it points to a PDF, fetches the file, and processes it through the existing ingestion pipeline (parse → chunk → embed → store).

## Port Assignment
Run development server on port **3003**:
```bash
PORT=3003 npm run dev
```

## Database Changes Required
**None** - The existing `source` field in `papers` table will store the URL, and `storage_path` will point to Supabase Storage (same as file uploads).

## Implementation Steps

### 1. Update Upload Component
- File: `frontend/components/UploadSection.tsx`
- Add state: `uploadMode`, `pdfUrl`, `validatingUrl`
- Add mode toggle buttons: 'File' vs 'URL'
- Add URL input field with validation
- Add URL validation function (checks Content-Type header)
- Create `handleUrlSubmit` function to process URL uploads

### 2. Create Upload URL API Route
- File: `app/api/papers/upload-url/route.ts`
- Accepts: `url`, `title`, `userId`
- Fetches PDF from URL
- Validates Content-Type is PDF
- Converts to buffer
- Sanitizes PDF
- Extracts metadata and chunks
- Uploads to Supabase Storage
- Saves to database
- Creates initial chat session
- Returns paper and session data

## Files to Modify/Create

**Create:**
- `app/api/papers/upload-url/route.ts`

**Modify:**
- `frontend/components/UploadSection.tsx`

## Key Considerations

1. **URL Validation**: Check Content-Type header and URL extension before downloading
2. **File Size Limits**: Enforce maximum file size (e.g., 10MB) to prevent abuse
3. **Timeout Handling**: Set reasonable timeout for PDF download (e.g., 30 seconds)
4. **CORS Issues**: Some URLs may not allow fetching from your domain
5. **Error Messages**: Provide clear feedback for different failure scenarios (invalid URL, not a PDF, timeout, etc.)
6. **Security**: Validate and sanitize the PDF after download
7. **Rate Limiting**: Consider rate limiting URL uploads to prevent abuse

## Testing Checklist
- [ ] Valid PDF URLs are accepted
- [ ] Invalid URLs show appropriate error
- [ ] Non-PDF URLs are rejected
- [ ] Large files are handled gracefully
- [ ] Upload process matches file upload flow

## Development Standards
- **Environment**: All secrets in `.env.local`
- **Components**: Extract reusable UI to `/frontend/components`
- **Types**: Full TypeScript coverage, no `any`
- **Functions**: Pure, small, early returns

## Stack
- **Frontend**: Next.js 14+ (App Router), Tailwind CSS
- **Backend**: Next.js API Routes (Edge Runtime)
- **Database**: Supabase (Postgres + pgvector + Storage)
