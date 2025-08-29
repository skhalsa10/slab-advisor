---
allowed-tools: Task
description: Complete a comprehensive design review of uncommitted UI/UX changes
---

Review uncommitted front-end changes using the design-review-changes agent.

## Usage
```
/design-review-changes
```

This command will:
1. Analyze all uncommitted UI/UX changes in your repository
2. Test the changes in your local development environment
3. Validate design consistency, accessibility, and responsiveness
4. Provide a detailed report with issues categorized by severity

## What Gets Reviewed
- Modified UI components
- Updated stylesheets
- Changed user-facing features
- New visual elements
- Responsive behavior across viewports
- Accessibility compliance (WCAG 2.1 AA)
- Console errors and warnings

## Prerequisites
- Development server must be running (`npm run dev`)
- Uncommitted changes in your working directory
- Browser automation tools available

The agent will provide a comprehensive report with:
- ✅ What works well
- 🚨 Blockers (must fix before commit)
- ⚠️ High priority issues
- 💡 Suggested improvements
- 📝 Additional notes

---

# Execute Design Review

Use the Task tool to launch the design-review-changes agent to conduct a comprehensive review of uncommitted UI/UX changes.

<Task>
  <description>Design review of uncommitted changes</description>
  <subagent_type>design-review-changes</subagent_type>
  <prompt>
    Conduct a comprehensive design review of all uncommitted UI/UX changes in this repository.
    
    Follow your systematic review process:
    1. Check git status and diff to identify uncommitted changes
    2. Start the development server if not running
    3. Test the live experience at http://localhost:3000
    4. Validate visual quality, responsiveness, and accessibility
    5. Capture screenshots as evidence
    6. Check browser console for errors
    
    Focus specifically on uncommitted front-end modifications and provide a detailed report categorizing issues by severity (Blockers, High Priority, Improvements, Notes).
    
    Include your final recommendation on whether the changes are ready to commit.
  </prompt>
</Task>