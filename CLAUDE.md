# CLAUDE.md - Feature 2: Export Chat History

## Mission
Implement functionality to download chat session conversations as PDF or TXT files. The export includes the paper title, session date, all messages (user and AI), and citation references with page numbers.

## Port Assignment
Run development server on port **3002**:
```bash
PORT=3002 npm run dev
```

## Database Changes Required
**None** - Uses existing tables (`chat_messages`, `message_citations`, `chat_sessions`, `papers`)

## Implementation Steps

### 1. Install Required Dependencies
```bash
npm install jspdf html2canvas
```

### 2. Create Export Utility
- File: `lib/utils/export-chat.ts`
- Export functions: `exportChatAsPDF()` and `exportChatAsTXT()`
- PDF export: Uses jsPDF library with proper page breaks
- TXT export: Creates formatted plain text with separators
- Both include: session title, paper title (if available), date, all messages, citations

### 3. Create Export Button Component
- File: `frontend/components/ExportChatButton.tsx`
- Dropdown menu with PDF and TXT options
- Shows loading state during export
- Disabled when no messages exist
- Handles errors gracefully

### 4. Integrate into Chat Page
- Import `ExportChatButton` in `app/chat-new/page.tsx`
- Add to top bar section with session data props

## Files to Modify/Create

**Create:**
- `lib/utils/export-chat.ts`
- `frontend/components/ExportChatButton.tsx`

**Modify:**
- `app/chat-new/page.tsx`
- `package.json` (add dependencies)

## Key Considerations

1. **Message Length**: Handle long messages that may span multiple PDF pages
2. **Citations Format**: Ensure citations are properly formatted and readable
3. **File Naming**: Use sanitized session titles for file names
4. **Empty Chats**: Disable export button when no messages exist
5. **Loading State**: Show loading indicator during export generation
6. **Error Handling**: Gracefully handle export failures with user feedback

## Testing Checklist
- [ ] PDF export includes all messages and citations
- [ ] TXT export is properly formatted
- [ ] Long messages don't break PDF layout
- [ ] File names are sanitized
- [ ] Empty chats cannot be exported

## Development Standards
- **Environment**: All secrets in `.env.local`
- **Components**: Extract reusable UI to `/frontend/components`
- **Types**: Full TypeScript coverage, no `any`
- **Functions**: Pure, small, early returns

## Stack
- **Frontend**: Next.js 14+ (App Router), Tailwind CSS
- **Backend**: Next.js API Routes (Edge Runtime)
- **Database**: Supabase (Postgres + pgvector + Storage)
