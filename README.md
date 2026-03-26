# CrypDash — Crypto Dashboard

A dark-themed, responsive cryptocurrency dashboard that displays live market data, an interactive price chart, per-user watchlists, and a local auth system — all in a single HTML/CSS/JS stack with no build step required.

---

## Project Structure

```
crypdash/
├── index.html      # App shell, layout, auth modal, market table markup
├── css/
│   └── style.css   # Full design system — variables, glass cards, auth, responsive
└── js/
    └── app.js      # All runtime logic — auth, chart, watchlist, search, data fetch
```

> **Tip:** The project can also be shipped as a single self-contained `crypdash.html` with CSS and JS inlined, which works without any folder structure or local server.

---

## Features

### Market Data
- Fetches the top 50 coins by market cap from the [CoinGecko public API](https://www.coingecko.com/en/api) (`/coins/markets`).
- Automatically falls back to built-in mock data (15 coins) if the API is unavailable or rate-limited.
- Displays name, symbol, price, 24h change, 24h volume, and market cap in a sortable-ready table.

### Price Chart
- Interactive Chart.js line chart with a red gradient fill.
- Defaults to Bitcoin on load; updates when any row or watchlist item is clicked.
- Five timeframe buttons: **1H · 1D · 1W · 1M · 1Y** — each generates mock historical data at the appropriate volatility and label density.
- Gradient is recreated on every render via a `beforeDraw` plugin to stay correct across responsive resizes.

### Watchlist
- Logged-in users can star/unstar any coin from the market table.
- Watchlist is persisted to `localStorage` keyed per user (`crypdash_wl_<userId>`).
- Guest users see a lock icon on the star and are prompted to sign in.
- Watchlist panel shows coin logo, symbol, name, current price, and 24h badge; clicking any item opens it in the chart.

### Authentication
- Client-side only — users are stored in `localStorage` (`crypdash_users`).
- Session is persisted in `localStorage` (`crypdash_session`) and restored on page load.
- Supports **Sign Up** (name, email, password ≥ 8 chars) and **Sign In**.
- A built-in demo account is always available: `demo@crypdash.com` / `demo1234`.
- Auth is a dismissible modal overlay — the app remains fully visible and browsable as a guest.

### Search
- Debounced (300 ms) live search across coin name and symbol.
- Desktop: inline dropdown in the header search bar.
- Mobile: toggled full-width search bar below the header with its own dropdown.

### Responsive Layout
- **≥ 1024 px** — full sidebar + header username visible.
- **768 – 1023 px** — narrower sidebar, condensed search.
- **< 768 px** — off-canvas sidebar (hamburger toggle), mobile search bar, volume/market-cap columns hidden.

### Toast Notifications
- Lightweight slide-up toast confirms watchlist additions and removals, and login/logout events.

---

## Getting Started

No build tools or dependencies to install.

**Option A — separate files (recommended for development)**

```
project/
├── index.html
├── css/style.css
└── js/app.js
```

Open `index.html` via a local server (e.g. VS Code Live Server, or `npx serve .`). Opening directly as `file://` may block the CoinGecko API call due to browser CORS/mixed-content policies; the app will fall back to mock data automatically.

**Option B — single file**

Use the provided `crypdash.html` (CSS and JS inlined). Open directly in any browser — no server needed, mock data always available.

---

## Configuration

All tunable constants are at the top of `app.js`:

| Constant | Default | Description |
|---|---|---|
| `API_URL` | CoinGecko `/coins/markets` | Live data endpoint |
| `USERS_KEY` | `crypdash_users` | localStorage key for registered users |
| `SESSION_KEY` | `crypdash_session` | localStorage key for active session |
| `WATCH_PREFIX` | `crypdash_wl_` | Prefix for per-user watchlist keys |
| `ACCENT` | `#ff3344` | Chart line and gradient colour |
| `DEMO_ACCOUNT` | `demo@crypdash.com` | Hard-coded demo credentials |

---

## Tech Stack

| Layer | Library / Approach |
|---|---|
| Styling | Custom CSS with CSS variables + [Tailwind CDN](https://tailwindcss.com) utility classes |
| Icons | [Phosphor Icons](https://phosphoricons.com) (web CDN) |
| Chart | [Chart.js](https://www.chartjs.org) (CDN, latest) |
| Fonts | [Syne](https://fonts.google.com/specimen/Syne) (headings) + [DM Sans](https://fonts.google.com/specimen/DM+Sans) (body) via Google Fonts |
| Data | CoinGecko Free API — no API key required |
| Storage | Browser `localStorage` — no backend |

---

## Known Limitations

- **Auth is not secure** — passwords are stored in plain text in `localStorage`. This is intentional for a front-end demo; do not use in production without a real backend.
- **Chart data is mocked** — historical price series are randomly generated from the current price. Only the current price and 24h change are live.
- **CoinGecko rate limits** — the free tier allows ~10–30 requests/minute. Exceeding this returns a 429 and the app falls back to mock data.
- **No data refresh** — prices are fetched once on load and not polled. Reload the page for updated prices.

---

## Customisation

**Brand colours** — edit the two CSS variables in `style.css`:
```css
:root {
    --accent:     #ff3344;   /* primary — chart, active states, buttons */
    --accent-alt: #ccff00;   /* secondary — watchlist stars, highlights */
}
```

**Mock coins** — add or edit entries in the `MOCK` array in `app.js`. Each entry needs: `id`, `symbol`, `name`, `image`, `current_price`, `price_change_percentage_24h`, `total_volume`, `market_cap`.

**Timeframes** — extend the `tfConfig()` function in `app.js` to add new timeframe buttons (also add the corresponding `<button class="tf-btn">` in `index.html`).