# Deploy Checklist (Staging Then Production)

## Stage 0: Freeze
1. No direct production deploy.
2. No direct production migration.
3. Confirm pre-push guard is active locally.

## Stage 1: Staging release
1. Push release branch.
2. Deploy branch to staging target.
3. Apply migrations to staging only.
4. Execute `VALIDATION_GATE.md` end-to-end.
5. Record evidence artifacts and sign-off notes.

## Stage 2: Production release window
1. Announce maintenance/release window.
2. Deploy approved artifact/version to production.
3. Apply production migrations in defined order.
4. Run smoke tests:
   - auth/login
   - seller scope
   - supervisor scope
   - notification generation/manual send
   - DSAR export/anonymize

## Stage 3: Post-release
1. Confirm no error spike in logs.
2. Verify DSAR audit records are writing.
3. Archive release evidence packet.
