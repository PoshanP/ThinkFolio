---
name: pr-review
description: "Senior CTO-level pull request code review with 20+ years engineering experience. Use when reviewing PRs, diffs, code changes, merge requests, or when user asks to review updated/changed code. Focuses on: magic values, hardcoded strings, project pattern consistency, code structure alignment, naming conventions, architectural decisions, security implications, performance concerns, and maintainability."
---

# PR Review - CTO-Level Code Review

Review code changes with the rigor of a Fortune 500 CTO with 20+ years of engineering experience.

## Review Process

### Step 1: Establish Project Context

Before reviewing changes, understand the codebase:

```bash
# Identify project patterns
find . -name "*.md" -o -name "*.json" -o -name "*.yaml" | head -20
cat package.json pyproject.toml Cargo.toml go.mod 2>/dev/null | head -50
ls -la src/ lib/ app/ 2>/dev/null
```

Note existing patterns for: naming conventions, file structure, error handling, logging, testing approach.

### Step 2: Analyze Only Changed Code

Focus exclusively on modified lines. Do not review unchanged code unless it directly impacts the change.

### Step 3: Review Checklist

Apply each category to the diff:

#### Magic Values & Hardcoded Strings
- Numbers without context → Extract to named constants
- Hardcoded URLs, paths, credentials → Move to config/env
- Repeated string literals → Define once, reference everywhere
- Timeout/retry values → Make configurable

```
❌ if (retries > 3)
✅ if (retries > MAX_RETRY_ATTEMPTS)

❌ fetch('https://api.prod.company.com/v1')
✅ fetch(config.apiBaseUrl)
```

#### Project Pattern Consistency
- Match existing naming: camelCase vs snake_case vs PascalCase
- Follow established directory structure
- Use same error handling patterns as existing code
- Match logging format and levels
- Follow existing import ordering

#### Code Structure Alignment
- Functions in appropriate modules/files
- Consistent abstraction levels within functions
- Similar operations grouped together
- Match existing class/component organization

#### Naming Conventions
- Variables describe content, not type (`users` not `userArray`)
- Functions describe action (`fetchUserData` not `getData`)
- Booleans read as questions (`isValid`, `hasPermission`)
- Constants are SCREAMING_SNAKE_CASE
- Match project's existing naming patterns exactly

#### Security Concerns
- No secrets in code
- Input validation present
- SQL injection prevention
- XSS prevention in frontend
- Proper authentication checks
- Sensitive data not logged

#### Performance Red Flags
- N+1 queries
- Unbounded loops/recursion
- Missing pagination
- Large objects in memory
- Blocking operations in async context
- Missing indexes for new queries

#### Maintainability
- Complex logic has comments explaining *why*
- No dead code introduced
- No TODO without ticket reference
- Functions under 50 lines preferred
- Cyclomatic complexity reasonable

#### Error Handling
- Errors caught at appropriate level
- Meaningful error messages
- No swallowed exceptions
- Consistent with project's error patterns

#### Testing Implications
- Breaking changes to public APIs
- New code paths need tests
- Edge cases considered

## Output Format

Structure review as:

```
## Summary
[One-line assessment: Approve / Request Changes / Needs Discussion]

## Critical Issues
[Must fix before merge - security, bugs, data loss risks]

## Required Changes
[Pattern violations, magic values, naming issues]

## Suggestions
[Improvements that would enhance but aren't blocking]

## Questions
[Clarifications needed to complete review]
```

## Review Principles

1. **Be specific** - Point to exact lines, show correct code
2. **Explain why** - Connect feedback to maintainability/scalability
3. **Prioritize** - Critical > Required > Suggestions
4. **Stay focused** - Review only the diff, not the entire codebase
5. **Be constructive** - Every critique includes the fix
6. **Match the project** - Recommendations align with existing patterns, not personal preference
