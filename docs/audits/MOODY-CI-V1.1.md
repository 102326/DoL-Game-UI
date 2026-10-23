# Moody Blues V1.1 — differential engineering record

Authority: owner-approved CI hardening V1.1, continuing Draft PR23/Issue22. Audit
baseline34f4217 is historical. This implementation starts from unmerged CI155b6f6
and dev6f7d4d9; check live PR metadata for final head/base/merge identity. No product
runtime, visual decision, public version, Host/protocol, protection/bypass or CD
change is authorized here. Existing valid V1.0 proof is retained under its own SHA.

## Current status and batch reports

Implemented, Tested, Integrated and Release Ready are distinct. All four batches
below have engineering implementation; local tests and actual final Actions are
recorded separately. Integrated=false (Draft, unmerged); Release Ready=false.
Exact commands, terminal results, final run/attempt/checkout, artifact counts and
remaining limits are recorded in the PR/Issue22 delivery update, not a self-SHA
commit that would change the source under test.

| Batch | Files and differential implementation | Local verification | Actual integration / next work |
| --- | --- | --- | --- |
| 1 Foundation | ci-catalog/ci-evidence/test-ci; independent frozen expected IDs, catalog1.1.0+hash, nonce/event/PR identity, five states and assertion/integrity dimensions, compact summary, enriched manifest; G01–G12 | ci-gate, ci-evidence, research-evidence,20 required unit entries; explicit infrastructure vs real assertion vs early exit probes | Final PR standard/research must run; no merge authorized |
| 2 Research/migration | Existing38 research commands and23 raw reports remain; evolution-unit reuses the same runSuite for its original3 checks. Required same-run T1 frames are declared in catalog; PNG structure/CRC/decompressed geometry is checked. Historical original-speed media remain separate | Research complete synthetic proof plus missing T1/raw/identity/hash/plan negatives; actual original3 unit checks; complete Runtime entries and5 precise source mutations | Owner visual acceptance and real game/device work remain separate |
| 3 Integration trust | Same-run downloaded artifact verifier; independent expected set/source/run/attempt/event/ref/nonce/catalog/PR anchors. moody-gate needs both validate and evidence-verify; research equivalent. Core identity independent; supported npm package stays paired | Actual gate shell tested against success/failure/skip/cancel/missing; isolated verifier without npm/browser dependencies; package identity/negative contracts remain | Final Actions upload/download is required; Merge Queue/strict protections are proposals only |
| 4 Measurement | metrics.json preserves stage/cache/attempt/depth/catalog/timings; delivery has collection/preparation time; verifier has download verification time; ci-metrics reads real job-step timestamps incl upload | Pure aggregation checks; real final runs exported at delivery. P95 disabled below20 comparable successful observations, and when cache/depth/catalog attribution is unknown | Accumulate representative natural runs, investigate failures/flakes, then change budgets only with evidence |

## Expected Catalog and result contract

ci-catalog extracts the existing suites, stages and research plan rather than
creating a second Judge. Definitions, research case sets and checkpoint lists are
frozen. catalog.json is a versioned snapshot, bound by canonical SHA-256 in every
run identity. Its expected IDs never come from actual results. Runtime and early
API checkpoints are recorded only after original assertions pass, and validated
in exact sequence. Native Node test cases have a separate reviewed static name
list; discovery/results cannot silently redefine this expectation. Device IDs
are a reviewed JSON plan usable without Playwright in the post-upload job.

Zero checks, missing/duplicate/unknown IDs, missing checkpoints, unknown catalog,
wrong profile, skipped/todo tests and early process.exit(0) cannot establish PASS.
The static policy parses actual JavaScript syntax (including shorthand options),
so comments/examples are not execution; native test events independently reject
empty or skipped execution. Assertions in required plain scripts are counted via
transparent built-in assert proxies; counting is not a substitute for the
explicit sequence, Node case, device and package contracts.

PASS means all required assertions and proof are complete. FAIL is a terminal
real Node assertion, a trusted native Node test assertion event, or the Python
package contract's bound AssertionError report. ERROR covers spawn, dependency,
compiler, browser-start and unexpected process faults. UNVERIFIED covers missing
or contradictory proof; CANCELLED covers cancellation/uncompleted execution.
A known FAIL retains priority while EvidenceIncomplete remains explicit.

Handled diagnostic errors and arbitrary stderr text are never assertion proof.
Existing asynchronous test terminal catches call terminalFailure; no assertion
was removed. Per-process execution receipts use random execution IDs and PID
isolation, preventing child expected negatives from overwriting parent results.
The native reporter handles serialized causes, exact expected IDs and selection
outcomes. All non-PASS values exit nonzero. Stage and job raw outcomes remain.

## Evidence and remote release gate

T0: identity, catalog, compact summary, metrics, detailed results, required raw
reports/checkpoints and delivery. T1: catalog-declared same-run review frames,
plus preserved historical comparison builds/media. T2: bounded optional logs and
failure diagnostics. Each manifest entry records path, role, requirement, schema,
size, SHA-256, current/historical provenance and review PNG pixel/environment
metadata. Missing/oversize/unsafe items have explicit omission reasons.

Required files are declared before collection. Stable bytes are hashed, and both
local and downloaded sets are checked. The manifest hash and nonce are anchored
in producer job outputs. Remote verification checks the actual workflow SHA,
source content, PR head/base/merge, run/attempt/event/ref/job, profile/catalog,
exact downloaded set, schemas, sizes and all indexed hashes; it replays the same
semantic validators without running artifact code. JSON, paths, symlinks, file
count, per-file/total size and PNG decompression are bounded. No npm install or
browser download is needed for verification.

Local PASS is labelled preparation-only. A failed evidence upload fails the
producer job; a failed download/remote verification fails its dependent job.
moody-gate keeps its name and accepts only validate=success AND remote=success.
The verifier's small structured result is also uploaded; a failed result upload
fails that job. Research has the equivalent independent verification. No broad
glob alone is accepted as proof. Standard16MiB/7days and research160MiB/14days
budgets remain, with bounded space reserved for metadata; product15/20min budgets
remain. Optional omissions cannot erase required proof or owner review pixels.

## Contract migration map

The original ui-runtime assertions remain in the complete legacy entry; no old
behavior assertion was deleted. Modern required entries isolate reporting and
prevent Core version mismatch from hiding compatibility behavior. The five
source mutations are exact AssertionError checks, never compile/timeout success.

| Contract / original assertions | Modern entry / required sequence | Environment and healthy control | Fault/negative and failure signature | Evidence and old-exit condition |
| --- | --- | --- | --- | --- |
| Core version in ui-runtime injection | ui-runtime-identity; core-identity | Real built legacy entry,2.7.0 | Swap to3.0.4 → legacy Core identity AssertionError | Required separate browser result/checkpoint; original all-group assertion retained |
| Wrapper/Host/protocol/package identity | framework-startup, official-defaults, package-contracts | Real official wrapper3.0.4; Host0.1.5-experimental; protocol0.1-experimental | Existing independent-source/boot/version corruption negatives | Eight-package/two-build structured proof; no version unification |
| Inspector read-only/export privacy | inspector privacy→clipboard-export | Original native input and forbidden game-state getter; immutable snapshots | Raw selector attribute mutation → attribute values redacted from export | Required receipts and exact mutation; original assertions retained |
| Inspector dedup/clipboard rejection | inspector clipboard-export | Same Inspector handle; real export/download, clipboard success | Clipboard reject exercises local failure; no leak/duplicate Inspector | Healthy plus explicit reject branch; no old deletion |
| Event limit/stable rescan | inspector bounded-stable-events→cleanup |45 refreshes,32 bound and full sequence comparison | Remove event trim → event buffer bounded | Required checkpoint and precise mutation; same old behavior |
| Surface focus/Escape/native form/detach | surfaces focus-escape→identity-detach-form | Real native dialog, multiple surfaces and actual form submit | Duplicate type mutation → a duplicate cannot change kind; real background drag check | Original focus/parent/input and submit assertions retained |
| Surface fallback/errors/idempotence | surfaces fallback-errors→idempotent-destroy | showModal missing/throws; onClose throws; repeated destroy | Native API failure is input to fallback control, not a product-negative success | Required checkpoint and original assertions; no deletion |
| Compat load/absence/unsupported/arrival | compat before-core→unsupported-api→core-arrives | Actual adapters before real Core; unsupported API then actual injection | Original absence/capability assertions remain exact | Sequence receipt; other source-deletion mutations are specialized, not claimed run |
| Disable/restore/destroy/reinject/peer isolation | compat disable-restore→destroy-reinject→peer-preservation | Real adapter lifecycle, original native V/input preserved | Remove rebind → independent package rebinds to new Core | Required full sequence + precise mutation; old all suite preserved |
| Early API default/boolean/repeat/foreign/reset | compiled shop early API;5 checkpoints | Actual compiled early global, repeat load in same VM | String true rejected, object/foreign/reset assertions | Required unit result and receipts; ZIP equality alone never substitutes |

Required: modern catalog entries. Specialized: deep device cases, longer original
speed recording and further per-assertion source mutations. Legacy: frozen2.7
monolithic producer/historical0.5.11.9 game workflow. Pending Migration: any
historical game/resource matrix without a modern equivalence claim remains
visible in test-workflow; it is not marked complete by a green standard run.
The old package-legacy CLI now explains its retirement; public npm package keeps
its already migrated supported Host/UI path. No supported command was removed.

## Gate self-tests and review corrections

G01 oversize required summary; G02 missing report; G03 old run; G04 wrong SHA;
G05 post-hash bytes; G06 missing check/sequence; G07 duplicate/unknown/catalog;
G08 crash, fake assertion text, explicit early exit, empty required script and
real native assertion/skip; G09 known FAIL plus incomplete proof; G10 optional
oversize screenshot still permits PASS with omitted; G11 missing dependency;
G12 only/skip/todo calls/options/shorthand and native event enforcement. Extra
cases cover actual downloaded-set mismatch, nonce/attempt/PR/profile mismatch,
no-npm verification, truncated PNG/bad CRC and required visual omission.

Early independent review found and corrected misclassification of serialized
native assertions, diagnostic-error pollution, cross-process receipt races,
shorthand/direct native test skips, transitive Playwright dependency and weak
PNG-header-only validation. These were test infrastructure defects, not product
visual failures. Failures and final passing controls are retained in delivery.

## Security, governance and measurement boundaries

Action refs are fixed40-character commits; checkout pins github.sha and does not
persist credentials. Contents read permissions, ordinary pull_request, no
pull_request_target/workflow_run elevated path or secrets, locked npm/Playwright,
no evidence cache and no retry/continue-on-error/||true/set+e masking. Node policy
checks these workflows and CI npm exit propagation. No external platform added.

CODEOWNERS for workflows/catalog/schema/runner is a proposed review-routing
change for repository owner confirmation, not silently activated protection.
Merge Queue/strict checks could reduce base drift but change queue/check policy;
keep them as separate owner decisions. Final PR identity is recorded without
changing GitHub required checks, protection, bypass or publishing permissions.

CI source/fixture completion does not establish G1/G2/G3, real DoL/ModLoader,
multi-Mod, physical devices, owner visuals or Release Ready. Release catalog is
an explicit design contract with automaticRelease=false and separate owner
approval; no release workflow/CD was introduced. Metric aggregation does not
invent a controlled cold/warm experiment or a representative p95 from one run.
