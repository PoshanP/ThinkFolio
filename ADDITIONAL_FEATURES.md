# Additional Features Implementation Guide

This document provides detailed implementation instructions for the 4 new features being added to ThinkFolio. Each feature includes port assignments for parallel development, database schema changes, implementation steps, and key considerations.

---

## Development Ports Assignment

To enable parallel development across different Claude Code instances:

| Feature | Port | Branch Name (Suggested) |
|---------|------|------------------------|
| **Feature 1: Dark Mode Toggle** | 3001 | `feature/dark-mode` |
| **Feature 2: Export Chat History** | 3002 | `feature/export-chat` |
| **Feature 3: PDF URL Upload** | 3003 | `feature/url-upload` |
| **Feature 4: Highlight & Save Quotes** | 3004 | `feature/highlights` |

### How to Run on Different Ports

Run the development server with the port flag for each feature.

---

## Feature 1: Dark Mode Toggle

### Description
A persistent theme switcher that allows users to toggle between light and dark modes. The preference is saved to the database and localStorage, and automatically applied on subsequent visits. All components support both themes with appropriate color palettes.

### Port: 3001

### Database Changes Required

Add theme preference to profiles table:
- Column: `theme_preference`
- Type: `text`
- Default: `'system'`
- Check constraint: `('light', 'dark', 'system')`

### Implementation Steps

#### 1. Database Migration
- Run SQL in Supabase SQL Editor to add `theme_preference` column to `profiles` table
- Verify the column was added

#### 2. Create Theme Context
- File: `lib/contexts/ThemeContext.tsx`
- Provides theme state management with three modes: light, dark, system
- Loads theme from localStorage first, then database
- Listens to system preference changes for 'system' mode
- Applies theme class to document root
- Saves theme changes to both localStorage and database

#### 3. Add Theme Toggle Component
- File: `frontend/components/ThemeToggle.tsx`
- Three buttons: Sun (light), Moon (dark), Monitor (system)
- Visual indication of active theme
- Import `useTheme` hook from ThemeContext

#### 4. Update Root Layout
- File: `app/layout.tsx`
- Wrap app with `ThemeProvider`
- Add `suppressHydrationWarning` to `<html>` tag
- Add dark mode classes to body

#### 5. Update Tailwind Config
- File: `tailwind.config.js`
- Add `darkMode: 'class'` to enable class-based dark mode

#### 6. Add ThemeToggle to Navbar/Header
- Place `<ThemeToggle />` component in visible location

### Key Considerations

1. **Hydration Issues**: Use `suppressHydrationWarning` on `<html>` tag to prevent hydration mismatches
2. **System Preference**: Listen to `prefers-color-scheme` media query changes
3. **Performance**: Theme application should be immediate (no flash of wrong theme)
4. **Component Coverage**: Ensure all existing components have proper `dark:` variants in Tailwind classes
5. **Testing**: Test all three modes (light, dark, system) across all pages

### Files to Modify/Create

**Create:**
- `lib/contexts/ThemeContext.tsx`
- `frontend/components/ThemeToggle.tsx`

**Modify:**
- `app/layout.tsx`
- `tailwind.config.js`
- `frontend/components/Navbar.tsx` (or wherever header is)
- All component files (add `dark:` Tailwind variants)

---

## Feature 2: Export Chat History

### Description
Enables users to download their chat session conversations as PDF or TXT files. The export includes the paper title, session date, all messages (user and AI), and citation references with page numbers.

### Port: 3002

### Database Changes Required
**None** - Uses existing tables (`chat_messages`, `message_citations`, `chat_sessions`, `papers`)

### Implementation Steps

#### 1. Install Required Dependencies
Install `jspdf` and `html2canvas` packages

#### 2. Create Export Utility
- File: `lib/utils/export-chat.ts`
- Export functions: `exportChatAsPDF()` and `exportChatAsTXT()`
- PDF export: Uses jsPDF library with proper page breaks
- TXT export: Creates formatted plain text with separators
- Both include: session title, paper title (if available), date, all messages, citations

#### 3. Create Export Button Component
- File: `frontend/components/ExportChatButton.tsx`
- Dropdown menu with PDF and TXT options
- Shows loading state during export
- Disabled when no messages exist
- Handles errors gracefully

#### 4. Integrate into Chat Page
- Import `ExportChatButton` in `app/chat-new/page.tsx`
- Add to top bar section with session data props

### Key Considerations

1. **Message Length**: Handle long messages that may span multiple PDF pages
2. **Citations Format**: Ensure citations are properly formatted and readable
3. **File Naming**: Use sanitized session titles for file names
4. **Empty Chats**: Disable export button when no messages exist
5. **Loading State**: Show loading indicator during export generation
6. **Error Handling**: Gracefully handle export failures with user feedback

### Files to Modify/Create

**Create:**
- `lib/utils/export-chat.ts`
- `frontend/components/ExportChatButton.tsx`

**Modify:**
- `app/chat-new/page.tsx`
- `package.json` (add dependencies)

---

## Feature 3: PDF URL Upload

### Description
Extends the existing upload functionality to accept PDF URLs. When a user pastes a URL, the system validates it points to a PDF, fetches the file, and processes it through the existing ingestion pipeline (parse → chunk → embed → store).

### Port: 3003

### Database Changes Required
**None** - The existing `source` field in `papers` table will store the URL, and `storage_path` will point to Supabase Storage (same as file uploads).

### Implementation Steps

#### 1. Update Upload Component
- File: `frontend/components/UploadSection.tsx`
- Add state: `uploadMode`, `pdfUrl`, `validatingUrl`
- Add mode toggle buttons: 'File' vs 'URL'
- Add URL input field with validation
- Add URL validation function (checks Content-Type header)
- Create `handleUrlSubmit` function to process URL uploads

#### 2. Create Upload URL API Route
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

### Key Considerations

1. **URL Validation**: Check Content-Type header and URL extension before downloading
2. **File Size Limits**: Enforce maximum file size (e.g., 10MB) to prevent abuse
3. **Timeout Handling**: Set reasonable timeout for PDF download (e.g., 30 seconds)
4. **CORS Issues**: Some URLs may not allow fetching from your domain
5. **Error Messages**: Provide clear feedback for different failure scenarios (invalid URL, not a PDF, timeout, etc.)
6. **Security**: Validate and sanitize the PDF after download
7. **Rate Limiting**: Consider rate limiting URL uploads to prevent abuse

### Files to Modify/Create

**Create:**
- `app/api/papers/upload-url/route.ts`

**Modify:**
- `frontend/components/UploadSection.tsx`

---

## Feature 4: Highlight & Save Key Quotes

### Description
Allows users to highlight and save important passages from AI responses. Users can select text, save it with its citation, and view all saved highlights in a dedicated page organized by paper.

### Port: 3004

### Database Changes Required

Create new table: `saved_highlights`

Columns:
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to auth.users)
- `paper_id` (uuid, foreign key to papers)
- `message_id` (uuid, foreign key to chat_messages, nullable)
- `chunk_id` (uuid, foreign key to paper_chunks, nullable)
- `highlighted_text` (text)
- `page_no` (integer)
- `notes` (text, nullable)
- `created_at` (timestamptz)

Create indexes on:
- `user_id`
- `paper_id`
- `created_at`

Enable RLS with policy: Users can manage their own highlights

### Implementation Steps

#### 1. Database Migration
- Run SQL in Supabase SQL Editor to create `saved_highlights` table
- Create indexes for performance
- Enable RLS and create policy

#### 2. Create Highlight Selection Component
- File: `frontend/components/HighlightableText.tsx`
- Detects text selection on mouse up
- Calculates button position relative to selection
- Shows "Save Quote" button above selected text
- Calls `onSave` callback with selected text and page number

#### 3. Create Save Highlight API Route
- File: `app/api/highlights/route.ts`
- POST: Save new highlight
- GET: Fetch highlights (optionally filtered by paper)
- DELETE: Remove highlight by ID
- All operations verify user ownership

#### 4. Update Chat Page to Use Highlightable Text
- Import `HighlightableText` in `app/chat-new/page.tsx`
- Replace plain text rendering for assistant messages
- Add `handleSaveHighlight` function to call API
- Show success/error feedback

#### 5. Create Highlights Page
- File: `app/highlights/page.tsx`
- Fetches all user highlights
- Groups highlights by paper
- Shows paper title, quote text, page number, date
- Delete functionality per highlight
- Empty state when no highlights exist

#### 6. Add Navigation Link
- Update navbar/header to include link to `/highlights`

### Key Considerations

1. **Text Selection**: Handle selection across multiple elements carefully
2. **Button Positioning**: Ensure the "Save Quote" button appears in the correct position
3. **Performance**: Optimize for large numbers of highlights (pagination, virtual scrolling)
4. **Mobile Support**: Adjust text selection and button positioning for mobile devices
5. **Search**: Add search functionality for highlights in the future
6. **Export**: Consider allowing export of all highlights
7. **Conflicts**: Handle cases where user selects text from multiple messages

### Files to Modify/Create

**Create:**
- `frontend/components/HighlightableText.tsx`
- `app/api/highlights/route.ts`
- `app/highlights/page.tsx`

**Modify:**
- `app/chat-new/page.tsx`
- Navbar component (add link to highlights page)

---

## Testing Checklist

### Feature 1: Dark Mode
- [ ] Theme persists after page reload
- [ ] Theme syncs across tabs
- [ ] System preference mode works correctly
- [ ] All pages support both themes
- [ ] No flash of wrong theme on load

### Feature 2: Export Chat
- [ ] PDF export includes all messages and citations
- [ ] TXT export is properly formatted
- [ ] Long messages don't break PDF layout
- [ ] File names are sanitized
- [ ] Empty chats cannot be exported

### Feature 3: URL Upload
- [ ] Valid PDF URLs are accepted
- [ ] Invalid URLs show appropriate error
- [ ] Non-PDF URLs are rejected
- [ ] Large files are handled gracefully
- [ ] Upload process matches file upload flow

### Feature 4: Highlights
- [ ] Text selection works on all messages
- [ ] Save button appears at correct position
- [ ] Highlights are saved to database
- [ ] Highlights page displays all saved quotes
- [ ] Delete functionality works
- [ ] Grouped by paper correctly

---

## Deployment Notes

1. **Database Migrations**: Run all SQL migrations in Supabase dashboard before deploying
2. **Environment Variables**: No new env vars needed
3. **Dependencies**: Run `npm install` after pulling changes
4. **Build Test**: Run `npm run build` to ensure no TypeScript errors
5. **Port Conflicts**: Ensure no other services are using assigned ports

---

## Common Issues & Solutions

### Issue: Dark mode flashing on load
**Solution**: Add `suppressHydrationWarning` to `<html>` tag and initialize theme in a blocking script

### Issue: PDF export fails for long chats
**Solution**: Increase page check threshold and add more frequent page breaks

### Issue: URL upload times out
**Solution**: Increase fetch timeout and show progress indicator

### Issue: Highlight button appears off-screen
**Solution**: Add boundary detection and reposition button within viewport

---

## Support

For issues or questions about any of these features, contact the development team or create an issue in the project repository.
