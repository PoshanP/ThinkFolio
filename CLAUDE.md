# CLAUDE.md - Feature 1: Dark Mode Toggle

## Mission
Implement a persistent theme switcher that allows users to toggle between light and dark modes. The preference is saved to the database and localStorage, and automatically applied on subsequent visits.

## Port Assignment
Run development server on port **3001**:
```bash
PORT=3001 npm run dev
```

## Database Changes Required

Add theme preference to profiles table:
```sql
ALTER TABLE profiles ADD COLUMN theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system'));
```

## Implementation Steps

### 1. Database Migration
- Run SQL in Supabase SQL Editor to add `theme_preference` column to `profiles` table
- Verify the column was added

### 2. Create Theme Context
- File: `lib/contexts/ThemeContext.tsx`
- Provides theme state management with three modes: light, dark, system
- Loads theme from localStorage first, then database
- Listens to system preference changes for 'system' mode
- Applies theme class to document root
- Saves theme changes to both localStorage and database

### 3. Add Theme Toggle Component
- File: `frontend/components/ThemeToggle.tsx`
- Three buttons: Sun (light), Moon (dark), Monitor (system)
- Visual indication of active theme
- Import `useTheme` hook from ThemeContext

### 4. Update Root Layout
- File: `app/layout.tsx`
- Wrap app with `ThemeProvider`
- Add `suppressHydrationWarning` to `<html>` tag
- Add dark mode classes to body

### 5. Update Tailwind Config
- File: `tailwind.config.js`
- Add `darkMode: 'class'` to enable class-based dark mode

### 6. Add ThemeToggle to Navbar/Header
- Place `<ThemeToggle />` component in visible location

## Files to Modify/Create

**Create:**
- `lib/contexts/ThemeContext.tsx`
- `frontend/components/ThemeToggle.tsx`

**Modify:**
- `app/layout.tsx`
- `tailwind.config.js`
- `frontend/components/Navbar.tsx` (or wherever header is)
- All component files (add `dark:` Tailwind variants)

## Key Considerations

1. **Hydration Issues**: Use `suppressHydrationWarning` on `<html>` tag to prevent hydration mismatches
2. **System Preference**: Listen to `prefers-color-scheme` media query changes
3. **Performance**: Theme application should be immediate (no flash of wrong theme)
4. **Component Coverage**: Ensure all existing components have proper `dark:` variants in Tailwind classes
5. **Testing**: Test all three modes (light, dark, system) across all pages

## Testing Checklist
- [ ] Theme persists after page reload
- [ ] Theme syncs across tabs
- [ ] System preference mode works correctly
- [ ] All pages support both themes
- [ ] No flash of wrong theme on load

## Development Standards
- **Environment**: All secrets in `.env.local`
- **Components**: Extract reusable UI to `/frontend/components`
- **Types**: Full TypeScript coverage, no `any`
- **Functions**: Pure, small, early returns

## Stack
- **Frontend**: Next.js 14+ (App Router), Tailwind CSS
- **Backend**: Next.js API Routes (Edge Runtime)
- **Database**: Supabase (Postgres + pgvector + Storage)
