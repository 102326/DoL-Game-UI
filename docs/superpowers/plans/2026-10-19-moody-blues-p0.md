# Moody Blues P0 execution plan

Approved scope: CJ-3A failure evidence, CJ-3B two historical regressions, and
CI-HANDOFF-01 on `ci/moody-blues-p0`, starting at 3.0.1
`9c162939dca50b11549b8a88aefa0069e4ea1896`.

1. Preserve both existing local research checkouts and their ignored artifacts.
   Fetch origin, fast-forward the local main reference, and use a new worktree.
   Run the unchanged CI commands on macOS; record actual local outcomes separately
   from the existing Ubuntu Actions run and Windows/Android acceptance.
2. Extend `scripts/test-ci.cjs`, using Node built-ins, without changing existing
   command order or package contracts. Persist per-check and per-stage status,
   raw outcome, duration, exit/signal, scope, source identity and evidence paths.
   Checkpoint incomplete work, retain fail-fast behavior, and produce an always-run
   whole-job summary that rejects missing, stale or incomplete required evidence.
3. Add bounded, allowlisted settings/combat fixture failure snapshots. Upload only
   the current run's controlled evidence, with size limits and seven-day retention.
   Never upload full game HTML, saves, credentials or unrelated test artifacts.
4. Strengthen existing browser contracts and add controlled historical mutations:
   delayed/aborted settings transitions versus actual leftover nodes; effective
   OrbitFocus positioning surface, finite geometry, shared production CSS and
   overflow. A counterexample counts only when the intended assertion rejects it,
   not when compilation or browser setup fails.
5. Add `docs/HANDOFF.md` (Current / Decided / Next), a lightweight update rule and
   ignored local supplement. Keep machine paths and local raw logs out of Git.
6. Verify runner failure/timeout/cancellation/missing-result behavior, the two
   historical negatives and the full existing CI contract. Inspect the final diff,
   commit and push only the development branch, then explicitly dispatch the
   existing workflow on that branch and inspect its actual result and artifacts.
   Update the handoff with the verified source commit and Actions link.

No main merge, ruleset/bypass change, release/tag/ZIP rewrite, automatic CD,
external AI service or unrelated production UI refactor is authorized.
Hard runner termination can prevent final uploads; checkpointed evidence and
GitHub's raw job outcome must never be represented as a successful verification.
CJ-3C and CJ-4 remain follow-up work; policy changes need explicit owner approval.
