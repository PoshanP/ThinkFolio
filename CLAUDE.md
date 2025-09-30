# CLAUDE.md - Feature 4: Highlight & Save Key Quotes

## Mission
Allow users to highlight and save important passages from AI responses. Users can select text, save it with its citation, and view all saved highlights in a dedicated page organized by paper.

## Port Assignment
Run development server on port **3004**:
```bash
PORT=3004 npm run dev
```

## Database Changes Required

Create new table: `saved_highlights`

```sql
CREATE TABLE saved_highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  chunk_id UUID REFERENCES paper_chunks(id) ON DELETE SET NULL,
  highlighted_text TEXT NOT NULL,
  page_no INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_highlights_user_id ON saved_highlights(user_id);
CREATE INDEX idx_highlights_paper_id ON saved_highlights(paper_id);
CREATE INDEX idx_highlights_created_at ON saved_highlights(created_at);

-- Enable RLS
ALTER TABLE saved_highlights ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own highlights
CREATE POLICY "Users can manage their own highlights"
ON saved_highlights
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

## Implementation Steps

### 1. Database Migration
- Run SQL in Supabase SQL Editor to create `saved_highlights` table
- Create indexes for performance
- Enable RLS and create policy

### 2. Create Highlight Selection Component
- File: `frontend/components/HighlightableText.tsx`
- Detects text selection on mouse up
- Calculates button position relative to selection
- Shows "Save Quote" button above selected text
- Calls `onSave` callback with selected text and page number

### 3. Create Save Highlight API Route
- File: `app/api/highlights/route.ts`
- POST: Save new highlight
- GET: Fetch highlights (optionally filtered by paper)
- DELETE: Remove highlight by ID
- All operations verify user ownership

### 4. Update Chat Page to Use Highlightable Text
- Import `HighlightableText` in `app/chat-new/page.tsx`
- Replace plain text rendering for assistant messages
- Add `handleSaveHighlight` function to call API
- Show success/error feedback

### 5. Create Highlights Page
- File: `app/highlights/page.tsx`
- Fetches all user highlights
- Groups highlights by paper
- Shows paper title, quote text, page number, date
- Delete functionality per highlight
- Empty state when no highlights exist

### 6. Add Navigation Link
- Update navbar/header to include link to `/highlights`

## Files to Modify/Create

**Create:**
- `frontend/components/HighlightableText.tsx`
- `app/api/highlights/route.ts`
- `app/highlights/page.tsx`

**Modify:**
- `app/chat-new/page.tsx`
- Navbar component (add link to highlights page)

## Key Considerations

1. **Text Selection**: Handle selection across multiple elements carefully
2. **Button Positioning**: Ensure the "Save Quote" button appears in the correct position
3. **Performance**: Optimize for large numbers of highlights (pagination, virtual scrolling)
4. **Mobile Support**: Adjust text selection and button positioning for mobile devices
5. **Search**: Add search functionality for highlights in the future
6. **Export**: Consider allowing export of all highlights
7. **Conflicts**: Handle cases where user selects text from multiple messages

## Testing Checklist
- [ ] Text selection works on all messages
- [ ] Save button appears at correct position
- [ ] Highlights are saved to database
- [ ] Highlights page displays all saved quotes
- [ ] Delete functionality works
- [ ] Grouped by paper correctly

## Development Standards
- **Environment**: All secrets in `.env.local`
- **Components**: Extract reusable UI to `/frontend/components`
- **Types**: Full TypeScript coverage, no `any`
- **Functions**: Pure, small, early returns

## Stack
- **Frontend**: Next.js 14+ (App Router), Tailwind CSS
- **Backend**: Next.js API Routes (Edge Runtime)
- **Database**: Supabase (Postgres + pgvector + Storage)
