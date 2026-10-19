# CJ-4 — merge quality gate

Authorization: owner's 2026-10-19 instruction to finish remaining work supersedes
older proposal-only snapshots. No Release/CD or physical-device claims follow.

## Contract

Keep the stable `validate` job and CI/CD separation. A small `moody-gate` job
always runs after it and accepts only `needs.validate.result == success`.
Validation failure, skipping or cancellation cannot be converted into approval;
a missing workflow leaves required checks absent. The exact YAML shell is tested
by `ruby scripts/check-ci-gate.rb`, including failure, skipped, cancelled, neutral,
timeout, unknown and missing inputs. The full workflow also runs this check and
the existing collaboration parser, without new dependencies or a Judge runtime.

[Desired ruleset](moody-blues-ruleset.json): main/default branch only, required
`validate` and `moody-gate` from GitHub Actions App15368, strict base freshness,
no bypass. Existing `jijizi` update/deletion/non-fast-forward rules and its bypass
actors remain unchanged. Old bypass permissions do not grant bypass of this new
independent quality rule. Admins can still edit rules; this is not an immutable
security boundary or a defense against maliciously rewritten workflows or
same-App same-name checks. GitHub itself accepts some skipped/neutral required
checks: the always job and its configuration check close ordinary validate-skip
paths, not every possible future workflow rewrite.

## Server acceptance

Use only `test/moody-blues-cj4-target-20261019` for negative merge attempts.
Its temporary rule has the same checks, strict and bypass settings as the final
JSON; actual PUT merge requests test missing, failing and skipped checks. A
healthy control establishes real success. A separate harmless PR advances the
controlled base so a previously green PR becomes stale and must be rejected.
No negative attempt targets main or modifies player data. Probe branches/history
remain identifiable; never copy their workflow or synthetic note into main.

After the implementation PR has actual successful checks, narrow this rule to
`~DEFAULT_BRANCH`, read effective main rules, merge the verified PR, and verify
main push CI. Record actual rule ID, head/base, Runs, API rejection responses and
package/evidence identity in the delivery report. Do not infer deployment from
this document or from a rule creation request alone.

## Operations

Main changes now need current successful checks. Update a stale branch normally
and rerun CI; do not remove checks or add bypass to make a merge green. Existing
update lock may still require its already configured admin privilege once quality
checks pass. Emergency rule edits are an explicit human decision; keep the old
rule intact and record the change. No queue, reviewer-count policy, automatic
merge or CD is introduced. Real Windows/Android/iOS/game tests remain separate.
