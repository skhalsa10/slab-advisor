---
allowed-tools: Bash, Grep, Read
description: Stage and commit current changes with a well-formed commit message
---

Stage and commit all current changes to git with a properly formatted commit message.

## Usage
```
/commit
```

This command will:
1. Show current uncommitted changes (git status and diff)
2. Analyze the changes to understand what was modified
3. Generate an appropriate commit message following conventional commit format
4. Stage all changes and create the commit
5. Verify the commit was successful

## Commit Message Format
The command follows conventional commit format:
- `feat:` New features
- `fix:` Bug fixes  
- `refactor:` Code refactoring
- `style:` Formatting changes
- `docs:` Documentation updates
- `test:` Test additions/changes
- `chore:` Maintenance tasks

## What Gets Committed
- All modified files
- All new untracked files (after review)
- Deleted files

## Prerequisites
- Git repository initialized
- Changes in working directory
- No merge conflicts

---

# Execute Git Commit

Analyze changes and create a commit with proper message formatting.

First, check the current status and changes:

<Bash>
<command>git status</command>
<description>Check uncommitted files</description>
</Bash>

<Bash>
<command>git diff</command>
<description>Review unstaged changes</description>
</Bash>

<Bash>
<command>git log --oneline -5</command>
<description>Check recent commit style</description>
</Bash>

Then analyze the changes and determine:
1. The type of change (feat/fix/refactor/etc)
2. The scope of change (component/module affected)
3. A concise description of what changed and why

Stage and commit the changes:

<Bash>
<command>git add -A</command>
<description>Stage all changes</description>
</Bash>

<Bash>
<command>git commit -m "$(cat <<'EOF'
[Appropriate commit message based on changes]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"</command>
<description>Create commit with message</description>
</Bash>

<Bash>
<command>git status</command>
<description>Verify commit success</description>
</Bash>