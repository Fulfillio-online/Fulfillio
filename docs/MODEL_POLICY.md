# Model Usage Policy — Protected

Goal: conserve premium model quota without compromising correctness.

## Routing guidance
| Work | Preferred model |
| --- | --- |
| Simple explanations, docs, formatting, file lookup, routine edits | Gemini 3.8 Flash (Fast/Medium) |
| Ordinary UI/components, small API endpoints, simple tests | Gemini 3.8 Flash (Medium), escalate only if needed |
| New system architecture, complex multi-file refactor, hard debugging | Gemini 4 Argon (High) |
| Security-sensitive flows, payment/inventory consistency, tenancy isolation | Gemini 4 Argon (High) plus human review and tests |

## Escalation rules
1. Start with Flash for routine tasks. Do not use Argon merely to summarize, search files, rename variables or write simple code.
2. Recommend Argon only if task complexity warrants it or Flash fails after a focused retry.
3. Before escalation, state the reason and request the owner to select Argon in Antigravity's model selector.
4. Model selection is controlled by Antigravity UI/session, not by this file; never claim automatic switching.
5. After completing the complex task, recommend returning to Flash for routine follow-up work.
6. Do not edit or delete this policy or `AGENTS.md` without explicit owner approval.
