# Project Status

## Current Deployment

- Production is live on Vercel
- The deployed production behavior must remain unchanged unless an intentional maintenance fix is approved

## Branch Roles

- `main`: stable production branch frozen for reliability
- `demo/casa-one-presentation`: branch for presentation work, fake data, and demo-only adaptations

## Safeguards

- Local reminder: run `npm run warning`
- Recommended GitHub protection for `main`:
  - disable force pushes
  - require pull requests before merging changes

## How To Resume Development Later

1. Start new work from `demo/casa-one-presentation` or a feature branch created from it
2. Keep `main` as the production snapshot unless a production fix is explicitly needed
3. If production changes are required later, open a pull request into `main` with the smallest possible change set
4. Re-verify Vercel production behavior before merging anything back to `main`