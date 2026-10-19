# CJ-4 / MB-GH-01 remaining work

Owner's 2026-10-19 instruction authorizes completing remaining engineering work,
including the previously prepared quality rules and label proposals. Release/CD,
unrelated UI changes and invented physical-device measurements remain outside scope.

1. Reuse the clean isolated worktree; branch from main16bca36. Preserve validate;
   add always-running moody-gate requiring needs.validate.result == success.
2. Execute the exact YAML gate shell locally against success, failed, skipped,
   cancelled, neutral, timeout and absent results; only success may pass.
3. Create the eight previously proposed labels if absent; attach category labels
   to the four relevant forms. Preserve existing labels and optional feedback.
4. Add concrete required_status_checks JSON: validate and moody-gate, Actions
   App15368, strict true, no bypass. Preserve old jijizi ruleset unchanged.
5. Use a separate controlled target/PR for missing/failure/skipped/healthy/stale
   checks and actual server merge rejections. Never use main for negative writes.
   Apply the new rule to main only after the final implementation PR passes.
6. Independent review, actual PR CI, source/evidence identity, approved merge,
   main push CI and rules readback; update HANDOFF and full delivery report.

No matrix expansion or new dependencies. Real-device parameters and Windows/game
acceptance require their actual environments; keep these unverified until supplied.
