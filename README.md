# أثر (Athar) — منصة التبرعات الخيرية

A full-stack charity donation platform built with Next.js 14, Supabase, and Tailwind CSS.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```
# 1. أحدّث Next.js لإصلاح الثغرة الأمنية
npm install next@latest

# 2. أصلح باقي الثغرات تلقائياً
npm audit fix

# 3. شغّل المشروع
npm run dev

### 2. Environment Variables

Copy `.env.local` and fill in your keys:

```bash
cp .env.local .env.local.example
```

Required variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Optional — for AI chatbot (OpenRouter)
OPENROUTER_API_KEY=your_openrouter_key

# Optional — for PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET=your_paypal_secret

# Optional — for USDT payments
USDT_WALLET_ADDRESS=your_wallet_address

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

Run the SQL schema in your Supabase SQL Editor:

```bash
# Open supabase/schema.sql and run it in Supabase Dashboard > SQL Editor
```

### 4. Supabase Storage Buckets

Create two storage buckets in Supabase Dashboard > Storage:
- `campaign-images` (public)
- `avatars` (public)

Then enable Google OAuth in Supabase Dashboard > Authentication > Providers.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             
│   ├── api/                # API routes
│   │   ├── chat/           # AI chatbot (OpenRouter)
│   │   ├── campaigns/      # Campaigns CRUD
│   │   └── donations/      # PayPal + USDT
│   ├── about/              # About page
│   ├── auth/               # Login, Register, Reset
│   ├── campaigns/          # Campaign listing + detail
│   ├── dashboard/          # User dashboard (role-based)
│   │   ├── admin/          # Admin panel
│   │   ├── campaigns/      # My campaigns + create
│   │   └── donations/      # Donation history
│   ├── donate/             # Donate landing page
│   └── profile/            # User profile
├── components/
│   ├── campaigns/          # CampaignCard, CampaignGrid, UsdtPayment
│   ├── chatbot/            # AI chatbot widget
│   ├── home/               # Homepage sections
│   ├── layout/             # Navbar, Footer, MainLayout
│   ├── providers/          # ThemeProvider
│   └── ui/                 # ShadCN-style UI components
├── hooks/                  # Custom React hooks
├── lib/
│   ├── supabase/           # Client + Server Supabase clients
│   ├── utils.ts            # Helpers, formatters
│   └── validations.ts      # Zod schemas
├── middleware.ts            # Route protection
├── styles/globals.css       # Global styles + CSS variables
└── types/index.ts           # TypeScript types
```

---

## 🔑 User Roles

| Role | Permissions |
|------|------------|
| `admin` | Full access, manage all campaigns & users, assign roles |
| `moderator` | Review & approve/reject campaigns |
| `organization` | Create campaigns (require approval), view donations |
| `beneficiary` | Create up to 2 campaigns/month (auto-published) |
| `donor` | Browse campaigns, make donations |

### Setting Admin Role

After registering, run in Supabase SQL Editor:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

---

## 💳 Payment Methods

### PayPal
Set `PAYPAL_CLIENT_ID` and `PAYPAL_SECRET` in `.env.local`.
Uses PayPal sandbox in development.

### USDT (Crypto)
Set `USDT_WALLET_ADDRESS` to your TRC20/ERC20 wallet.
Supports MetaMask connection for ERC20/BEP20.
Manual TX hash verification workflow included.

---

## 🤖 AI Chatbot

Uses OpenRouter API (free tier available).
Set `OPENROUTER_API_KEY` in `.env.local`.
Model: `mistralai/mistral-7b-instruct:free`

Get a free key at: https://openrouter.ai

---

## 🚀 Deployment (Vercel + Supabase)

1. Push to GitHub
2. Connect repo to Vercel
3. Add all environment variables in Vercel dashboard
4. Set `NEXT_PUBLIC_APP_URL` to your production URL
5. Update Supabase Auth > URL Configuration with your production URL
6. Deploy!

---

## 🛡️ Security Features

- ✅ Row Level Security (RLS) on all tables
- ✅ Middleware-based route protection
- ✅ Zod input validation on all forms & API routes
- ✅ Rate limiting on chat and payment APIs
- ✅ CSRF protection via Supabase SSR
- ✅ Environment variables for all secrets
- ✅ XSS protection via React's default escaping

---

## 📦 Key Dependencies

- `next` 14 (App Router)
- `@supabase/ssr` — Supabase auth with SSR support
- `next-themes` — Dark/light mode
- `react-hook-form` + `zod` — Form validation
- `sonner` — Toast notifications
- `lucide-react` — Icons
- `tailwindcss-animate` — Animations
- `ethers` — Web3/MetaMask integration (ready)

---

Built with ❤️ for the Arabic-speaking charity community.
