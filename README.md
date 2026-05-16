# 💈 Saloon Token System

A complete digital token/queue management system for saloons — built with React, Firebase Firestore, and Tailwind CSS. Deploy on Vercel in minutes.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🏠 Super Admin Panel | Add/manage all saloon owners, reset passwords |
| 📊 Owner Dashboard | Token management, settings, reports, holidays |
| 🎫 Booking Page | Customer-facing black & gold luxury UI |
| 🔔 Notifications | Browser push — 10 min before turn |
| 📱 PWA | Install on home screen, 30-day session |
| 🕐 Auto Reset | Midnight token counter reset |
| 📅 Holidays | Single day + date range support |
| 📊 Reports | 3-day rolling reports, auto-delete old |
| 🎨 QR Card | Download print-ready QR code card |
| ⚡ Real-time | Live queue updates via Firestore |

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore (real-time)
- **Auth**: Session-based (localStorage / sessionStorage)
- **Push**: Web Notification API
- **QR**: qrcode library
- **PWA**: vite-plugin-pwa

---

## 🚀 Setup Guide (Step by Step)

### Step 1 — Firebase Project Create Karo

1. [Firebase Console](https://console.firebase.google.com) open karo
2. **"Add project"** click karo
3. Project name dalo (e.g. `saloon-token-system`)
4. Google Analytics: optional
5. Project create hone ke baad **"Continue"**

### Step 2 — Firestore Database Enable Karo

1. Left sidebar mein **"Firestore Database"** click karo
2. **"Create database"** click karo
3. **"Start in test mode"** select karo (baad mein rules update karenge)
4. Region select karo (closest to Pakistan: `asia-south1`)
5. **"Enable"** click karo

### Step 3 — Firebase Config Copy Karo

1. Project Overview mein gear icon (⚙️) → **"Project settings"**
2. Scroll down → **"Your apps"** section
3. **"</>"** (Web app) icon click karo
4. App nickname dalo → **"Register app"**
5. `firebaseConfig` object copy karo — yeh tumhara config hai

### Step 4 — Environment Variables Set Karo

Project folder mein `.env` file banao:

```bash
cp .env.example .env
```

`.env` file open karo aur Firebase config values dalo:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc123
VITE_SUPER_ADMIN_PASSWORD=your_secure_password_here
```

> ⚠️ **Important**: `.env` file kabhi GitHub pe push mat karo (`.gitignore` mein already hai)

### Step 5 — Local Test Karo

```bash
npm install
npm run dev
```

Browser mein `http://localhost:5173` open karo ✅

### Step 6 — GitHub pe Upload Karo

```bash
# Git initialize (agar pehle nahi kiya)
git init
git add .
git commit -m "Initial commit - Saloon Token System"

# GitHub pe new repository banao (github.com → New Repository)
# Phir:
git remote add origin https://github.com/YOUR_USERNAME/saloon-token-system.git
git branch -M main
git push -u origin main
```

### Step 7 — Vercel pe Deploy Karo

1. [vercel.com](https://vercel.com) pe login karo (GitHub se)
2. **"New Project"** click karo
3. GitHub se `saloon-token-system` repo import karo
4. **Framework Preset**: Vite (auto-detect ho ga)
5. **Environment Variables** section mein sab `.env` values add karo:
   - `VITE_FIREBASE_API_KEY` → value
   - `VITE_FIREBASE_AUTH_DOMAIN` → value
   - (sab VITE_ variables)
   - `VITE_SUPER_ADMIN_PASSWORD` → apna secure password
6. **"Deploy"** click karo 🚀

Deploy hone ke baad tumhara URL milega:
```
https://saloon-token-system.vercel.app
```

### Step 8 — Firestore Security Rules Update Karo

Firebase Console → Firestore → **Rules** tab → `firestore.rules` file ka content paste karo → Publish

### Step 9 — Firestore Indexes Create Karo

Firebase Console → Firestore → **Indexes** tab → `firestore.indexes.json` file se indexes banao

Ya `firebase deploy --only firestore:indexes` command use karo.

---

## 📱 URLs & Routes

| URL | Description |
|---|---|
| `/` | Home page |
| `/admin` | Super Admin Panel |
| `/saloon/:saloonId` | Customer Booking Page |
| `/saloon/:saloonId/owner` | Owner Dashboard |

**Example**:
- Booking: `https://yourapp.vercel.app/saloon/ahmed-salon`
- Owner: `https://yourapp.vercel.app/saloon/ahmed-salon/owner`

---

## 👑 Super Admin Usage

1. `/admin` pe jao
2. Password dalo (`.env` mein `VITE_SUPER_ADMIN_PASSWORD`)
3. **"+ Add Saloon"** se naya saloon add karo
4. Har saloon ka unique link generate hoga
5. Owner ko unka link aur credentials share karo

---

## 💈 Owner Dashboard Usage

1. `/saloon/[saloon-id]/owner` pe jao
2. Email + password se login karo
3. **Tokens Tab**: Queue manage karo (Present ✅, Skip ⏭, Call 📞, Next ▶)
4. **Settings Tab**: Saloon info, timing, services, QR Card
5. **Holidays Tab**: Band dates set karo
6. **Reports Tab**: Last 3 din ki stats

---

## 🎫 Customer Booking Flow

1. `/saloon/[saloon-id]` pe jao
2. Naam + phone number dalo
3. Token number milega (live queue position ke saath)
4. 10 min pehle browser notification milegi
5. "I'm Running Late" → queue mein last pe chala jaao
6. "Cancel" → token cancel karo

---

## ⚙️ Automatic System

| Time/Event | Action |
|---|---|
| 30 min before opening | Booking page auto-open |
| Closing time | Booking page auto-close |
| Midnight 12:00 AM | Token counter reset (#1 se) |
| Owner skips | Customer ko notification |
| 10 min remaining | Auto browser notification |

---

## 🔧 Development

```bash
npm run dev      # Local development
npm run build    # Production build
npm run preview  # Preview build locally
```

---

## 📝 Environment Variables Reference

```env
# Firebase (required)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# App Config (required)
VITE_SUPER_ADMIN_PASSWORD=  # Super admin login password
```

---

## 🆘 Troubleshooting

**"Firebase not initialized" error**
→ `.env` file check karo, sab values sahi hain?

**Vercel pe blank page**
→ `vercel.json` check karo, rewrites honi chahiyein

**Firestore permission denied**
→ Firestore Rules mein "test mode" select karo ya rules update karo

**QR Card download nahi ho raha**
→ Browser mein popups allow karo

---

## 📄 License

MIT — Free to use and modify.
