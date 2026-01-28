# MCP Servers

MCP server configurations are defined in `.mcp.json` at the project root, not in this directory.

## Configuration Location

**Project-level**: `.mcp.json` (committed, team-shared)
**User-level**: `~/.claude.json` or via `claude mcp add`

## Format

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@namespace/mcp-server"],
      "env": {
        "API_KEY": "${ENV_VAR_NAME}"
      }
    }
  }
}
```

## Transport Types

### Stdio (most common)
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

### HTTP
```json
{
  "mcpServers": {
    "vercel": {
      "type": "http",
      "url": "https://mcp.vercel.com/api"
    }
  }
}
```

### SSE
```json
{
  "mcpServers": {
    "custom": {
      "type": "sse",
      "url": "https://example.com/mcp/sse"
    }
  }
}
```

## CLI Commands

```bash
# Add server
claude mcp add github --transport stdio -- npx -y @modelcontextprotocol/server-github

# List servers
claude mcp list

# Remove server
claude mcp remove github

# Test server
claude mcp get github
```

## Tool Naming

MCP tools follow: `mcp__<server-name>__<tool-name>`

Example: `mcp__github__list_issues`

## Recommended Servers

| Server | Package | Purpose |
|--------|---------|---------|
| GitHub | `@modelcontextprotocol/server-github` | PR, issues, repos |
| Supabase | `@supabase/mcp-server` | Database, storage |
| Memory | `@modelcontextprotocol/server-memory` | Persistent memory |
| Filesystem | `@modelcontextprotocol/server-filesystem` | File operations |

## Best Practices

- Keep active MCPs under 10 per project
- Keep total tools under 80
- Use environment variables for secrets (`${VAR_NAME}` syntax)
- Enable/disable via `@mention` or `/mcp` command
