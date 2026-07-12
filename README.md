# CrypDash

CrypDash is a cryptocurrency market dashboard with live CoinGecko snapshots, watchlists, and two persistence modes:

- `Cloud sync mode`: Firebase Authentication + Cloud Firestore power user accounts and synced watchlists.
- `Local preview mode`: if Firebase is still unconfigured, the app falls back to browser-only auth/watchlists so you can develop and demo for free.

The project is designed to deploy as a static site on Cloudflare Pages with no build step.

[Live demo](https://real-time-financial-dashboard.vercel.app) · [Repository](https://github.com/Elijah-cod/Real-Time-Financial-Dashboard)

## Project structure

```text
.
├── assets/
│   └── logo.svg
├── css/
│   └── style.css
├── firebase/
│   └── firestore.rules
├── js/
│   ├── app.js
│   ├── firebase-config.js
│   └── firebase-service.js
└── index.html
```

## Runtime behavior

- ES modules separate application logic, Firebase configuration, and Firebase services.
- The dashboard renders fallback market data immediately, then attempts to refresh the current market snapshot from CoinGecko.
- Firebase mode uses email/password authentication and Firestore-backed watchlists.
- Preview mode stores demo accounts and watchlists in `localStorage`.

## Features

### Market dashboard

- Fetches the top 50 coins by market cap from the CoinGecko public API.
- Falls back to built-in mock data if the API is unavailable or rate-limited.
- Shows price, 24h change, 24h volume, market cap, and a focus chart.

### Auth and watchlists

- `Firebase mode`: email/password sign-up, sign-in, sign-out, and cloud-synced watchlists.
- `Local preview mode`: demo-friendly account storage in `localStorage`.
- Watchlist-driven portfolio summary on the right-hand panel.

### Deployment target

- Static HTML/CSS/JS app.
- No bundler required.
- Friendly for Cloudflare Pages free hosting.

## Local development

Serve the project from a local web server:

```bash
python3 -m http.server 4173
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173).

## Enable Firebase cloud sync

### 1. Create a Firebase project

Create a Firebase project and register a web app in the Firebase console.

Official setup docs:
- [Add Firebase to your JavaScript project](https://firebase.google.com/docs/web/setup)
- [Get started with Firebase Authentication on websites](https://firebase.google.com/docs/auth/web/start)

### 2. Enable Firebase Authentication

In Firebase Authentication:

- Enable `Email/Password`

Official docs:
- [Authenticate with Firebase using Password-Based Accounts](https://firebase.google.com/docs/auth/web/password-auth)

### 3. Create Firestore

Create a Cloud Firestore database in production or test mode, then apply the rules from [firebase/firestore.rules](firebase/firestore.rules).

Official docs:
- [Add data to Cloud Firestore](https://firebase.google.com/docs/firestore/manage-data/add-data)

### 4. Paste your web config

Open `js/firebase-config.js` and replace the placeholder values:

```js
export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
  measurementId: 'YOUR_MEASUREMENT_ID',
};
```

If placeholders remain, CrypDash stays in local preview mode automatically.

## Deploy to Cloudflare Pages

This repo is already structured for Cloudflare Pages static hosting.

Use these settings:

- `Framework preset`: `None`
- `Build command`: leave blank
- `Build output directory`: `/`

Cloudflare Pages docs:
- [Cloudflare Pages overview](https://developers.cloudflare.com/pages/)
- [Cloudflare Pages free limits](https://pages.cloudflare.com/)

## Firebase data model

The app stores watchlists in Firestore like this:

```text
watchlists/{userId}
  coins: string[]
  displayName: string
  email: string
  updatedAt: timestamp
```

## Notes

- Firebase config values for web apps are project identifiers, not secrets.
- CoinGecko historical chart data is still mocked; only current market snapshot data is live.
- CoinGecko availability and rate limits can cause the dashboard to remain on its bundled fallback snapshot.
- CrypDash is a software demonstration and does not provide investment advice.
- If you want full production hardening later, the next step would be moving from CDN imports to a bundled setup like Vite.
