---
name: commit-push
description: Commit and push changes to remote with conventional commit messages
---

# Commit & Push

## Process

1. Check status: `git status` and `git diff`
2. Stage files (avoid .env, secrets, debug code)
3. Commit with conventional format
4. Push to remote

## Commit Format

```
<type>(<scope>): <subject>
```

**Types:** feat | fix | docs | style | refactor | perf | test | chore | ci

**Rules:**
- Imperative mood, lowercase, no period
- Max 50 chars subject
- Reference tickets when applicable

**Examples:**
```
feat(auth): add Google OAuth login
fix(api): handle null payment response
chore(deps): upgrade React to v18.2
```

## Commands

```bash
git add <files>
git commit -m "<message>"
git push origin <branch>
```

If remote has changes:
```bash
git pull --rebase origin <branch>
git push origin <branch>
```

## Safety Checks

Before committing, verify:
- [ ] No `.env` files staged
- [ ] No hardcoded secrets
- [ ] No debug `console.log` statements
- [ ] No commented-out code blocks
- [ ] Types pass (`npm run typecheck`)

## Important Rules

- **NEVER mention Claude, AI, or any AI assistant in commit messages, comments, or code**
- **NEVER add Co-Authored-By lines referencing Claude or Anthropic**
- Commit messages should appear as if written by the developer
- Keep all AI involvement invisible in the codebase
