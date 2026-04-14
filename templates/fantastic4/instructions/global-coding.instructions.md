---
description: 'Global coding standards and expectations applied to all generated code in the project.'
applyTo: '**/*.js, **/*.ts, **/*.py, **/*.cs, **/*.go, **/*.java'
name: 'Global Coding Standards'
---

# Global Coding Standards

These are the universal rules that all agents MUST follow when generating or modifying code in this workspace:

1. **Self-Documenting Code over Comments:** 
   - Write clear variable and function names.
   - Use comments only to explain *why*, not *what*.
2. **Modularity:** 
   - Keep functions small and focused on a single responsibility.
   - Extract logic into modular files where appropriate.
3. **No Stubbing:** 
   - Never output a function or method as a stub (e.g., `// TODO: Implement this`).
   - Implement the full logic or ask the user for required inputs before generating.
4. **Error Handling:** 
   - Ensure all public-facing methods validate inputs and safely surface errors.
   - Do not swallow exceptions silently.
5. **No Magic Strings/Numbers:** 
   - Extract raw constants into proper variables or enums.
