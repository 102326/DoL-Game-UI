# Moody Blues independent CI audit response

2026-10-23. Input: 小鸥 independent audit V1.0; independently fetched source
`34f4217e8e3278b44623bf20e9df692a771f6f90`. The two baseline runs remain valid:
[research push](https://github.com/102326/DoL-Game-UI/actions/runs/39835533046)
and [standard workflow_dispatch](https://github.com/102326/DoL-Game-UI/actions/runs/39835580399).
GitHub metadata confirms success, 8m36s and 6m35s respectively. These were not PR runs.

## 1. Findings and acceptance

| Audit | Classification / reproduction / effect | Minimal repair and acceptance |
| --- | --- | --- |
| E2 | Confirmed defect: individually bounded successful stage records create an oversize summary; original summarize returns PASS while prepareUpload omits summary.json. | Final delivery validates required files, identity/schema and SHA-256 against the actual copied bytes and source files; separate delivery.json controls exit status. Missing, oversize, unsafe or corrupt required evidence cannot PASS. Optional bounded logs/screenshots may be absent/truncated. |
| E1 / N1 | Confirmed evidence contract gap: serial exit 0 plus at least one uploaded glob did not validate every required report, case set or run identity. Historical capture had no MOODY context. | Research profile reuses runCommand, identity, status, finalizeUpload and index. Each required command is recorded; fresh reports are validated against explicit case plans and copied with hash into this run. Raw baseline/revision is preserved separately from actual source/run/attempt. Historical MOODY_ORBIT_NONFINITE snapshot is required. |
| V1 | Outdated identity expectation: legacy JS sets Core 2.7.0, official wrapper sets UI 3.0.4; original portable test fails 2.7.0 != 3.0.4. | Assert Core 2.7.0 only for the real legacy bundle. Existing framework-startup/official-defaults and independent package mutation tests assert official wrapper/metadata, Host and protocol separately. No product/source version edits. |
| V1 follow-up | Previously blocked old assertion expected one peer adapter; current ModHub owns management/tools/modal (three). | After MapleBirch disposal assert exact surviving ModHub IDs and no MapleBirch DOM marks. All earlier lifecycle/input/privacy checks remain. |
| V2 | Confirmed stale public command: package.py rejects Core 2.7.0 vs root 3.0.4 before packaging. | npm package builds and invokes the existing paired Host/UI producer; historical monolith is explicitly package-legacy.py. Real paired shop ZIP retains four ordered exact patches, early default-off behavior and public declarations. Quick/unit checks early API independently; formal package contracts retain ZIP/patch checks. |
| C1 | Coverage governance gap, with substantial existing overlap. | Inspector, Surface and compatibility restart sequence now have separate standard browser entries. Historical matrix is explicitly labeled; not all legacy tests become required. |
| G1 | Trigger policy was a design choice, not a broken baseline run. | Standard and research workflows now run on actual PRs to dev/evolution-4.0 and main. Repair branch pushes run both. Existing job/check names and protection/bypass configuration stay unchanged. |
| P1 | Improvement / measurement: baseline standard/research are below 15/20m; deep has less nested budget margin. | Retain job, stage and test budgets. Distinguish raw spawn/exit/timeout/cancel and dependency/browser-install stages. Record durations in per-command reports; a normal run does not prove cold-cache/deep headroom. |

## 2. Coverage inventory

| Class | Current entry and role |
| --- | --- |
| Required standard | ci-evidence.cjs suites: business/source tests, early API behavior, evidence negative tests; existing browser matrix plus three independently reported ui-runtime groups and five precise runtime mutation controls. Eight-package/Host/protocol/repeated-build contracts stay required. |
| Required research | ci-research.cjs exact plan and research-cases.json: all commands previously in the research workflow, including settings study, Golden Spin/Hub input/lifecycle, Evolution consumers and weather studies. Build/type/Node-test commands explicitly report command completion; browser reports validate exact named case sets or their typed structural cases. No command-only record substitutes for an expected result.json. |
| Specialized | Historical test-workflow quick/layout/release/performance matrix and original game/0.5.11.9 resources; local opt-in original-speed recording, deep device scans and controlled baseline modes. Plan output labels the historical matrix. These are not current whole-product acceptance. |
| Historical | package-legacy.py monolith and frozen baseline source revisions. Baselines remain usable for counterexamples; they are never the current source identity. |
| Pending migration | Historical real-game matrix and other legacy groups need individual contract comparisons if promoted later. Current migrated Inspector/Surface/compat sequence is complete; no claim that every repository test is now current or standard. |

Inspector retains clipboard denial, immutable/redacted diagnostics, export and 32-event
limit, stable rescan and native state preservation. Surface retains stacking/focus/Esc,
kind collision, detach, backdrop drag, native submit, unavailable/throwing showModal,
throwing onClose and idempotent destroy. Compatibility retains optional-first, missing
and unsupported Core, actual Core arrival, master toggles, structure drift, destroy /
reinjection and independent rebinding. Windows uses Edge; other platforms use pinned
Chromium through browser-options.cjs.

## 3. Evidence and retention

Standard: required identity, stages, unit/browser, layout coverage, package report and
summary, 256 KiB per structured report / 16 MiB total, 7 days. Research: required run
envelope and raw result reports, 2 MiB per raw report; allowlisted review images up to
8 MiB each and JS/CSS/HTML/SVG/license comparison builds up to 8 MiB each, 160 MiB
total, 14 days. This keeps the roughly 112 MiB historical comparison tier possible.
Optional diagnostics are indexed and omissions are explicit; necessary structured
proof cannot be dropped. Only files under controlled first-party artifact roots and
explicit extensions are copied. Player saves, arbitrary HTML/game files and symlinks
are excluded. The index hashes every delivered file (except itself); delivery.json
records the final verdict and is itself indexed. Hard runner termination can still
prevent upload: missing delivery is unverified, never success.

## 4. Validation record and final submission

Local macOS arm64, Node 24.18.0, npm 11.16.0, lockfile Playwright Chromium 153,
Python 3 via local command shim. Original failures are preserved in local evidence:
Core/product version assertion, old package.py assertion, E2 omitted summary and
outdated adapter count. Browser sandbox startup and a concurrent dist rebuild were
setup failures, never valid product negatives; isolated own-bundle compilation
removes the latter coupling.

- npm ci; npm run build; npm run package; npm test.
- node tests/shop-pagination-package.test.cjs; node tests/shop-early-api.test.cjs.
- node tests/ci-evidence.test.cjs; node tests/research-evidence.test.cjs;
  node tests/test-workflow.test.cjs; Ruby gate/collaboration checks.
- ui-runtime Inspector and Surface passed before the newly exposed count failure;
  corrected complete compatibility group passed. Five precise mutation controls
  require AssertionError and the target message, rejecting syntax/compile/dependency
  errors as invalid negatives.
- Exact final commit, PR head/merge SHA, actual trigger, attempts, run URLs, timings,
  cold/deep scope and delivery-index checks are recorded with the final CI delivery.
  Never reuse this baseline's manual green to certify a later PR.

## 5. Scope limits

No main merge, release/CD, ruleset/protection/bypass, public UI/Host version,
external AI or UI/Evolution feature changes. No player save was read or uploaded.
CI success is controlled source/fixture proof; G1/G2/G3, physical devices,
real DoL/ModLoader/multi-Mod and owner visual acceptance remain separate.
