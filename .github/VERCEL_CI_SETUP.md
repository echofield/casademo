## Vercel CI Deployment Setup

This repo deploys through GitHub Actions using one Vercel team identity.
No need to make the repo public.

### 1) Add GitHub repository secrets

In GitHub -> Settings -> Secrets and variables -> Actions, add:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### 2) Get values

- `VERCEL_TOKEN`: Vercel -> Account Settings -> Tokens
- `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`:
  - easiest: run `vercel link` locally once, then read `.vercel/project.json`
  - or copy from Vercel project settings

### 3) Keep one deployment source

In Vercel project settings, keep Git integration but rely on this workflow for deploy authority.
This prevents commit-author access blocks while keeping the same domain/project.

