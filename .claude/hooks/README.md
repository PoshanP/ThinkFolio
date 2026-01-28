# Hooks

Hook scripts referenced from `.claude/settings.json`.

## Overview

Hooks are configured in `settings.json`, not as separate files. This directory contains reusable scripts that hooks can reference.

## Hook Events

| Event | Trigger | Can Block |
|-------|---------|-----------|
| `PreToolUse` | Before tool execution | Yes (exit 2) |
| `PostToolUse` | After tool completion | No |
| `PermissionRequest` | Permission dialog shown | Yes |
| `UserPromptSubmit` | User submits prompt | No |
| `Notification` | Claude sends notification | No |
| `Stop` | Claude finishes responding | No |
| `SubagentStop` | Subagent task completes | No |
| `SessionStart` | Session begins | No |
| `SessionEnd` | Session ends | No |

## Configuration Format

In `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/validate-bash.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/format-code.sh"
          }
        ]
      }
    ]
  }
}
```

## Matcher Syntax

- `*` - Match all tools
- `Bash` - Match specific tool
- `Edit|Write` - Match multiple tools (pipe-separated)

## Input/Output

Hooks receive JSON via stdin:

```json
{
  "session_id": "...",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm run build",
    "description": "Build the project"
  }
}
```

PostToolUse also includes `tool_response`.

## Exit Codes

- `0` - Success, continue
- `2` - Block operation (PreToolUse only), stderr sent to Claude

## Example Scripts

### validate-bash.sh
```bash
#!/bin/bash
# Block dangerous commands
data=$(cat)
cmd=$(echo "$data" | jq -r '.tool_input.command')
if echo "$cmd" | grep -qE 'rm -rf|sudo|chmod 777'; then
  echo "Dangerous command blocked" >&2
  exit 2
fi
exit 0
```

### format-code.sh
```bash
#!/bin/bash
file_path=$(jq -r '.tool_input.file_path')
if [[ "$file_path" == *.ts || "$file_path" == *.tsx ]]; then
  npx prettier --write "$file_path" 2>/dev/null || true
fi
```

## Security

- Hooks run with your environment credentials
- Review all hook implementations before use
- Avoid hooks that could exfiltrate data
- Use `allowManagedHooksOnly: true` in enterprise settings
