# Casa One Presentation Demo Handoff

## What Was Frozen
- The original working repository remains at `C:\Users\echof\Desktop\02_PROJECTS\casa-one`.
- The demo work was isolated into `C:\Users\echof\Desktop\02_PROJECTS\casa-one-demo` on branch `demo/casa-one-presentation`.
- No production Supabase writes were added for the demo path.
- The demo surfaces are intentionally read-only where persistence would be misleading in a presentation.

## What Was Duplicated Or Forked
- Full application copy into `casa-one-demo`.
- Local presentation dataset in `src/lib/demo/presentation-data.ts`.
- Demo mode switch in `src/lib/demo/config.ts`.
- Demo-aware auth and middleware in `src/lib/auth/index.ts` and `src/middleware.ts`.
- Demo-aware page/API reads for home, queue, clients, client detail, dashboard, team, meetings, notifications, seller impact, and conversion.

## Demo Data Strategy
- Strategy chosen: local seeded presentation adapter.
- Why: fastest isolation path, no risk of hitting live boutique data, no schema migration dependency for the presentation build.
- Dataset includes synthetic luxury clients, spend history, contacts, meetings, notifications, sizing, affinities, lifecycle spread, and KPI-ready portfolio activity.
- Seller structure is preserved from the existing team model and disconnected from real client data.

## Demo Environment Variables
Use `.env.demo.example` as the demo deployment template.

Required:
- `NEXT_PUBLIC_CASA_DEMO_MODE=true`
- `NEXT_PUBLIC_SUPABASE_URL=https://jfekctxsajhytyzsamkp.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<demo anon key>`

Notes:
- No service role key is required for the presentation path.
- Supabase remains a safe browser client dependency for auth widgets/components, but demo reads come from local seeded data.
- Meeting, notification, and conversion APIs are demo-aware and return seeded presentation responses.

## How To Resume Mainline Work Safely
- Return to the original repo: `C:\Users\echof\Desktop\02_PROJECTS\casa-one`.
- Continue from its existing branch and uncommitted work exactly as before.
- Do not copy demo env vars back into the original project.
- Treat `casa-one-demo` as a separate presentation surface with separate remote/deploy config.

## Build And Deploy
1. Copy `.env.demo.example` to `.env.local` in `casa-one-demo`.
2. Install dependencies if needed: `npm install`
3. Validate: `npx tsc --noEmit`
4. Build: `npm run build`
5. Deploy to a separate Vercel project using the demo env vars only.

## Deployment Target
- Recommended GitHub remote: `https://github.com/echofield/casademo.git`
- Keep this remote separate from `Casa-one.git` so demo deployment cannot replace the live product by accident.
