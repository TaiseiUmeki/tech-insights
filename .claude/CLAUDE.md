# Project Guidelines

## Development Environment

### Python / Backend Commands

- All Python commands MUST be run inside Docker (the containers are already running)
- Use `docker compose exec` to execute commands
  - Example: `docker compose exec backend python manage.py ...`

### Database Access

- When you need to inspect the database, read connection info from `.env` and use `docker compose exec`
  - Example: `docker compose exec db psql -U $POSTGRES_USER -d $POSTGRES_DB`

## Git Conventions

- Commit messages MUST start with a conventional prefix: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `ci:`, `style:`, `perf:`
- Keep messages in simple English (e.g., `fix: search bar enter behavior`, `refactor: merge activity_type usecases`)
- Do NOT include `Co-Authored-By` or other trailers

## Plan Mode Guidelines

When presenting a plan, self-evaluate the engineering level from the following perspectives:

- **Under engineering**: Are necessary validations, error handling, or security measures missing?
- **Over engineering**: Are there unnecessary abstractions, premature accommodations for hypothetical future requirements, or excessive use of design patterns?

State the evaluation result and its rationale concisely in the plan.

- If implementation hits unexpected issues, STOP and re-plan immediately instead of pushing forward

## Code Simplifier Agent

- After completing any large-scale implementation (new features, major refactors, multi-file changes), ALWAYS run the `code-simplifier:code-simplifier` agent to review and simplify the recently modified code
- The `subagent_type` MUST be `code-simplifier:code-simplifier` (NOT `code-simplifier`)

## Verification Before Done

- Always verify correctness before marking a task complete (run tests, check logs, review diffs)
- Ask yourself: "Would a staff engineer approve this?"

## Recurring Correction Detection

If the user makes repeated or similar correction requests within a single session, ask the user:
"Would you like me to add this as a guideline to CLAUDE.md so it applies to future sessions as well?"

- When corrected, record the pattern in auto memory to prevent repeating the same mistake
