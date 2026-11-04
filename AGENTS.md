# Soft & Wet 4.x — current development instructions

This repository develops UI product version 4.x. Read [4.x documentation](docs/README.md), [HANDOFF](docs/HANDOFF.md) and the actual checkout before work. The owner's latest instructions take precedence.

## Product and ownership

- Black-gray Acrylic, compact default spacing, acrylic60 and default left alignment remain the accepted 4.1 baseline; see [4.x visual contract](docs/VISUAL_BASELINE_4X.md). Styles/effects must align across actual owned windows and reviewed compatibility portals, not settings alone. Preserve 44px primary hit areas, native controls/events, semantic colors and business ownership.
- Host provides public mechanisms; UI owns presentation; compatibility packages own target-specific semantics. Preserve voluntary registration, Binding cancellation, cleanup and native fallback. [Current Host/API contract](docs/HOST_4X.md) and [UI API](docs/UI_RUNTIME.md) describe actual 4.x consumers; protocol 0.1-experimental/API v1/package versions are independent of product major version.
- Do not change saves, transactions, wear, combat or third-party business state for visual experiments. Automatic evidence stays on the controlled whitelist; owner-authorized saves are isolated and excluded from public artifacts.

## Current scope

- 4.1.0 is released. 4.2 continues research only. Current Study 02/03 visual candidates were rejected on 2026-11-04; stop their adoption/rollout. Keep engineering evidence as historical experiments, distinguish Claude originals/adaptations/new design, and do not treat automated PASS as visual acceptance.
- Current owner task archives 1.x–3.x into a separate old repository and makes 4.x guidance self-contained. Do not treat historical archive documents, old AGENTS or historical release authorizations as current instructions. Do not reactivate old themes or remove live 4.x code merely because it originated before 4.0.
- No current authorization to merge main, publish a version, change Host public protocol, protective Rulesets, required checks or bypass. Keep the existing PR and final gate path. Archived historical authorizations do not transfer to this task.

## Engineering and verification

- Node26 only (>=26.12.1 <27), locked dependencies, TypeScript First; CTS/MTS tooling has generated ignored CJS/MJS outputs. Follow existing package and source identity contracts.
- Risk-proportional validation and actual previews; test native single actions, geometry, cancellation, recovery and resource ownership when affected. Preserve effective assertions, negative cases and failure evidence. Reuse evidence only when relevant inputs are unchanged. Mac, Actions, Windows and Android results are distinct.
- Batch full CI at meaningful integration/freeze boundaries. Do not add automatic per-commit runs for the research branch. Required validate/moody-gate and current catalog/producer/verifier/Expected Lock remain effective until a separately reviewed migration. See [CI](docs/CI.md).
- Current precise-selection/central-reporting work is research; no automatic gate migration. Unknown impact conservatively widens scope. Never treat a missing/not-run/cancelled/timed-out required check as PASS or retry until green.
- Keep current necessary files/licenses in packages. Historical archive metadata is not a runtime dependency. Public release requires final source/package identity and separate owner authority.

## Delivery

- Preserve unrelated work, use an isolated branch, no hard reset/clean/force push without explicit authorization. Codex commits use Codex and the verified bot noreply identity; preserve user Git configuration and repository visibility.
- Update HANDOFF Current/Decided/Next with actual branch/source, tests, unsynced work and blockers. Keep machine paths/raw private artifacts in ignored HANDOFF.local.md. New devices recheck Git, dependencies and actual environment.
