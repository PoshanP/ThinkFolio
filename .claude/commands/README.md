# Commands

Custom slash commands invoked with `/<command-name>`.

## Format

Commands are markdown files with frontmatter:

```markdown
---
name: deploy
description: Deploy to Vercel production
---

Deploy the application to Vercel production environment.

## Steps

1. Run type checking
2. Run linting
3. Build the application
4. Deploy to Vercel

## Commands

```bash
npm run typecheck
npm run lint
npm run build
vercel --prod
```
```

## Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Command name (invoked as `/<name>`) |
| `description` | Yes | Brief description shown in help |

## Locations

- **Project**: `.claude/commands/` - This project only
- **User**: `~/.claude/commands/` - All projects

## Example Commands

### /deploy
```markdown
---
name: deploy
description: Deploy to production
---

Deploy the application following the standard process...
```

### /test
```markdown
---
name: test
description: Run full test suite
---

Run all tests with coverage reporting...
```

### /db-migrate
```markdown
---
name: db-migrate
description: Run database migrations
---

Apply pending Supabase migrations...
```

## Usage

```
/deploy          # Run deploy command
/test            # Run test command
/help            # List available commands
```

## Best Practices

- Keep commands focused on single workflows
- Include all necessary context in the command file
- Document any prerequisites
- Reference project-specific paths and tools
