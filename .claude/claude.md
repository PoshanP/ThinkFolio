# Claude Code Configuration

Project-specific Claude Code customizations for ThinkFolio - AI-Powered Document Intelligence.

## Directory Structure

```
.claude/
├── settings.json       # Permissions, hooks, environment
├── settings.local.json # Personal overrides (gitignored)
├── claude.md           # This file
├── skills/             # Skill definitions (slash commands)
├── agents/             # Custom subagent definitions
├── hooks/              # Hook scripts (referenced from settings.json)
└── commands/           # Custom slash commands

.mcp.json               # MCP server configurations (project root)
CLAUDE.md               # Project memory/context
```

## Configuration Precedence

1. **Managed** (highest) - System-wide IT policies
2. **Local** (`.claude/*.local.*`) - Personal, gitignored
3. **Project** (`.claude/`) - Team-shared, committed
4. **User** (lowest) - `~/.claude/`

## Available Skills

| Skill | Command | Description |
|-------|---------|-------------|
| commit-push | `/commit-push` | Commit with conventional commits and push |
| pr-review | `/pr-review` | CTO-level code review |

## Hooks

Hooks are configured in `settings.json` and run automatically:

- **PreToolUse**: Blocks edits to `.env`, `package-lock.json`, `.git/`
- **PostToolUse**: Auto-formats TypeScript files with Prettier

## MCP Servers

Configured in `.mcp.json` at project root:

- **supabase**: Database and storage operations
- **github**: Repository and PR management
- **memory**: Persistent memory across sessions

## Adding New Components

### New Skill
Create `.claude/skills/<name>/SKILL.md` with frontmatter and instructions.

### New Command
Create `.claude/commands/<name>.md` with slash command definition.

### New Agent
Create `.claude/agents/<name>.md` with agent system prompt.

### New Hook
Add to `hooks` section in `.claude/settings.json`.
