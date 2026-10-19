# Moody Blues P0 evidence contract

Moody Blues extends `scripts/test-ci.cjs`; it does not introduce a Judge service.
The existing check order, ZIP contract, workflow triggers, read-only
permissions, 15-minute job timeout and seven-day artifact retention remain intact.
Use `gh workflow run build.yml --ref ci/moody-blues-p0` for this development branch;
its push alone does not match the existing trigger.

The owner's CJ-3D extension adds a focused device layout entry to the end of the
browser suite and a device-catalog unit check. Existing tests remain. Manual
`device_depth` selects `standard` (default, also PR/push) or `deep`; it does not
rerun every business test for every device. See [device profiles](DEVICE_PROFILES.md)
and the [CJ-3D plan](superpowers/plans/2026-10-19-moody-blues-cj3d.md).

## Reading a result

`PASS` requires an executed check with exit 0. `FAIL` records a failing exit,
signal, spawn error or timeout. `BLOCKED` means a required check was not run
because an earlier check failed or the workflow skipped it. `UNVERIFIED` means
evidence is absent, stale or incomplete. `PARTIAL` records interrupted or mixed
verified/unverified work. `rawStatus` retains `timeout`, `cancelled`, `signal`,
`not-run`, `running`, `passed` or `failed`; these are not silently converted to PASS.

The runner checkpoints before each child and after completion. Every suite has
the complete expected list, per-check duration, exit/signal, scope, log path and
available fixture evidence. Reports bind to HEAD/tree, a SHA-256 of non-ignored
source contents (including untracked work), lockfile, actual runtime versions,
platform and Actions run/attempt. No source contents or environment dump are stored.
Changing source during a run invalidates the matching evidence.

Workflow stages wrap the existing commands and persist their own exit results.
The `always()` summary also consumes GitHub action outcomes, so setup/install
failure and skipped stages remain visible. A green unit/browser stage requires
the matching complete per-check report. Missing files cannot make a stage green.
Device coverage also requires a source/run/depth-matched `layout-report.json`
containing every expected profile/scan/rotation/negative case exactly once and
passing. Child exit 0 without that evidence remains UNVERIFIED.
The summary exits nonzero unless all required stages are verified. Hard job/runner
termination can prevent final summary or upload: absent evidence is unverified.
The later evidence upload's actual outcome must also be checked in the job.

## Evidence locations and limits

Each run uses `tests/artifacts/ci/<run>-<attempt>-validate/` (ignored in Git).
Download `kraft-work-checks-<SHA>` from the Actions run:

- `summary.json`, `identity.json`, `stage-*.json`, `unit.json`, `browser.json`;
- bounded stage/per-check logs (last 64 KiB, original byte count and output digest);
- optional `fixtures/<allowlisted-check>/snapshot.json` and `viewport.jpg`;
- required `fixtures/device-layouts.cjs/layout-report.json` for device coverage;
- `upload-index.json`: actual relative files, SHA-256 hashes and size omissions.

Only the known stage/check files and allowlisted controlled fixture snapshots are copied
into the upload directory. Symlinks/outside paths are rejected; unknown files,
full HTML, saves and broad `tests/artifacts` trees are not collected. JSON is
limited to 256 KiB per report, fixture payload to 64 KiB, viewport JPEG to 512 KiB,
and selected files to 16 MiB total. The device layout report has a separate
256 KiB cap; incomplete or over-limit coverage cannot be silently dropped into
PASS. Capture failure never masks the original assertion. Pixels use CSS scale,
limited to a <=2048x1536 clip within the controlled viewport; wide/tall viewports
record the clip and cropping, focused on the supplied failed-control rectangle.
There is no full-page capture. Artifacts expire after seven days. Development build ZIP upload remains
separate and is not a Release or CD.

For a local run, set a fresh `MOODY_EVIDENCE_ID` once for the stages. Existing
`npm run ci:unit` and `ci:browser` still work independently with a new local ID.
Run `node scripts/test-ci.cjs stage <id>` for dependencies/check/unit/build/packages/
browser-install/browser. Local `summary` has UNVERIFIED action setup unless real
action outcomes are supplied; never invent GitHub outcomes for a local run.
For manual deep coverage use `gh workflow run build.yml --ref ci/moody-blues-p0
-f device_depth=deep`. Local `MOODY_DEVICE_DEPTH=deep npm run ci:browser` selects
the same case plan (with the existing business suite once). Source identity also
records the selected depth. Device checks have a six-minute standard / ten-minute
deep child limit; other existing checks retain their two-minute limit. The job
still has its original fifteen-minute limit.

## Historical counterexamples

`tests/moody-historical-regressions.cjs` uses actual production components and
controlled fixtures; expected rejection is distinct from a suite failure.

- [CI #78](https://github.com/102326/DoL-Game-UI/actions/runs/39161341795): slow real
  WAAPI playback crosses the old 700ms sample, reproducing inert-count 1 versus 0.
  Condition-based completion accepts the same legal transition. Actual rapid
  switches exercise cancellation and final state; an injected residual section
  must fail the shared lifecycle oracle.
- [CI #79](https://github.com/102326/DoL-Game-UI/actions/runs/39161721706): the healthy
  positioning surface with production shared CSS passes. An isolated Vite transform
  restores the pre-`e23f631` placement calculation and must fail the finite geometry
  oracle. Omitting the production OrbitFocus CSS must fail the position oracle.
  Original native identity/input/cleanup and horizontal overflow assertions remain.

Compiler/browser setup errors do not count as successful negative tests. Exact
assertion codes are required. The original production sources are never mutated.
There is no asserted third product defect.

## Deferred scope

CJ-3C: UI and independent Host version sources, optional compatibility package
manifest/ZIP contracts, further negatives and deterministic build evidence.
CJ-4 proposal only: require the stable `validate` job on the final PR head, block
missing/skipped required checks, explicitly audit bypass and retain CI/CD isolation.
Check names, ruleset applicability and bypass membership need owner review before
any remote policy changes. No ruleset changes or main merge occur in P0.
Windows, real DoL/ModLoader and Android require separate evidence.
