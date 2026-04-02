# Local Freeze Handoff Pack

This folder is a local-only release packet prepared while production remains frozen.

Current guardrails:
- No `git push`
- No Vercel deploy
- No remote Supabase migration
- No production env changes

What this pack contains:
- `CHANGELOG_TRUST_HARDENING.md`: batch-by-batch hardening summary
- `IT_CONTROLS_SUMMARY.md`: concise client/IT-safe control statement
- `MIGRATION_RUNBOOK.md`: planned migration order, checks, and rollback points
- `DEPLOY_CHECKLIST.md`: release checklist for staging then production
- `VALIDATION_GATE.md`: runtime validation criteria before any rollout
- `VENDOR_DPA_AND_GOVERNANCE_TEMPLATE.md`: compliance dossier template items
- `artifacts/`: generated local evidence (`git` diff/status + test/build/typecheck outputs)

Status reminder:
- All hardening remains local working tree only until explicit release decision.

Local push guard:
- A local .git/hooks/pre-push hook blocks pushes by default.
- One-time bypass when intentionally releasing: ALLOW_PUSH=1 git push <remote> <branch>.

