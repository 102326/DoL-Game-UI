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

The mutation controls exposed two ineffective old checks: serialized JSON escapes
quotes, so privacy now checks the unredacted `data-proof=` marker; a full 32-event
buffer can hide replacement events behind an unchanged length, so stable rescan
also compares the complete event sequence. Both checks retain their original intent.

## 3. Evidence and retention

Standard: required identity, stages, unit/browser, layout coverage, package report and
summary, 256 KiB per structured report / 16 MiB total, 7 days. Research: required run
envelope and raw result reports, 2 MiB per raw report; allowlisted review images up to
8 MiB each and allowlisted comparison builds (JS/CSS/HTML/SVG/licenses plus their
first-party JSON/images/original-speed video/fonts) up to 8 MiB each, 160 MiB
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
- First research push [39892539509](https://github.com/102326/DoL-Game-UI/actions/runs/39892539509)
  at b30cac9 rejected the existing Hub input report because the new validator
  incorrectly required optional prose metadata. The repair keeps mandatory checks,
  errors, source identity and hash; a regression covers the actual prose-free
  Hub schema. Subsequent blocked checks in that run are not counted as passing.
- The first local research trial was deliberately cancelled (143/PARTIAL) to fix
  a reviewer-proven directory symlink escape before upload. Source and ancestor
  symlinks are now rejected before copying; both precise escape controls pass.
- Research push [39892784339](https://github.com/102326/DoL-Game-UI/actions/runs/39892784339)
  at e403e11 passed the first 15 commands but the validator expected the target
  name in AssertionError.code. The actual snapshot has code ERR_ASSERTION and
  the exact MOODY_ORBIT_NONFINITE message prefix; both are now checked. The
  downloaded real snapshot has matching source/run identity and verifies the fix.
- The previously blocked Mac research tail exposed a fixture-path mismatch:
  esbuild canonicalizes /var temporary paths to /private. Only the test fixture's
  directory is canonicalized; allowed and forbidden import assertions are intact.
- The runoff observer had a check/click race: the drop could leave the edge
  during the protocol round trip before pausing. The test now invokes its actual
  pause button in the same browser task that detects the crossing and additionally
  checks the paused DOM still crosses the bottom. Original pixel, protection,
  drainage and 50-second assertions remain; no product rendering was modified.
- Standard e403e11 PR [39892788494](https://github.com/102326/DoL-Game-UI/actions/runs/39892788494)
  passed in 5m56s at actual merge source 836dc05; its downloaded evidence has
  19 unit/35 browser results, 79 matching indexed hashes, no omissions/truncation.
  Its research PR browser installation took 301 seconds (success), separately from
  the subsequent report-validator failure. This is a measured dependency delay,
  not a product assertion failure or a controlled cold-cache benchmark.
- The previously blocked 22-command research tail was exercised locally in
  bounded segments. After the two fixture corrections above, all remaining
  consumer, inventory, weather, glass/runoff and C5/C5.1/C5.2 reports passed their
  profile validation. This is segmented local evidence, not a fabricated whole
  research PASS. Final clean commit/PR and deep Actions results are linked in #22
  and PR #23, with original failures and cancelled runs retained.
- f5afac3 standard PR [39894095301](https://github.com/102326/DoL-Game-UI/actions/runs/39894095301)
  passed in 6m09s; research PR [39894095303](https://github.com/102326/DoL-Game-UI/actions/runs/39894095303)
  and push [39894091147](https://github.com/102326/DoL-Game-UI/actions/runs/39894091147)
  passed in 8m04s / 6m37s. Actual research ZIP size (164447169 bytes for PR)
  revealed repeated images: flat reports recursively swept the common Evolution
  parent into several review folders. A controlled original-failure test and
  independent review confirm the duplication/basename-collision defect. Flat
  reports now retain only their required raw result; timestamped review folders
  copy direct PNG/auxiliary JSON siblings only. All three comparison build roots,
  required proof, limits and retention stay intact. Same-case PNG/geometry remain;
  nested/sibling files and symlinks are rejected. This upload-only follow-up does
  not change the 241-case deep matrix; its f5afac3 budget sample is reported under
  its own SHA, never mislabeled as a later commit's check.

## 5. Scope limits

No main merge, release/CD, ruleset/protection/bypass, public UI/Host version,
external AI or UI/Evolution feature changes. No player save was read or uploaded.
CI success is controlled source/fixture proof; G1/G2/G3, physical devices,
real DoL/ModLoader/multi-Mod and owner visual acceptance remain separate.

## 6. Concurrent development base integration

While final evidence was being reviewed, the development branch advanced from
34f4217 to `6f7d4d91b515f67b334bbe4f9e84194397ff7c18` (accepted settings S01 integration).
The CI repair branch merges that source without altering its implementation. The
only merge conflict was HANDOFF prose: both CI and current S01 status are retained;
current S01 integration supersedes old prototype-only wording. PR diff remains
CI/tests/packaging/documentation relative to the new base. Old green runs and the
f5afac3 deep sample are explicitly older-baseline evidence; the merged candidate
requires new actual PR checks and identities. Earlier f587e1a UI ZIP byte equality
also belongs to the old baseline, not the newly integrated settings source.

Actual weather-dist is about 94 MiB, largely committed first-party comparison
PNG/MP4/JSON rather than runtime code. A targeted original-failure test caught
the initial build extension filter excluding these media. The build whitelist
now preserves them under the same three safe roots, 8 MiB per file / 160 MiB
total and 14-day retention. Comparison media remain historical, not new runtime
PASS records; `.save` and arbitrary files remain excluded. This is preservation
of the original dist review scope, not a new upload source or player-data scan.
The two original directory-external JSON paths, golden-spin-b/bundle-sizes.json
and settings-refraction-v1/provenance.json, remain exact-path optional metadata
under the default 256 KiB JSON cap. Their parents are never swept and symlinks
are rejected before copying.

The new S01 baseline's 80 ms closing fade exposed a historical-counterexample
precondition race (actual PR run 39895657097): category readiness could precede
the 100 ms opening fade. Closing at zero opacity yields zero duration and no
paused-animation witness. The fixture now waits for the actual shell opening
completion before injecting a stuck close. The paused witness, exact
MOODY_SETTINGS_CLOSE_PENDING rejection and positive delayed-close control remain.

PR run 39896439311 then exposed a separate emulated-media fixture race in
game-first-motion (same-source push 39896433725 passed). A local reproduction
instrumenting only the existing production MQL callback recorded zero change
deliveries despite matches=true, enabled=false and one paused relay. The test
now lets the no-preference baseline reach two real rendering frames before the
next override. It does not dispatch synthetic media events or change production
cleanup. All original checks and the 1 s cleanup budget remain. The healthy
fixture passes; deleting the real media listener yields the exact AssertionError
"reduced must remove paused relay". Both original failure and mutation are kept.
