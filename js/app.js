/* ══════════════════════════════════════════════════════════════
   CrypDash — app.js
   Auto-guest · Auth modal · Watchlist (auth required) · Responsive
══════════════════════════════════════════════════════════════ */
'use strict';

// ── Constants ────────────────────────────────────────────────
const API_URL      = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false';
const USERS_KEY    = 'crypdash_users';
const SESSION_KEY  = 'crypdash_session';
const WATCH_PREFIX = 'crypdash_wl_';
const ACCENT       = '#ff3344';

const DEMO_ACCOUNT = { id: 'demo', name: 'Demo User', email: 'demo@crypdash.com', password: 'demo1234' };

// ── State ────────────────────────────────────────────────────
let marketData        = [];
let watchlist         = [];
let mainChartInstance = null;
let activeCoin        = null;
let activeTf          = '1W';
let currentUser       = null;   // { id, name, email } or null (= guest)
let isGuest           = true;

// ════════════════════════════════════════════════════════════
// MOCK FALLBACK DATA
// ════════════════════════════════════════════════════════════
const MOCK = [
    { id:'bitcoin',       symbol:'btc',  name:'Bitcoin',   image:'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',             current_price:71334,    price_change_percentage_24h: 0.12, total_volume:40_950_000_000, market_cap:1_430_000_000_000 },
    { id:'ethereum',      symbol:'eth',  name:'Ethereum',  image:'https://assets.coingecko.com/coins/images/279/large/ethereum.png',           current_price:3812,     price_change_percentage_24h:-0.85, total_volume:17_200_000_000, market_cap:  458_000_000_000 },
    { id:'tether',        symbol:'usdt', name:'Tether',    image:'https://assets.coingecko.com/coins/images/325/large/Tether.png',             current_price:1.00,     price_change_percentage_24h: 0.01, total_volume:52_000_000_000, market_cap:  110_000_000_000 },
    { id:'binancecoin',   symbol:'bnb',  name:'BNB',       image:'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',       current_price:608,      price_change_percentage_24h: 1.30, total_volume: 1_850_000_000, market_cap:   93_000_000_000 },
    { id:'solana',        symbol:'sol',  name:'Solana',    image:'https://assets.coingecko.com/coins/images/4128/large/solana.png',            current_price:183,      price_change_percentage_24h: 3.20, total_volume: 5_100_000_000, market_cap:   81_000_000_000 },
    { id:'ripple',        symbol:'xrp',  name:'XRP',       image:'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',current_price:0.64,     price_change_percentage_24h:-0.40, total_volume: 2_100_000_000, market_cap:   36_000_000_000 },
    { id:'usdc',          symbol:'usdc', name:'USDC',      image:'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',     current_price:1.00,     price_change_percentage_24h: 0.00, total_volume: 5_200_000_000, market_cap:   35_000_000_000 },
    { id:'cardano',       symbol:'ada',  name:'Cardano',   image:'https://assets.coingecko.com/coins/images/975/large/cardano.png',            current_price:0.61,     price_change_percentage_24h: 1.50, total_volume:   720_000_000, market_cap:   22_000_000_000 },
    { id:'avalanche-2',   symbol:'avax', name:'Avalanche', image:'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png', current_price:48, price_change_percentage_24h:-2.10, total_volume:950_000_000, market_cap:19_500_000_000 },
    { id:'dogecoin',      symbol:'doge', name:'Dogecoin',  image:'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',             current_price:0.17,     price_change_percentage_24h: 7.80, total_volume: 3_100_000_000, market_cap:   24_000_000_000 },
    { id:'polkadot',      symbol:'dot',  name:'Polkadot',  image:'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',         current_price:9.40,     price_change_percentage_24h: 1.90, total_volume:   380_000_000, market_cap:   13_000_000_000 },
    { id:'chainlink',     symbol:'link', name:'Chainlink', image:'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png', current_price:19.80,    price_change_percentage_24h:-0.60, total_volume:   490_000_000, market_cap:   11_500_000_000 },
    { id:'matic-network', symbol:'matic',name:'Polygon',   image:'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',  current_price:0.97,     price_change_percentage_24h: 0.50, total_volume:   310_000_000, market_cap:    9_500_000_000 },
    { id:'shiba-inu',     symbol:'shib', name:'Shiba Inu', image:'https://assets.coingecko.com/coins/images/11939/large/shiba.png',            current_price:0.0000278,price_change_percentage_24h:-3.10, total_volume: 1_100_000_000, market_cap:   16_000_000_000 },
    { id:'litecoin',      symbol:'ltc',  name:'Litecoin',  image:'https://assets.coingecko.com/coins/images/2/large/litecoin.png',             current_price:91,       price_change_percentage_24h: 0.90, total_volume:   410_000_000, market_cap:    6_800_000_000 },
];

// ════════════════════════════════════════════════════════════
// UTILITY
// ════════════════════════════════════════════════════════════
function toNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function getCoinImage(coin) {
    return coin?.image || 'assets/logo.svg';
}

function getCoinChangePct(coin) {
    return toNumber(coin?.price_change_percentage_24h, 0);
}

function normalizeCoin(coin = {}, idx = 0) {
    return {
        ...coin,
        id: coin.id || `coin-${idx}`,
        symbol: (coin.symbol || '---').toLowerCase(),
        name: coin.name || 'Unknown Coin',
        image: getCoinImage(coin),
        current_price: toNumber(coin.current_price, 0),
        price_change_percentage_24h: getCoinChangePct(coin),
        total_volume: toNumber(coin.total_volume, 0),
        market_cap: toNumber(coin.market_cap, 0),
    };
}

function normalizeMarketData(coins = []) {
    return coins.filter(Boolean).map(normalizeCoin);
}

function fmtCurrency(v) {
    v = toNumber(v, 0);
    if (v >= 1e12) return '$' + (v/1e12).toFixed(2) + 'T';
    if (v >= 1e9)  return '$' + (v/1e9).toFixed(2)  + 'B';
    if (v >= 1e6)  return '$' + (v/1e6).toFixed(2)  + 'M';
    return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(v);
}

function fmtPrice(v) {
    if (v === undefined || v === null) return '—';
    v = toNumber(v, 0);
    if (v < 0.001)  return '$' + v.toFixed(8);
    if (v < 1)      return '$' + v.toFixed(6);
    return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:2 }).format(v);
}

function pctBadge(v, justify='end') {
    v = toNumber(v, 0);
    const up   = v >= 0;
    const cls  = up ? 'pct-up' : 'pct-down';
    const icon = up ? 'ph-trend-up' : 'ph-trend-down';
    return `<span class="${cls}" style="justify-content:${justify}">
                <i class="ph-bold ${icon}"></i>
                ${up?'+':''}${v.toFixed(2)}%
            </span>`;
}

function initials(name='') {
    return name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() || 'U';
}

function debounce(fn, wait=300) {
    let t;
    return function(...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

// Toast notification
let toastTimer;
function showToast(msg, duration=3000) {
    const el = document.getElementById('toast');
    if (!el) return;   // guard: missing element must never throw and kill callers
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

// ════════════════════════════════════════════════════════════
// AUTH — localStorage user store
// ════════════════════════════════════════════════════════════
function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch { return []; }
}
function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function switchTab(tab) {
    const isLogin = tab === 'login';
    document.getElementById('tabLogin').classList.toggle('active',  isLogin);
    document.getElementById('tabSignup').classList.toggle('active', !isLogin);
    document.getElementById('loginForm').style.display  = isLogin ? 'block' : 'none';
    document.getElementById('signupForm').style.display = isLogin ? 'none'  : 'block';
    document.getElementById('loginError').textContent   = '';
    document.getElementById('signupError').textContent  = '';
}

function handleLogin(e) {
    e.preventDefault();
    const email    = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const errEl    = document.getElementById('loginError');

    if (email === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password) {
        loginSuccess(DEMO_ACCOUNT);
        return;
    }
    const users = getUsers();
    const user  = users.find(u => u.email === email && u.password === password);
    if (user) {
        loginSuccess(user);
    } else {
        errEl.textContent = 'Invalid email or password.';
    }
}

function handleSignup(e) {
    e.preventDefault();
    const name     = document.getElementById('signupName').value.trim();
    const email    = document.getElementById('signupEmail').value.trim().toLowerCase();
    const password = document.getElementById('signupPassword').value;
    const errEl    = document.getElementById('signupError');

    if (!name || !email || !password) { errEl.textContent = 'Please fill in all fields.'; return; }
    if (password.length < 8) { errEl.textContent = 'Password must be at least 8 characters.'; return; }

    const users = getUsers();
    if (email === DEMO_ACCOUNT.email || users.find(u => u.email === email)) {
        errEl.textContent = 'An account with that email already exists.';
        return;
    }
    const newUser = { id: 'u_' + Date.now(), name, email, password };
    users.push(newUser);
    saveUsers(users);
    loginSuccess(newUser);
}

function loginSuccess(user) {
    currentUser = { id: user.id, name: user.name, email: user.email };
    isGuest     = false;
    localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));

    // Merge any temp guest watchlist? (optional — we discard it on login)
    watchlist = loadWatchlist();

    closeAuth();
    updateHeaderUI();
    hydrateDashboard(watchlist[0] || activeCoin?.id);
    showToast(`Welcome back, ${user.name.split(' ')[0]}! 👋`);
}

// Logout → return to guest mode (no auth overlay)
function handleLogout() {
    localStorage.removeItem(SESSION_KEY);
    currentUser = null;
    isGuest     = true;
    watchlist   = [];
    document.getElementById('userDropdown').classList.remove('open');
    updateHeaderUI();
    hydrateDashboard(marketData[0]?.id);
    showToast('Signed out. Browsing as guest.');
}

// ── showAuth: always a modal overlay (app remains mounted) ──
function showAuth(fromWatchlist = false) {
    const overlay = document.getElementById('authOverlay');
    const prompt  = document.getElementById('authWatchlistPrompt');

    // Show/hide the watchlist prompt
    prompt.style.display = fromWatchlist ? 'flex' : 'none';

    overlay.style.display = 'flex';
    switchTab('login');
    // Clear form fields
    ['loginEmail','loginPassword','signupName','signupEmail','signupPassword']
        .forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
    document.getElementById('loginError').textContent  = '';
    document.getElementById('signupError').textContent = '';
}

function closeAuth() {
    document.getElementById('authOverlay').style.display = 'none';
}

// Click on overlay backdrop (not on card) → close
function handleOverlayClick(e) {
    if (e.target === document.getElementById('authOverlay')) {
        closeAuth();
    }
}

// ── tryAutoLogin: session found → log in, else → guest ──
function tryAutoLogin() {
    try {
        const stored = localStorage.getItem(SESSION_KEY);
        if (stored) {
            const user = JSON.parse(stored);
            currentUser = user;
            isGuest     = false;
            watchlist   = loadWatchlist();
            updateHeaderUI();
            return;
        }
    } catch { /**/ }
    // Default: guest
    currentUser = null;
    isGuest     = true;
    watchlist   = [];
    updateHeaderUI();
}

// ── Update header to reflect auth state ──
function updateHeaderUI() {
    const name  = currentUser ? currentUser.name  : 'Guest';
    const email = currentUser ? currentUser.email : '—';

    document.getElementById('userDisplayName').textContent = name;
    document.getElementById('userRoleLabel').textContent   = isGuest ? 'Browsing' : 'Premium User';
    document.getElementById('dropdownName').textContent    = name;
    document.getElementById('dropdownEmail').textContent   = email;

    const avatarEl = document.getElementById('userAvatar');
    avatarEl.textContent = isGuest ? '?' : initials(name);
    avatarEl.className   = 'avatar' + (isGuest ? ' guest-avatar' : '');

    // Toggle sign-in / sign-out in dropdown
    document.getElementById('dropdownSignIn').style.display  = isGuest ? 'flex' : 'none';
    document.getElementById('dropdownSignOut').style.display = isGuest ? 'none' : 'flex';

    // Header sign-in button (only guest, small screens)
    document.getElementById('headerSignInBtn').style.display = isGuest ? 'flex' : 'none';

    // Guest banner
    document.getElementById('guestBanner').style.display = isGuest ? 'flex' : 'none';

    // Watchlist guest CTA
    const wlCta = document.getElementById('watchlistGuestCta');
    if (wlCta) wlCta.style.display = isGuest ? 'flex' : 'none';
}

// ════════════════════════════════════════════════════════════
// MOBILE SIDEBAR
// ════════════════════════════════════════════════════════════
function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileSidebarOverlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
}

function closeMobileSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('mobileSidebarOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

// ════════════════════════════════════════════════════════════
// MOBILE SEARCH
// ════════════════════════════════════════════════════════════
function toggleMobileSearch() {
    const bar = document.getElementById('mobileSearchBar');
    const isActive = bar.classList.toggle('active');
    if (isActive) {
        setTimeout(() => document.getElementById('mobileSearchInput').focus(), 100);
    } else {
        document.getElementById('mobileSearchResults').classList.add('hidden');
    }
}

// ════════════════════════════════════════════════════════════
// WATCHLIST  (per-user localStorage — guests cannot save)
// ════════════════════════════════════════════════════════════
function watchKey() {
    return WATCH_PREFIX + (currentUser ? currentUser.id : 'guest');
}
function loadWatchlist() {
    if (isGuest) return [];
    try { return JSON.parse(localStorage.getItem(watchKey())) || []; }
    catch { return []; }
}
function saveWatchlist() {
    if (isGuest) return;
    localStorage.setItem(watchKey(), JSON.stringify(watchlist));
}

function getActiveOrFallbackCoin(preferredCoinId = null) {
    if (marketData.length === 0) return null;

    const candidates = [
        preferredCoinId,
        activeCoin?.id,
        watchlist.find(id => marketData.some(coin => coin.id === id)),
        marketData[0]?.id,
    ].filter(Boolean);

    for (const coinId of candidates) {
        const match = marketData.find(coin => coin.id === coinId);
        if (match) return match;
    }
    return marketData[0] || null;
}

function renderPortfolioValue() {
    const valueEl   = document.getElementById('portfolioValue');
    const summaryEl = document.getElementById('portfolioSummary');
    if (!valueEl || !summaryEl) return;

    if (isGuest) {
        valueEl.innerHTML = '$0<span class="portfolio-cents">.00</span>';
        summaryEl.textContent = 'Sign in to track your saved coins.';
        return;
    }

    const watchedCoins = marketData.filter(coin => watchlist.includes(coin.id));
    const totalValue   = watchedCoins.reduce((sum, coin) => sum + toNumber(coin.current_price, 0), 0);
    const formatted    = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(totalValue);
    const [whole, cents = '00'] = formatted.split('.');

    valueEl.innerHTML = `${whole}<span class="portfolio-cents">.${cents}</span>`;
    summaryEl.textContent = watchedCoins.length
        ? `${watchedCoins.length} saved coin${watchedCoins.length === 1 ? '' : 's'} in your watchlist.`
        : 'Add coins from the market table to build your portfolio.';
}

function hydrateDashboard(preferredCoinId = null) {
    renderMarketTable();
    renderWatchlist();
    renderPortfolioValue();

    const nextCoin = getActiveOrFallbackCoin(preferredCoinId);
    if (nextCoin) updateMainChartUI(nextCoin);
}

function toggleWatchlist(coinId) {
    // Guests must sign in first
    if (isGuest) {
        showAuth(true);  // show with watchlist prompt
        return;
    }
    const idx = watchlist.indexOf(coinId);
    if (idx > -1) {
        watchlist.splice(idx, 1);
        const coin = marketData.find(c => c.id === coinId);
        showToast(`Removed ${coin ? coin.name : coinId} from watchlist`);
    } else {
        watchlist.push(coinId);
        const coin = marketData.find(c => c.id === coinId);
        showToast(`Added ${coin ? coin.name : coinId} to watchlist ⭐`);
    }
    saveWatchlist();
    hydrateDashboard(idx > -1 ? activeCoin?.id : coinId);
}

// ════════════════════════════════════════════════════════════
// CHART
// ════════════════════════════════════════════════════════════
function mockHistory(currentPrice, points, volFactor=0.018) {
    const data = [];
    let price  = currentPrice * (1 - (Math.random() * 0.06 - 0.01));
    for (let i = 0; i < points - 1; i++) {
        price += (Math.random() - 0.47) * price * volFactor;
        data.push(Math.max(price, 0.000001));
    }
    data.push(currentPrice);
    return data;
}

function tfConfig(tf) {
    switch(tf) {
        case '1H': return { labels: Array.from({length:60}, (_,i)=>`${i}m`),      vol:0.004 };
        case '1D': return { labels: Array.from({length:24}, (_,i)=>`${i}:00`),     vol:0.010 };
        case '1W': return { labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],      vol:0.018 };
        case '1M': return { labels: Array.from({length:30}, (_,i)=>`D${i+1}`),     vol:0.025 };
        case '1Y': return { labels:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], vol:0.045 };
        default:   return { labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],      vol:0.018 };
    }
}

function initChart() {
    const ctx = document.getElementById('mainChart').getContext('2d');

    // Plugin: recreate gradient on every draw so it always matches the live
    // canvas dimensions. A gradient created before Chart.js resizes the canvas
    // becomes stale (the context state is reset when canvas.width/height are
    // set), which makes the fill render as transparent and can suppress the
    // line in some browsers.
    const dynamicGradient = {
        id: 'dynamicGradient',
        beforeDraw(chart) {
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return;
            const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(255,51,68,0.30)');
            gradient.addColorStop(1, 'rgba(255,51,68,0.00)');
            chart.data.datasets[0].backgroundColor = gradient;
        }
    };

    mainChartInstance = new Chart(ctx, {
        type: 'line',
        plugins: [dynamicGradient],
        data: {
            labels: [],
            datasets: [{
                label: 'Price',
                data: [],
                borderColor: ACCENT,
                backgroundColor: 'transparent', // replaced each draw by plugin
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: ACCENT,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2,
                fill: true,
                tension: 0.4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode:'index', intersect:false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(14,17,26,0.95)',
                    titleColor: 'rgba(255,255,255,0.4)',
                    bodyColor: '#ffffff',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: { label: ctx => 'Price: ' + fmtPrice(ctx.parsed.y) }
                }
            },
            scales: {
                x: {
                    grid:   { display:false },
                    ticks:  { display:false },
                    border: { display:false },
                },
                y: {
                    position: 'right',
                    grid: { color:'rgba(255,255,255,0.04)', borderDash:[5,5] },
                    border: { display:false },
                    ticks: {
                        color: 'rgba(255,255,255,0.3)',
                        font: { size:11 },
                        callback: v => fmtPrice(v),
                    }
                }
            }
        }
    });
}

function updateChartData(coin, tf) {
    if (!mainChartInstance || !coin) return;
    const cfg  = tfConfig(tf);
    const data = mockHistory(coin.current_price, cfg.labels.length, cfg.vol);
    mainChartInstance.data.labels              = cfg.labels;
    mainChartInstance.data.datasets[0].data   = data;
    mainChartInstance.update('active');
}

// ════════════════════════════════════════════════════════════
// MAIN CHART HEADER
// ════════════════════════════════════════════════════════════
function updateMainChartUI(coin) {
    if (!coin) return;
    activeCoin = coin;
    document.getElementById('mainChartName').textContent  = coin.name;
    document.getElementById('mainChartSymbol').textContent = coin.symbol.toUpperCase();
    document.getElementById('mainChartIcon').src          = getCoinImage(coin);
    document.getElementById('mainChartPrice').textContent = fmtPrice(coin.current_price);

    const pct = getCoinChangePct(coin);
    const up  = pct >= 0;
    const el  = document.getElementById('mainChartChange');
    el.innerHTML = `
        <span class="${up?'pct-up':'pct-down'}" style="font-weight:700">
            <i class="ph-bold ${up?'ph-trend-up':'ph-trend-down'}"></i>
            ${Math.abs(pct).toFixed(2)}%
        </span>
        <span style="color:rgba(255,255,255,0.35);margin-left:8px;font-weight:400;font-size:0.8rem">Past 24h</span>
    `;
    updateChartData(coin, activeTf);
}

// ════════════════════════════════════════════════════════════
// MARKET TABLE
// ════════════════════════════════════════════════════════════
function renderMarketTable() {
    const tbody = document.getElementById('marketTableBody');
    tbody.innerHTML = '';

    if (marketData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="table-loading">
                    <i class="ph ph-warning-circle" style="font-size:1.5rem;color:var(--accent)"></i>
                    <p>No market data available right now.</p>
                </td>
            </tr>
        `;
        return;
    }

    marketData.forEach((coin, idx) => {
        const watched = !isGuest && watchlist.includes(coin.id);
        const tr      = document.createElement('tr');
        tr.style.animationDelay = `${idx * 25}ms`;

        // For guests, star shows a lock icon on hover
        const starClass = isGuest
            ? 'watchlist-btn guest-locked'
            : `watchlist-btn${watched?' is-watched':''}`;
        const starIcon  = watched
            ? 'ph-fill ph-star'
            : (isGuest ? 'ph ph-lock' : 'ph ph-star');
        const starTitle = isGuest
            ? 'Sign in to save to watchlist'
            : (watched ? 'Remove from watchlist' : 'Add to watchlist');

        tr.innerHTML = `
            <td style="text-align:center">
                <button class="${starClass}" data-id="${coin.id}" title="${starTitle}">
                    <i class="${starIcon}"></i>
                </button>
            </td>
            <td>
                <div style="display:flex;align-items:center;gap:12px">
                    <span style="color:rgba(255,255,255,0.2);font-size:0.75rem;width:20px;text-align:right">${idx+1}</span>
                    <img src="${getCoinImage(coin)}" alt="${coin.name}" style="width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,255,255,0.08)">
                    <div>
                        <div class="coin-name-text">${coin.name}</div>
                        <div class="coin-sym-text">${coin.symbol}</div>
                    </div>
                </div>
            </td>
            <td style="text-align:right;font-weight:600;color:#fff">${fmtPrice(coin.current_price)}</td>
            <td style="text-align:right">${pctBadge(getCoinChangePct(coin))}</td>
            <td style="text-align:right;color:rgba(255,255,255,0.4)" class="col-hide-sm">${fmtCurrency(coin.total_volume)}</td>
            <td style="text-align:right;color:rgba(255,255,255,0.4)" class="col-hide-sm">${fmtCurrency(coin.market_cap)}</td>
        `;

        tr.addEventListener('click', e => {
            if (!e.target.closest('.watchlist-btn')) {
                updateMainChartUI(coin);
                document.getElementById('mainScrollArea').scrollTo({top:0, behavior:'smooth'});
                // Close mobile sidebar if open
                closeMobileSidebar();
            }
        });

        tbody.appendChild(tr);
    });

    document.querySelectorAll('.watchlist-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            toggleWatchlist(btn.getAttribute('data-id'));
        });
    });
}

// ════════════════════════════════════════════════════════════
// WATCHLIST PANEL
// ════════════════════════════════════════════════════════════
function renderWatchlist() {
    const container = document.getElementById('watchlistContainer');
    const emptyMsg  = document.getElementById('emptyWatchlistMsg');

    // Clear existing items (keep emptyMsg)
    [...container.children].forEach(c => { if (c !== emptyMsg) c.remove(); });

    if (isGuest) {
        emptyMsg.style.display = 'none';
        return;
    }

    const watched = marketData.filter(c => watchlist.includes(c.id));

    if (watched.length === 0) {
        emptyMsg.style.display = 'flex';
        return;
    }
    emptyMsg.style.display = 'none';

    watched.forEach(coin => {
        const pct = getCoinChangePct(coin);
        const up  = pct >= 0;
        const div = document.createElement('div');
        div.className = 'watchlist-item';
        div.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px">
                <img src="${getCoinImage(coin)}" alt="${coin.name}" style="width:28px;height:28px;border-radius:50%;border:1px solid rgba(255,255,255,0.08)">
                <div>
                    <div class="wi-sym">${coin.symbol.toUpperCase()}</div>
                    <div class="wi-name">${coin.name}</div>
                </div>
            </div>
            <div>
                <div class="wi-price">${fmtPrice(coin.current_price)}</div>
                <div class="${up?'badge-up':'badge-down'}" style="justify-content:flex-end;margin-top:4px">
                    <i class="ph-bold ${up?'ph-trend-up':'ph-trend-down'}"></i>
                    ${up?'+':''}${pct.toFixed(2)}%
                </div>
            </div>
        `;
        div.addEventListener('click', () => {
            updateMainChartUI(coin);
            document.getElementById('mainScrollArea').scrollTo({top:0, behavior:'smooth'});
        });
        container.appendChild(div);
    });
}

// ════════════════════════════════════════════════════════════
// SEARCH  (debounced — works for both desktop + mobile inputs)
// ════════════════════════════════════════════════════════════
function renderSearchResults(query, dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    const q        = query.trim().toLowerCase();

    if (!q) { dropdown.classList.add('hidden'); return; }

    const hits = marketData
        .filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q))
        .slice(0, 6);

    if (hits.length === 0) {
        dropdown.innerHTML = `<div class="search-empty">No results for "${query}"</div>`;
        dropdown.classList.remove('hidden');
        return;
    }

    dropdown.innerHTML = '';
    hits.forEach(coin => {
        const pct = getCoinChangePct(coin);
        const up  = pct >= 0;
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.innerHTML = `
            <div class="sri-left">
                <img src="${getCoinImage(coin)}" alt="${coin.name}" style="width:26px;height:26px;border-radius:50%">
                <div>
                    <span class="sri-name">${coin.name}</span>
                    <span class="sri-sym">${coin.symbol}</span>
                </div>
            </div>
            <div class="sri-right">
                <div class="sri-price">${fmtPrice(coin.current_price)}</div>
                <div class="${up?'badge-up':'badge-down'}" style="justify-content:flex-end;margin-top:2px">
                    ${up?'+':''}${pct.toFixed(2)}%
                </div>
            </div>
        `;
        div.addEventListener('click', () => {
            updateMainChartUI(coin);
            document.getElementById('searchInput').value = '';
            document.getElementById('mobileSearchInput').value = '';
            dropdown.classList.add('hidden');
            document.getElementById('mainScrollArea').scrollTo({top:0, behavior:'smooth'});
            // Close mobile search bar
            document.getElementById('mobileSearchBar').classList.remove('active');
        });
        dropdown.appendChild(div);
    });

    dropdown.classList.remove('hidden');
}

const debouncedSearch       = debounce(e => renderSearchResults(e.target.value, 'searchResults'), 300);
const debouncedMobileSearch = debounce(e => renderSearchResults(e.target.value, 'mobileSearchResults'), 300);

function initSearch() {
    // Desktop search
    const desktopInput = document.getElementById('searchInput');
    desktopInput.addEventListener('input', debouncedSearch);
    desktopInput.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.getElementById('searchResults').classList.add('hidden');
            desktopInput.blur();
        }
    });

    // Mobile search
    const mobileInput = document.getElementById('mobileSearchInput');
    mobileInput.addEventListener('input', debouncedMobileSearch);
    mobileInput.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.getElementById('mobileSearchResults').classList.add('hidden');
            mobileInput.blur();
        }
    });
}

// ════════════════════════════════════════════════════════════
// TIMEFRAME BUTTONS
// ════════════════════════════════════════════════════════════
function initTimeframeButtons() {
    document.querySelectorAll('.tf-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeTf = btn.dataset.tf;
            if (activeCoin) updateChartData(activeCoin, activeTf);
        });
    });
}

// ════════════════════════════════════════════════════════════
// USER DROPDOWN
// ════════════════════════════════════════════════════════════
function toggleUserDropdown() {
    document.getElementById('userDropdown').classList.toggle('open');
}

// ════════════════════════════════════════════════════════════
// CLICK-OUTSIDE handlers
// ════════════════════════════════════════════════════════════
function initClickOutside() {
    document.addEventListener('click', e => {
        if (!e.target.closest('#searchContainer'))
            document.getElementById('searchResults').classList.add('hidden');

        if (!e.target.closest('.user-menu-wrap'))
            document.getElementById('userDropdown').classList.remove('open');
    });
}

// ════════════════════════════════════════════════════════════
// DATA FETCH
// ════════════════════════════════════════════════════════════
async function fetchMarketData() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    try {
        const res = await fetch(API_URL, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!Array.isArray(json) || json.length === 0) throw new Error('Empty response');
        marketData = normalizeMarketData(json);
        console.log(`✅ Live data: ${marketData.length} coins from CoinGecko`);
    } catch (err) {
        console.warn('⚠️ CoinGecko unavailable, using mock data.', err.message);
        marketData = normalizeMarketData(MOCK);
    } finally {
        clearTimeout(timeoutId);
    }

    hydrateDashboard(activeCoin?.id);
}

// ════════════════════════════════════════════════════════════
// BOOT
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    // Expose to HTML onclick attributes
    window.switchTab           = switchTab;
    window.toggleWatchlist     = toggleWatchlist; 
    window.updateMainChartUI   = updateMainChartUI;
    window.handleLogin         = handleLogin;
    window.handleSignup        = handleSignup;
    window.handleLogout        = handleLogout;
    window.showAuth            = showAuth;
    window.closeAuth           = closeAuth;
    window.handleOverlayClick  = handleOverlayClick;
    window.toggleUserDropdown  = toggleUserDropdown;
    window.toggleMobileSidebar = toggleMobileSidebar;
    window.closeMobileSidebar  = closeMobileSidebar;
    window.toggleMobileSearch  = toggleMobileSearch;

    // Initialise dashboard components once
    initChart();
    initTimeframeButtons();
    initSearch();
    initClickOutside();

    // Try to restore session; otherwise auto-guest
    tryAutoLogin();

    // Paint immediately so the dashboard is never blank while live data loads
    marketData = normalizeMarketData(MOCK);
    hydrateDashboard();

    // Refresh with live data in the background
    fetchMarketData();
});
