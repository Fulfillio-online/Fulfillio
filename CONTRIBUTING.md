# Contributing to Fulfillio

Welcome to the Fulfillio Engineering Team! We are thrilled to have you contribute to our 3PL Warehouse Management & Fulfillment platform.

To maintain code quality, architecture consistency, and prevent regressions, all engineers must follow the standards outlined in this guide and in [`GEMINI.md`](./GEMINI.md).

---

## 🧭 Core Principles

1. **Pragmatic Modular Monolith:** We keep all domains within a single deployable backend (`apps/api`) and a single frontend (`apps/web`). Never introduce microservices without architectural review.
2. **Strict Multi-Tenant Isolation:** Every merchant-owned database table must include `merchantId String` with a composite index: `@@index([merchantId, ...])`.
3. **Atomic Stock Changes:** Any operation that reserves, fulfills, or cancels order inventory must run inside a Prisma interactive transaction using `SELECT ... FOR UPDATE` row locks.
4. **Reseller Brand Protection:** The 3PL identity must never leak onto merchant customer documents. Memo slips must strictly render using the merchant's custom template engine (`memo_code`).

---

## 🌿 Git Branching & Workflow

### 1. Branch Naming
All branches must be branched off `main` and follow this naming format:
- `feat/<module>-<description>` (e.g. `feat/memo-preview-rotation`)
- `fix/<module>-<description>` (e.g. `fix/sku-generator-special-chars`)
- `refactor/<module>-<description>`
- `docs/<description>`

### 2. Commit Message Standards
We follow [Conventional Commits](https://www.conventionalcommits.org/):
```
<type>(<scope>): <subject>

[optional body]
[optional footer]
```
Examples:
- `feat(inventory): add low stock alert threshold per shelf bin`
- `fix(orders): prevent double reservation during fast checkout`
- `docs(readme): add docker-compose setup steps`

---

## 💻 Local Development Workflow

### Adding a New Backend Feature:
1. **Schema First:** If adding a new table or column, edit `apps/api/prisma/schema.prisma`.
   - Run `pnpm --filter=@fulfillio/api exec prisma generate`
   - Run `pnpm --filter=@fulfillio/api exec prisma migrate dev --name <migration_name>`
2. **Domain Directory:** Place code directly into `apps/api/src/modules/<module-name>/`:
   - `controller.ts` (Handles routing, `@CurrentUser()` decorator, and Guards).
   - `service.ts` (Encapsulates business rules and transactions).
   - `repository.ts` (Executes database queries via Prisma).
3. **Register Module:** Register the module in `apps/api/src/app.module.ts`.

### Adding a New Frontend Feature:
1. **Routing:** Place routes under `apps/web/src/app/<route-name>/page.tsx`.
2. **Reusable UI:** Place reusable primitives in `apps/web/src/components/ui/` (`Button`, `Card`, `Badge`, `Input`).
3. **Anti-Breakage Rule:**
   > **CRITICAL:** Do NOT run `next dev` and `next build` concurrently in the same directory! It corrupts the Next.js chunk manifest and breaks CSS delivery. Always shut down dev servers before running a production build.

---

## 🧪 Testing & Code Quality

Before creating a Pull Request, run the following checks locally:
```bash
# Typecheck contracts
pnpm --filter=@fulfillio/contracts build

# Lint the codebase
pnpm lint

# Format code
pnpm format
```

---

## 🚀 Pull Request Checklist

When submitting a PR:
- [ ] PR title follows Conventional Commits format.
- [ ] Relevant module documentation in `mvp-goals-and-progress/` or `docs/` is updated if behavior changed.
- [ ] No hardcoded secrets, API keys, or tokens in code.
- [ ] Tested locally on both desktop and mobile viewports (especially worker handheld screens).
- [ ] PR description includes what was changed and how to test it.

---

Thank you for building the future of 3PL fulfillment with Fulfillio!
