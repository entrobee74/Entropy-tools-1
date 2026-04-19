# ⚡ Entropy Tools

Professional digital tools platform with wallet-based pay-per-use system.

## Features

- 🏠 Landing page with service preview
- 🔐 Login / Register system
- 💳 Wallet deposits via **Paystack**
- ⚡ Tool launcher with credit deduction
- 🔗 Shareable view links for every generation
- ↓ Download receipts for each generation
- 📊 User dashboard with full transaction history
- ⚙️ Admin panel — manage pricing, users, transactions, generations

## Services Included

| Service | Category | Source |
|---------|----------|--------|
| Position Generator | Trading | [GitHub](https://github.com/entrobee74/Position-gen) |
| Transaction Receipt | Crypto | [GitHub](https://github.com/entrobee74/crypto-receipt) |
| Support Center | Site Builder | [GitHub](https://github.com/entrobee74/Support-center) |

## Setup Instructions

### 1. Paystack Keys

The **public key** is already set in `js/paystack.js` and is safe to be in frontend code.

> ⚠️ **NEVER put your secret key (`sk_live_...`) in frontend code or commit it to GitHub.**
> The secret key must only be used on a backend server (e.g. a Vercel serverless function or Node.js server) to verify payments via the Paystack API before crediting wallets.
>
> To verify payments server-side, create a `/api/verify` endpoint that calls:
> `GET https://api.paystack.co/transaction/verify/:reference`
> with header `Authorization: Bearer sk_live_YOUR_SECRET_KEY`
> and set that key as a **Vercel Environment Variable**, never in code.

### 2. Deploy to Vercel

**Option A: Via CLI**
```bash
npm i -g vercel
cd entropy-tools
vercel --prod
```

**Option B: Via GitHub**
1. Push this repo to `https://github.com/entrobee74/Entropy-tools-.git`
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Deploy — no build config needed (pure HTML)

### 3. Admin Login

Default admin credentials:
- **Email:** `admin@entropytools.com`
- **Password:** `Admin@2025`

⚠️ Change these in `js/app.js` under `DEFAULT_ADMIN` after first login.

### 4. Adding Tools

Edit the `TOOLS` / services config in `js/app.js` under `DEFAULT_SERVICES`.

## File Structure

```
entropy-tools/
├── index.html          Landing page
├── auth.html           Login & Register
├── dashboard.html      User dashboard
├── services.html       Tools & services
├── deposit.html        Wallet deposit
├── admin.html          Admin panel
├── tool-frame.html     Tool launcher (iframe)
├── view.html           Shareable view page
├── css/
│   ├── main.css        Design system
│   └── animations.css  Loading animations
├── js/
│   ├── app.js          Core auth & state
│   ├── paystack.js     Payment integration
│   ├── services.js     Tool launch logic
│   └── admin.js        Admin functions
└── vercel.json         Vercel config
```

## ⚠️ Production Notes

- **Paystack verification:** In production, verify payment references on your backend **before** crediting wallets. The current setup credits client-side (fine for testing, not for production with real money).
- **Data storage:** Currently uses `localStorage` — suitable for demo/testing. For production, connect to a backend (Firebase, Supabase, etc.)
- **Admin password:** Change the default admin credentials before going live.

## Tech Stack

- Pure HTML/CSS/JS — no frameworks, no build step
- Fonts: Orbitron, Space Mono, Rajdhani (Google Fonts)
- Payments: Paystack
- Hosting: Vercel

---
Built with ⚡ Entropy Tools
