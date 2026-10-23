# Project Agent Rules — Protected

Applies to this entire repository. Follow `MODEL_POLICY.md` too.

## Non-negotiable safeguards
- NEVER delete, overwrite, rename, or auto-reformat `AGENTS.md` or `MODEL_POLICY.md`, or `.agents/skills/**`, without explicit owner approval.
- Do not delete other files, reset Git history, apply destructive migrations, expose secrets, or change production settings without approval.
- Inspect existing code, requirements and tests first. Preserve working behavior and established architecture.
- Change one scoped feature at a time; summarize changes, run relevant tests, and report failures honestly.
- Never assume a skill is installed: verify its `SKILL.md` exists before invoking it. Follow the skill's instructions only when relevant.

## Skill routing — only when useful
| Task | Skill or framework |
| --- | --- |
| New business scope, PRD, major architecture | BMAD Method |
| Implementation plan, TDD, debugging, code review | Superpowers |
| New pages, visual polish, dashboard UX | frontend-design |
| React/Next.js components, performance | react-best-practices |
| PostgreSQL schema, queries, indexes | supabase-postgres-best-practices (Postgres guidance only unless using Supabase) |

- Routine fixes, documentation, trivial UI changes: no heavy framework needed.
- Avoid running BMAD and Superpowers planning on the same task; BMAD defines *what and why*, Superpowers defines *how to implement and verify*.
- Before coding: identify scope, affected files, acceptance criteria and model recommendation.
- After coding: run typecheck/lint/tests as applicable; list any unverified behavior.
- For multi-tenant, inventory, payments and permissions: require explicit security and data-integrity review.

## Model policy
Read `MODEL_POLICY.md` before recommending model choice. Do not claim to have switched the model unless the app confirms it.
