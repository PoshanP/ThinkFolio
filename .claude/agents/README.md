# Agents

Custom subagent definitions for specialized autonomous tasks.

## Format

Agents are markdown files with frontmatter defining the agent's persona and capabilities:

```markdown
---
name: architect
description: Designs system architecture and technical solutions
model: opus
---

You are a senior software architect. Your role is to:
- Analyze requirements and propose solutions
- Design scalable system architectures
- Identify potential technical risks
- Document architectural decisions

## Guidelines
...
```

## Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Agent identifier |
| `description` | Yes | Brief purpose description |
| `model` | No | Model preference (sonnet, opus, haiku) |

## Example Agents

### Code Reviewer
```markdown
---
name: code-reviewer
description: Reviews code for quality, security, and patterns
---

You are a senior code reviewer...
```

### Test Generator
```markdown
---
name: test-generator
description: Generates comprehensive test suites
---

You are a test automation specialist...
```

## Usage

Agents are invoked via the Task tool or `/agents` command. Claude Code spawns subagents to delegate specific work while the main agent continues.

## Best Practices

- Keep agent scope narrow and focused
- Include clear guidelines in the system prompt
- Specify output format expectations
- Use appropriate model for complexity (haiku for simple, opus for complex)
