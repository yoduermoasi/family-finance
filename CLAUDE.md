# Family Finance Dashboard — Claude Briefing

Pablo & Camila's family spending tracker. Read this before doing anything.

## What it is
Full-stack app to track family spending automatically. Gmail sync pulls Chase/BofA transaction emails every 5 min. Amex is entered manually. All amounts shown in both COP and USD with a live exchange rate.

## Live URLs
- **Frontend:** https://family-finance-smoky.vercel.app
- **Backend:** https://family-finance-rdjg.onrender.com
- **GitHub:** https://github.com/yoduermoasi/family-finance

## Stack
- **Frontend:** React 19 + Vite, CSS Modules, Recharts — deployed on Vercel
- **Backend:** Node.js 20 + Express (ES modules) — deployed on Render (free tier, spins down when idle)
- **Database:** MongoDB Atlas (free M0), db name: `family-finance`

## Project structure
```
family-finance/
  frontend/   ← Vercel deploys this (root directory set to "frontend")
  backend/    ← Render deploys this (root directory set to "backend")
```

## Environment variables

### Backend (set on Render → Environment):
| Variable | Value |
|---|---|
| `MONGODB_URI` | Get from MongoDB Atlas → Connect → Drivers (cluster owned by figueroacamila@hotmail.com) |
| `FRONTEND_URL` | `https://family-finance-smoky.vercel.app` |
| `GOOGLE_CLIENT_ID` | Get from Google Cloud Console → project "family-finance" (owned by pjltpr@gmail.com) |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `PLAID_CLIENT_ID` | Get from Plaid dashboard |
| `PLAID_SECRET` | Get from Plaid dashboard |
| `PLAID_ENV` | `sandbox` |
| `NODE_VERSION` | `20` |

### Frontend (set on Vercel → Environment Variables):
| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://family-finance-rdjg.onrender.com` |

## How to deploy

### Backend (Render)
Render auto-deploys on push to main. To trigger manually:
```
curl -X POST "https://api.render.com/deploy/srv-d7r5fobrjlhs73fiqaqg?key=TZZGfOwF2Jw"
```

### Frontend (Vercel)
Vercel auto-deploys on push to main. Or:
```bash
cd frontend && npx vercel --prod
```

## Gmail sync (cron-job.org)
Pulls transaction emails from pablolorenzanat@gmail.com every 5 min.
- **URL:** `https://family-finance-rdjg.onrender.com/api/gmail/sync`
- **Method:** POST
- **Schedule:** every 5 minutes
- Gmail OAuth app is in Google Cloud project "family-finance" (pjltpr@gmail.com)
- OAuth redirect URI: `https://family-finance-rdjg.onrender.com/api/gmail/callback`
- Test user authorized: pablolorenzanat@gmail.com

## Key features
- 8 spending categories with monthly USD budgets
- Live COP↔USD exchange rate (1hr cache + manual override)
- Gmail auto-sync: Chase + BofA emails → transactions
- Category learning: when user corrects a category, merchant→category saved to `learnedRules` collection
- Manual entry for Amex + reimbursements (Zelle paybacks subtract from category)
- Inline "Who" edit (Pablo/Camila) — Gmail imports default to Pablo
- Savings row = total budget − total spent
- Monthly + yearly views with charts
- Plaid integration built (sandbox only — production not yet approved)

## Transaction sources
- **Chase + BofA:** auto-synced via Gmail (pablolorenzanat@gmail.com)
- **Amex:** manual entry in the + Add tab
- **Reimbursements:** manual entry as "Reimbursement" type

## Design
Graffiti/street art aesthetic inspired by @caballo_perrro on Instagram.
- Colors: warm paper background, blue header, yellow accent, pink tabs
- Font: Bebas Neue (display)
- Mascot: horse-dog in Crocs (caballo.png) top-left corner

## Categories and monthly budgets (USD)
- Rent: $1,500
- Gas/Electricity/WiFi: $82
- Cellphone: $62
- Groceries: $482
- Chill/Relax/Fun: $500
- Health Insurance: $240
- Roth IRA: $1,500
- Extra: $69
