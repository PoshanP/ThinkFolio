---
name: commit-push
description: "Commit and push changes to remote with conventional commit messages."
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
