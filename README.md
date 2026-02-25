# 🛡️ ISO Shield — ISO 27001 Security Audit & Risk Platform

A comprehensive web-based platform for ISO 27001 security auditing, risk assessment, and compliance management.

Built with **Next.js 14** + **Supabase** + **Tailwind CSS**.

---

## 🗂 Phase Structure

| Phase | Modules | 
|-------|---------|
| **Phase 1** | Auth, Organization Profile, Asset Inventory, Risk Matrix |
| **Phase 2** | ISO Checklist, Compliance Dashboard, Evidence Upload |
| **Phase 3** | Findings Generator, PDF Report, AI Assistant | 

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repo>
cd iso-shield
pnpm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key
3. In the Supabase dashboard → **SQL Editor**, run the entire contents of `supabase/schema.sql`

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📐 Project Structure

```
iso-shield/
├── app/
│   ├── (app)/                    # Protected app routes
│   │   ├── layout.tsx            # App shell with sidebar
│   │   ├── dashboard/            # Main dashboard
│   │   ├── organization/         # Org profile setup
│   │   ├── assets/               # Asset inventory
│   │   │   ├── page.tsx          # Asset list
│   │   │   ├── new/              # Add asset form
│   │   │   └── [id]/             # Asset detail + vuln assessment
│   │   └── risk/                 # Risk matrix & heatmap
│   ├── auth/
│   │   ├── login/                # Login page
│   │   └── register/             # Registration page
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx
│   └── ui/
│       ├── StatCard.tsx
│       ├── RiskBadge.tsx
│       ├── CIASlider.tsx
│       └── PageHeader.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Auth middleware
│   ├── actions/
│   │   ├── auth.ts               # Auth server actions
│   │   ├── assets.ts             # Asset CRUD actions
│   │   └── organization.ts       # Org management actions
│   └── utils.ts                  # Utilities & formatters
├── types/
│   └── database.ts               # TypeScript types
├── supabase/
│   └── schema.sql                # Complete DB schema
└── middleware.ts                  # Route protection
```

---

## 🎯 Features (Phase 1)

### 🔐 Authentication
- Email/password login & registration
- Session management via Supabase Auth
- Route protection middleware
- Password strength indicator

### 🏢 Organization Profile
- Complete org setup form
- Business sector classification
- System type selection (Web, Cloud, Mobile, etc.)
- Exposure level configuration
- Risk appetite setting
- Audit scope definition

### 🗂 Asset Inventory
- Asset CRUD operations
- Asset types: Hardware, Software, Data, Service, Personnel, Facility
- CIA Triad scoring (Confidentiality, Integrity, Availability) 1–5 scale
- **Auto-computed criticality score**: `(C × 0.4) + (I × 0.35) + (A × 0.25)`
- Auto-classified criticality: Critical / High / Medium / Low
- Asset metadata: owner, location, vendor, version, IP

### 🐞 Vulnerability Assessment (per asset)
- All 10 **OWASP Top 10 2021** vulnerabilities pre-seeded
- Per-asset vulnerability selection
- Likelihood scoring (1–5)
- Impact scoring (1–5)  
- **Auto-computed Risk Score**: `Likelihood × Impact`
- Risk levels: Critical (≥20), High (12–19), Medium (6–11), Low (2–5)
- Remediation guidance per vulnerability

### 📊 Risk Matrix
- **5×5 Risk Heatmap** visualization
- Risk distribution charts
- All risks tabular view with filters
- Top risk items summary
- Filter by risk level (Critical/High/Medium/Low)

---

## 🗄 Database Schema

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends Supabase auth) |
| `organizations` | Organization data + audit scope |
| `assets` | IT asset inventory with CIA scores |
| `vulnerabilities` | OWASP Top 10 catalog (pre-seeded) |
| `asset_vulnerabilities` | Risk assessments (asset × vulnerability) |

All tables use **Row Level Security (RLS)** — users only see their organization's data.

---

## 🎨 Design System

- **Color**: Deep navy/slate dark theme with indigo brand accents
- **Font**: Space Grotesk (display) + DM Mono (code)
- **Components**: Glass morphism cards, animated stat counters
- **Patterns**: Subtle grid background, glow effects on interactive elements

---

## 📋 Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) |

---

## 🔜 Phase 2 Preview

- ISO 27001 control checklist (114 controls across 14 domains)
- Control status: Compliant / Partial / Non-compliant / N/A
- Evidence upload & management
- Compliance percentage dashboard

## 🔜 Phase 3 Preview

- Auto-generated audit findings from risk data
- Executive PDF report generation
- AI assistant for vulnerability explanation & mitigation suggestions
