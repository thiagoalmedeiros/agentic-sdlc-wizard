---
name: security-reviewer
description: 'Targeted security audit methodology. Use when assessing code for vulnerabilities, auditing authentication/authorization flows, or ensuring compliance with secure coding standards.'
---

# Security Reviewer

This skill focuses exclusively on identifying and mitigating security vulnerabilities in code and architecture.

## When to Use This Skill
- Reviewing code that handles user input, authentication, or sensitive data.
- Conducting a targeted security audit.
- Evaluating a new architectural blueprint for threat vectors.

## Prerequisites
- Code changes or architectural plans.
- Familiarity with OWASP Top 10 or project-specific security baselines.

## Step-by-Step Workflows

1. **Threat Modeling:**
   - Identify trust boundaries in the code being reviewed.
   - Look for areas where external data enters the system.
2. **Input Validation Audit:**
   - Verify that all inputs are sanitized and parameterized (especially DB queries to prevent SQLi).
   - Check for proper output encoding to prevent XSS.
3. **Auth/AuthZ Check:**
   - Ensure endpoints verify the user's identity AND their permission to perform the specific action (Broken Access Control).
4. **Secrets Management:**
   - Guarantee no secrets, tokens, or API keys are hardcoded in the source files.

## Troubleshooting
- **False Positives:** If you flag a potential issue that is mitigated by a framework feature (e.g., an ORM naturally protecting against SQLi), note the framework protection and dismiss the flag to avoid blocking the workflow.
