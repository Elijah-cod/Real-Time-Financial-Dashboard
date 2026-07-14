import {
    addCloudWatchCoin,
    createCloudAccount,
    firebaseEnabled,
    getSyncModeLabel,
    loadCloudWatchlist,
    removeCloudWatchCoin,
    signInCloudAccount,
    signOutCloudAccount,
    subscribeToAuthState,
} from './firebase-service.js';

const API_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=7d';
const SESSION_KEY = 'crypdash_session';
const WATCH_PREFIX = 'crypdash_wl_';
const USERS_KEY = 'crypdash_users';
const TX_PREFIX = 'crypdash_tx_';
const SETTINGS_KEY = 'crypdash_settings';
const PAGE_SIZE = 10;
const USING_FIREBASE = firebaseEnabled;

const MOCK = [
    { id:'bitcoin', symbol:'btc', name:'Bitcoin', image:'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', current_price:62642, price_change_percentage_24h:-0.80, total_volume:45_000_000_000, market_cap:1_240_000_000_000 },
    { id:'ethereum', symbol:'eth', name:'Ethereum', image:'https://assets.coingecko.com/coins/images/279/large/ethereum.png', current_price:3400, price_change_percentage_24h:1.80, total_volume:22_000_000_000, market_cap:410_000_000_000 },
    { id:'tether', symbol:'usdt', name:'Tether', image:'https://assets.coingecko.com/coins/images/325/large/Tether.png', current_price:1, price_change_percentage_24h:0.01, total_volume:52_000_000_000, market_cap:110_000_000_000 },
    { id:'binancecoin', symbol:'bnb', name:'BNB', image:'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', current_price:608, price_change_percentage_24h:1.30, total_volume:1_850_000_000, market_cap:93_000_000_000 },
    { id:'solana', symbol:'sol', name:'Solana', image:'https://assets.coingecko.com/coins/images/4128/large/solana.png', current_price:145, price_change_percentage_24h:6.10, total_volume:5_100_000_000, market_cap:65_000_000_000 },
    { id:'ripple', symbol:'xrp', name:'XRP', image:'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', current_price:0.64, price_change_percentage_24h:-5.30, total_volume:2_100_000_000, market_cap:36_000_000_000 },
    { id:'usdc', symbol:'usdc', name:'USDC', image:'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png', current_price:1, price_change_percentage_24h:0.00, total_volume:5_200_000_000, market_cap:35_000_000_000 },
    { id:'cardano', symbol:'ada', name:'Cardano', image:'https://assets.coingecko.com/coins/images/975/large/cardano.png', current_price:0.61, price_change_percentage_24h:1.50, total_volume:720_000_000, market_cap:22_000_000_000 },
    { id:'avalanche-2', symbol:'avax', name:'Avalanche', image:'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png', current_price:48, price_change_percentage_24h:-2.10, total_volume:950_000_000, market_cap:19_500_000_000 },
    { id:'dogecoin', symbol:'doge', name:'Dogecoin', image:'https://assets.coingecko.com/coins/images/5/large/dogecoin.png', current_price:0.15, price_change_percentage_24h:-12.40, total_volume:3_100_000_000, market_cap:21_000_000_000 },
    { id:'polkadot', symbol:'dot', name:'Polkadot', image:'https://assets.coingecko.com/coins/images/12171/large/polkadot.png', current_price:9.40, price_change_percentage_24h:1.90, total_volume:380_000_000, market_cap:13_000_000_000 },
    { id:'chainlink', symbol:'link', name:'Chainlink', image:'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png', current_price:19.80, price_change_percentage_24h:-0.60, total_volume:490_000_000, market_cap:11_500_000_000 },
    { id:'shiba-inu', symbol:'shib', name:'Shiba Inu', image:'https://assets.coingecko.com/coins/images/11939/large/shiba.png', current_price:0.0000278, price_change_percentage_24h:-9.80, total_volume:1_100_000_000, market_cap:16_000_000_000 },
    { id:'arbitrum', symbol:'arb', name:'Arbitrum', image:'https://assets.coingecko.com/coins/images/16547/large/arb.jpg', current_price:1.17, price_change_percentage_24h:8.50, total_volume:610_000_000, market_cap:4_200_000_000 },
    { id:'pepe', symbol:'pepe', name:'Pepe', image:'https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg', current_price:0.000012, price_change_percentage_24h:15.20, total_volume:1_800_000_000, market_cap:5_100_000_000 },
];

const VIEW_META = {
    dashboard: ['Market intelligence', 'Trading & Analytics Hub'],
    markets: ['Live discovery', 'Crypto Market Explorer'],
    portfolio: ['Cloud synced', 'Portfolio Management'],
    exchange: ['Price conversion', 'Crypto Exchange'],
    history: ['Simulation ledger', 'Transaction History'],
    settings: ['Account control', 'Settings & Preferences'],
};

const state = {
    marketData: MOCK.map(normalizeCoin),
    watchlist: [],
    currentUser: null,
    isGuest: true,
    activeCoinId: 'bitcoin',
    activeTimeframe: '1W',
    activeView: 'dashboard',
    marketFilter: 'all',
    marketQuery: '',
    marketPage: 1,
    historyQuery: '',
    payCoinId: 'bitcoin',
    receiveCoinId: 'ethereum',
    tradeMode: 'buy',
    chart: null,
    liveData: false,
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function normalizeCoin(coin, index = 0) {
    return {
        ...coin,
        id: coin?.id || `coin-${index}`,
        name: coin?.name || 'Unknown asset',
        symbol: String(coin?.symbol || 'asset').toLowerCase(),
        image: coin?.image || 'assets/logo.svg',
        current_price: finite(coin?.current_price),
        price_change_percentage_24h: finite(coin?.price_change_percentage_24h),
        price_change_percentage_7d_in_currency: finite(coin?.price_change_percentage_7d_in_currency, finite(coin?.price_change_percentage_24h) * 1.8),
        market_cap: finite(coin?.market_cap),
        total_volume: finite(coin?.total_volume),
    };
}

function finite(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[character]);
}

function formatPrice(value) {
    const number = finite(value);
    if (number === 0) return '$0.00';
    if (number < 0.0001) return `$${number.toFixed(8)}`;
    if (number < 1) return `$${number.toFixed(5)}`;
    return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:2 }).format(number);
}

function formatCompact(value) {
    const number = finite(value);
    if (number >= 1e12) return `$${(number / 1e12).toFixed(2)}T`;
    if (number >= 1e9) return `$${(number / 1e9).toFixed(2)}B`;
    if (number >= 1e6) return `$${(number / 1e6).toFixed(2)}M`;
    return formatPrice(number);
}

function formatPercent(value, includePlus = true) {
    const number = finite(value);
    return `${includePlus && number >= 0 ? '+' : ''}${number.toFixed(2)}%`;
}

function initials(name = '') {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'G';
}

function debounce(callback, delay = 220) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => callback(...args), delay);
    };
}

let toastTimer;
function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

function mapAuthError(error) {
    const messages = {
        'auth/email-already-in-use': 'An account already exists for that email.',
        'auth/invalid-credential': 'The email or password is incorrect.',
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/network-request-failed': 'Network unavailable. Check your connection and retry.',
        'auth/operation-not-allowed': 'Enable Email/Password in Firebase Authentication.',
        'auth/too-many-requests': 'Too many attempts. Please wait and retry.',
        'auth/weak-password': 'Use a password with at least 8 characters.',
    };
    return messages[error?.code] || error?.message || 'Something went wrong. Please try again.';
}

function watchKey(userId = state.currentUser?.id) {
    return `${WATCH_PREFIX}${userId || 'guest'}`;
}

function transactionKey() {
    return `${TX_PREFIX}${state.currentUser?.id || 'guest'}`;
}

function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
}

function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function cacheSession() {
    if (!state.currentUser) return;
    writeJson(SESSION_KEY, state.currentUser);
    writeJson(watchKey(), state.watchlist);
}

function applySession(user, watchlist = [], announce = '') {
    state.currentUser = user;
    state.isGuest = !user;
    state.watchlist = user ? [...new Set(watchlist)] : [];
    if (user) cacheSession();
    updateAccountUI();
    renderPortfolio();
    renderMarkets();
    renderHistory();
    closeAuth();
    if (announce) showToast(announce);
}

function activateGuest(announce = false) {
    state.currentUser = null;
    state.isGuest = true;
    state.watchlist = [];
    localStorage.removeItem(SESSION_KEY);
    updateAccountUI();
    renderPortfolio();
    renderMarkets();
    renderHistory();
    closeAuth();
    if (announce) showToast('Signed out. Live markets remain available in guest mode.');
}

function restoreCachedSession() {
    const user = readJson(SESSION_KEY, null);
    if (!user?.id) return false;
    applySession(user, readJson(watchKey(user.id), []));
    return true;
}

async function restoreCloudSession(user, announce = '') {
    const cached = readJson(watchKey(user.id), []);
    applySession(user, cached);
    try {
        const cloudWatchlist = await loadCloudWatchlist(user.id);
        applySession(user, cloudWatchlist, announce);
    } catch (error) {
        console.error('Could not refresh Firestore watchlist', error);
        if (announce) showToast('Signed in. Using your cached watchlist while cloud sync reconnects.');
    }
}

function updateAccountUI() {
    const user = state.currentUser;
    const displayName = user?.name || 'Guest';
    const email = user?.email || 'Not signed in';
    const role = user ? getSyncModeLabel() : 'Ready to sync';
    $('#userAvatar').textContent = initials(displayName);
    $('#userName').textContent = displayName;
    $('#userRole').textContent = role;
    $('#dropdownName').textContent = displayName;
    $('#dropdownEmail').textContent = email;
    $('#signInButton').hidden = !state.isGuest;
    const authAction = $('#dropdownAuthAction');
    authAction.dataset.action = state.isGuest ? 'open-auth' : 'sign-out';
    authAction.innerHTML = state.isGuest ? '<i class="ph ph-sign-in"></i><span>Sign in</span>' : '<i class="ph ph-sign-out"></i><span>Sign out</span>';
    $('#guestBanner').hidden = !state.isGuest;
    $('#settingsAvatar').textContent = initials(displayName);
    $('#settingsName').textContent = user?.name || 'Guest investor';
    $('#settingsEmail').textContent = user?.email || 'Sign in to sync your portfolio';
    $('#settingsSyncBadge').innerHTML = `<span></span>${user ? escapeHtml(role) : 'Local session'}`;
    const settingsAuth = $('#settingsAuthButton');
    settingsAuth.textContent = state.isGuest ? 'Sign in' : 'Sign out';
    settingsAuth.dataset.action = state.isGuest ? 'open-auth' : 'sign-out';
    $('#historySyncStatus').textContent = user ? 'Cloud' : 'Guest';
    $('#authHint').textContent = USING_FIREBASE
        ? 'Firebase Authentication and Firestore cloud sync are connected.'
        : 'Local preview mode is active because Firebase is not configured.';
    $('#firebaseStatus').textContent = USING_FIREBASE ? 'Ready' : 'Preview';
    $('#firebaseAuthState').textContent = USING_FIREBASE ? 'Email/password authentication connected' : 'Local browser authentication';
}

function openAuth(fromWatchlist = false) {
    $('#authWatchlistPrompt').hidden = !fromWatchlist;
    $('#authOverlay').hidden = false;
    switchAuthTab('login');
    setTimeout(() => $('#loginEmail').focus(), 30);
}

function closeAuth() {
    $('#authOverlay').hidden = true;
    $('#loginError').textContent = '';
    $('#signupError').textContent = '';
}

function switchAuthTab(tab) {
    const login = tab === 'login';
    $('#tabLogin').classList.toggle('active', login);
    $('#tabSignup').classList.toggle('active', !login);
    $('#loginForm').hidden = !login;
    $('#signupForm').hidden = login;
}

async function handleLogin(event) {
    event.preventDefault();
    const email = $('#loginEmail').value.trim().toLowerCase();
    const password = $('#loginPassword').value;
    const errorElement = $('#loginError');
    errorElement.textContent = '';
    try {
        if (USING_FIREBASE) {
            const user = await signInCloudAccount({ email, password });
            await restoreCloudSession(user, `Welcome back, ${user.name.split(' ')[0]}.`);
            return;
        }
        const users = readJson(USERS_KEY, []);
        const user = users.find(candidate => candidate.email === email && candidate.password === password);
        if (!user) throw new Error('The email or password is incorrect.');
        applySession({ id:user.id, name:user.name, email:user.email }, readJson(watchKey(user.id), []), `Welcome back, ${user.name.split(' ')[0]}.`);
    } catch (error) {
        errorElement.textContent = mapAuthError(error);
    }
}

async function handleSignup(event) {
    event.preventDefault();
    const name = $('#signupName').value.trim();
    const email = $('#signupEmail').value.trim().toLowerCase();
    const password = $('#signupPassword').value;
    const errorElement = $('#signupError');
    errorElement.textContent = '';
    try {
        if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
        if (USING_FIREBASE) {
            const user = await createCloudAccount({ name, email, password });
            applySession(user, [], `Account created. Welcome to CrypDash, ${name.split(' ')[0]}.`);
            return;
        }
        const users = readJson(USERS_KEY, []);
        if (users.some(user => user.email === email)) throw new Error('An account already exists for that email.');
        const user = { id:`local-${Date.now()}`, name, email, password };
        writeJson(USERS_KEY, [...users, user]);
        applySession({ id:user.id, name, email }, [], `Account created. Welcome to CrypDash, ${name.split(' ')[0]}.`);
    } catch (error) {
        errorElement.textContent = mapAuthError(error);
    }
}

async function handleSignOut() {
    try {
        if (USING_FIREBASE) await signOutCloudAccount();
    } catch (error) {
        showToast(mapAuthError(error));
        return;
    }
    activateGuest(true);
}

function setView(view, options = {}) {
    if (!VIEW_META[view]) return;
    state.activeView = view;
    $$('.app-view').forEach(section => section.classList.toggle('active', section.dataset.view === view));
    $$('[data-view-link]').forEach(link => link.classList.toggle('active', link.dataset.viewLink === view));
    $('#pageEyebrow').textContent = VIEW_META[view][0];
    $('#pageTitle').textContent = VIEW_META[view][1];
    document.title = `${VIEW_META[view][1]} | CrypDash`;
    history.replaceState(null, '', `#${view}`);
    $('.main-content').scrollTo({ top:0, behavior:'smooth' });
    closeSidebar();
    if (view === 'exchange' && options.mode) setTradeMode(options.mode);
    if (view === 'dashboard') setTimeout(() => state.chart?.resize(), 20);
    if (view === 'history') renderHistory();
}

function openSidebar() {
    $('#sidebar').classList.add('open');
    $('#sidebarScrim').classList.add('visible');
}

function closeSidebar() {
    $('#sidebar').classList.remove('open');
    $('#sidebarScrim').classList.remove('visible');
}

function activeCoin() {
    return state.marketData.find(coin => coin.id === state.activeCoinId) || state.marketData[0];
}

function getWatchedCoins() {
    return state.watchlist.map(id => state.marketData.find(coin => coin.id === id)).filter(Boolean);
}

function portfolioMetrics() {
    const coins = getWatchedCoins();
    const value = coins.reduce((sum, coin) => sum + coin.current_price, 0);
    const weightedChange = value ? coins.reduce((sum, coin) => sum + coin.current_price * coin.price_change_percentage_24h, 0) / value : 0;
    return { coins, value, weightedChange };
}

function historySeed(coin, points) {
    let value = [...coin.id].reduce((sum, char) => sum + char.charCodeAt(0), 17) + points;
    return () => {
        value = (value * 9301 + 49297) % 233280;
        return value / 233280;
    };
}

function chartSeries(coin, points, volatility) {
    const random = historySeed(coin, points);
    const values = [];
    let price = coin.current_price * (1 - coin.price_change_percentage_24h / 100 * .7);
    for (let index = 0; index < points; index += 1) {
        const pull = (coin.current_price - price) * .08;
        price = Math.max(price + pull + (random() - .48) * coin.current_price * volatility, coin.current_price * .55);
        values.push(price);
    }
    values[values.length - 1] = coin.current_price;
    return values;
}

function movingAverage(values, windowSize = 5) {
    return values.map((_, index) => {
        const range = values.slice(Math.max(0, index - windowSize + 1), index + 1);
        return range.reduce((sum, value) => sum + value, 0) / range.length;
    });
}

function timeframeConfig(timeframe) {
    return {
        '1H': [24, .0025],
        '1D': [30, .005],
        '1W': [42, .012],
        '1M': [48, .02],
        '1Y': [52, .05],
    }[timeframe] || [42, .012];
}

function initChart() {
    if (!window.Chart) return;
    const context = $('#mainChart').getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(242,59,77,.28)');
    gradient.addColorStop(1, 'rgba(242,59,77,0)');
    state.chart = new Chart(context, {
        type: 'line',
        data: { labels: [], datasets: [
            { label:'Price', data:[], borderColor:'#f34a5a', backgroundColor:gradient, fill:true, borderWidth:2, pointRadius:0, pointHoverRadius:4, pointHoverBackgroundColor:'#fff', pointHoverBorderColor:'#f34a5a', pointHoverBorderWidth:2, tension:.38 },
            { label:'Moving average', data:[], borderColor:'rgba(67,142,232,.75)', backgroundColor:'transparent', borderWidth:1.5, borderDash:[4,4], pointRadius:0, tension:.35 },
        ]},
        options: {
            responsive:true,
            maintainAspectRatio:false,
            interaction:{ intersect:false, mode:'index' },
            animation:{ duration:650, easing:'easeOutQuart' },
            plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'rgba(18,22,30,.95)', borderColor:'rgba(255,255,255,.14)', borderWidth:1, titleColor:'#939aa9', bodyColor:'#fff', padding:10, displayColors:false, callbacks:{ label:context => formatPrice(context.parsed.y) } } },
            scales:{ x:{ grid:{display:false}, border:{display:false}, ticks:{ color:'#676e7c', maxTicksLimit:7, font:{size:8} } }, y:{ position:'right', grid:{ color:'rgba(255,255,255,.055)' }, border:{display:false}, ticks:{ color:'#676e7c', font:{size:8}, callback:value => formatCompact(value) } } },
        },
    });
}

function updateChart() {
    const coin = activeCoin();
    if (!coin) return;
    $('#mainChartIcon').src = coin.image;
    $('#mainChartName').textContent = coin.name;
    $('#mainChartSymbol').textContent = `${coin.symbol.toUpperCase()} / USD`;
    $('#mainChartPrice').textContent = formatPrice(coin.current_price);
    const change = $('#mainChartChange');
    change.textContent = `${formatPercent(coin.price_change_percentage_24h)} past 24h`;
    change.classList.toggle('negative', coin.price_change_percentage_24h < 0);
    if (!state.chart) return;
    const [points, volatility] = timeframeConfig(state.activeTimeframe);
    const values = chartSeries(coin, points, volatility);
    state.chart.data.labels = values.map((_, index) => index % Math.ceil(points / 7) === 0 ? `${index + 1}` : '');
    state.chart.data.datasets[0].data = values;
    state.chart.data.datasets[1].data = movingAverage(values);
    state.chart.update();
}

function renderDashboard() {
    const sorted = [...state.marketData].sort((a,b) => Math.abs(b.price_change_percentage_24h) - Math.abs(a.price_change_percentage_24h));
    const insightCoins = sorted.slice(0, 2);
    $('#insightsList').innerHTML = insightCoins.map(coin => {
        const positive = coin.price_change_percentage_24h >= 0;
        return `<div class="insight-row ${positive ? 'positive' : 'negative'}"><i class="ph ph-arrow-${positive ? 'up-right' : 'down-right'}"></i><div><strong>${positive ? 'Momentum' : 'Pullback'}: ${escapeHtml(coin.symbol.toUpperCase())}</strong><span>${positive ? 'Strong relative performance and positive sentiment' : 'Elevated volatility; monitor support levels'}</span></div><span>${formatPercent(coin.price_change_percentage_24h)}</span></div>`;
    }).join('');
    $('#marketMiniList').innerHTML = state.marketData.slice(0, 5).map(coin => `<button class="market-mini-row" type="button" data-select-coin="${escapeHtml(coin.id)}"><span class="market-mini-coin"><img src="${escapeHtml(coin.image)}" alt=""><strong>${escapeHtml(coin.symbol.toUpperCase())}</strong></span><span>${formatPrice(coin.current_price)}</span><span class="${coin.price_change_percentage_24h >= 0 ? 'positive-text' : 'negative-text'}">${formatPercent(coin.price_change_percentage_24h)}</span></button>`).join('');
    $('#dataSourceLabel').textContent = state.liveData ? 'Live CoinGecko USD data' : 'Instant preview data';
    updateChart();
}

function renderPortfolio() {
    const { coins, value, weightedChange } = portfolioMetrics();
    $('#navWatchCount').textContent = coins.length;
    $('#portfolioValue').textContent = formatPrice(value);
    $('#portfolioHeroValue').textContent = formatPrice(value);
    $('#portfolioAssetCount').textContent = coins.length;
    const performance = formatPercent(weightedChange);
    $('#portfolioPerformance').textContent = performance;
    $('#portfolioPerformance').className = weightedChange >= 0 ? 'positive-text' : 'negative-text';
    $('#portfolioHeroChange').textContent = `${performance} today`;
    $('#portfolioHeroChange').className = weightedChange >= 0 ? 'positive-text' : 'negative-text';

    const colors = ['#f23b4d','#438ee8','#9c72e7','#d8b448','#4bc486','#f3a03e'];
    const segments = coins.length && value ? coins.map((coin,index) => ({ coin, color:colors[index % colors.length], percent:coin.current_price / value * 100 })) : [];
    const stops = [];
    let total = 0;
    segments.forEach(segment => { stops.push(`${segment.color} ${total}% ${total + segment.percent}%`); total += segment.percent; });
    const gradient = stops.length ? `conic-gradient(${stops.join(',')})` : 'conic-gradient(#2c3340 0 100%)';
    $('#allocationRing').style.background = gradient;
    $('#portfolioRingLarge').style.background = gradient;
    $('#allocationLegend').innerHTML = segments.slice(0, 6).map(segment => `<div class="allocation-item"><i style="background:${segment.color}"></i><span>${escapeHtml(segment.coin.symbol.toUpperCase())}</span><strong>${segment.percent.toFixed(1)}%</strong></div>`).join('') || '<div class="watch-empty"><i class="ph ph-star"></i><span>Add assets from Markets</span></div>';

    $('#dashboardWatchlist').innerHTML = coins.length
        ? coins.slice(0, 3).map(coin => `<button class="watch-preview-row" type="button" data-select-coin="${escapeHtml(coin.id)}"><img src="${escapeHtml(coin.image)}" alt=""><strong>${escapeHtml(coin.symbol.toUpperCase())}</strong><span>${escapeHtml(coin.name)}</span><strong>${formatPrice(coin.current_price)}</strong></button>`).join('')
        : `<div class="watch-empty"><i class="ph ph-star"></i><span>${state.isGuest ? 'Sign in to build a synced portfolio' : 'Star assets in Markets to add them here'}</span></div>`;

    $('#portfolioTableBody').innerHTML = coins.length ? coins.map(coin => {
        const allocation = value ? coin.current_price / value * 100 : 0;
        return `<tr><td><span class="table-coin"><img src="${escapeHtml(coin.image)}" alt=""><span><strong>${escapeHtml(coin.name)}</strong><small>${escapeHtml(coin.symbol)}</small></span></span></td><td>${formatPrice(coin.current_price)}</td><td class="${coin.price_change_percentage_24h >= 0 ? 'positive-text' : 'negative-text'}">${formatPercent(coin.price_change_percentage_24h)}</td><td>${allocation.toFixed(1)}%</td><td><button class="watch-button active" type="button" data-watch-coin="${escapeHtml(coin.id)}" aria-label="Remove ${escapeHtml(coin.name)}"><i class="ph-fill ph-star"></i></button></td></tr>`;
    }).join('') : `<tr><td colspan="5" class="table-empty"><i class="ph ph-star"></i>${state.isGuest ? 'Sign in, then star coins from Markets.' : 'Your watchlist is empty. Add your first asset from Markets.'}</td></tr>`;

    const transactions = getTransactions();
    $('#portfolioActivity').innerHTML = transactions.length
        ? transactions.slice(0, 5).map(transaction => `<div class="activity-row"><i class="ph ph-arrows-left-right"></i><div><strong>${escapeHtml(transaction.action)} ${escapeHtml(transaction.pair)}</strong><span>${formatTransactionDate(transaction.date)}</span></div></div>`).join('')
        : '<div class="watch-empty" style="padding:50px 0"><i class="ph ph-clock-counter-clockwise"></i><span>Portfolio updates will appear here</span></div>';
}

function sparklineSvg(coin) {
    const random = historySeed(coin, 7);
    const up = coin.price_change_percentage_7d_in_currency >= 0;
    const values = Array.from({length:12}, (_, index) => 16 + (random() - .5) * 12 + (up ? index * .65 : -index * .65));
    const points = values.map((value,index) => `${(index / 11 * 86).toFixed(1)},${Math.max(2, Math.min(28, 30 - value)).toFixed(1)}`).join(' ');
    const color = up ? '#4bc486' : '#f05b68';
    return `<svg class="sparkline" viewBox="0 0 88 30" aria-hidden="true"><defs><linearGradient id="spark-${escapeHtml(coin.id)}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path class="fill" fill="url(#spark-${escapeHtml(coin.id)})" d="M${points} L86,30 L0,30Z"/><path class="line" stroke="${color}" d="M${points}"/></svg>`;
}

function filteredMarkets() {
    let coins = [...state.marketData];
    if (state.marketFilter === 'gainers') coins = coins.filter(coin => coin.price_change_percentage_24h > 0);
    if (state.marketFilter === 'watchlist') coins = coins.filter(coin => state.watchlist.includes(coin.id));
    const query = state.marketQuery.trim().toLowerCase();
    if (query) coins = coins.filter(coin => coin.name.toLowerCase().includes(query) || coin.symbol.includes(query));
    return coins;
}

function renderMarkets() {
    const gainers = [...state.marketData].sort((a,b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0,3);
    const losers = [...state.marketData].sort((a,b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0,3);
    const moverHtml = coins => coins.map(coin => `<button class="mover-item" type="button" data-select-coin="${escapeHtml(coin.id)}"><img src="${escapeHtml(coin.image)}" alt=""><span><strong>${escapeHtml(coin.symbol.toUpperCase())}</strong><small class="${coin.price_change_percentage_24h >= 0 ? 'positive-text' : 'negative-text'}">${formatPercent(coin.price_change_percentage_24h)}</small></span></button>`).join('');
    $('#gainersList').innerHTML = moverHtml(gainers);
    $('#losersList').innerHTML = moverHtml(losers);

    const coins = filteredMarkets();
    const pageCount = Math.max(1, Math.ceil(coins.length / PAGE_SIZE));
    state.marketPage = Math.min(Math.max(1, state.marketPage), pageCount);
    const pageCoins = coins.slice((state.marketPage - 1) * PAGE_SIZE, state.marketPage * PAGE_SIZE);
    $('#marketResultCount').textContent = `${coins.length} asset${coins.length === 1 ? '' : 's'}`;
    $('#marketPageLabel').textContent = `${state.marketPage} / ${pageCount}`;
    $('#marketTableBody').innerHTML = pageCoins.length ? pageCoins.map((coin,index) => {
        const watched = state.watchlist.includes(coin.id);
        return `<tr><td class="watch-cell"><button class="watch-button ${watched ? 'active' : ''}" type="button" data-watch-coin="${escapeHtml(coin.id)}" aria-label="${watched ? 'Remove' : 'Add'} ${escapeHtml(coin.name)} ${watched ? 'from' : 'to'} watchlist"><i class="${watched ? 'ph-fill' : 'ph'} ph-star"></i></button></td><td>${(state.marketPage - 1) * PAGE_SIZE + index + 1}</td><td><button class="table-coin" type="button" data-select-coin="${escapeHtml(coin.id)}"><img src="${escapeHtml(coin.image)}" alt=""><span><strong>${escapeHtml(coin.name)}</strong><small>${escapeHtml(coin.symbol)}</small></span></button></td><td>${formatPrice(coin.current_price)}</td><td class="${coin.price_change_percentage_24h >= 0 ? 'positive-text' : 'negative-text'}">${formatPercent(coin.price_change_percentage_24h)}</td><td>${sparklineSvg(coin)}</td><td>${formatCompact(coin.market_cap)}</td><td>${formatCompact(coin.total_volume)}</td><td><button class="trade-button" type="button" data-trade-coin="${escapeHtml(coin.id)}">Trade</button></td></tr>`;
    }).join('') : `<tr><td colspan="9" class="table-empty"><i class="ph ph-magnifying-glass"></i>No assets match this view.</td></tr>`;
}

async function toggleWatchlist(coinId) {
    if (state.isGuest) {
        openAuth(true);
        return;
    }
    const watched = state.watchlist.includes(coinId);
    state.watchlist = watched ? state.watchlist.filter(id => id !== coinId) : [...state.watchlist, coinId];
    cacheSession();
    renderMarkets();
    renderPortfolio();
    const coin = state.marketData.find(item => item.id === coinId);
    showToast(`${coin?.name || 'Asset'} ${watched ? 'removed from' : 'added to'} your portfolio.`);
    if (!USING_FIREBASE) return;
    try {
        if (watched) await removeCloudWatchCoin(state.currentUser, coinId);
        else await addCloudWatchCoin(state.currentUser, coinId);
    } catch (error) {
        state.watchlist = watched ? [...state.watchlist, coinId] : state.watchlist.filter(id => id !== coinId);
        cacheSession();
        renderMarkets();
        renderPortfolio();
        console.error('Watchlist sync failed', error);
        showToast('Cloud sync failed, so that watchlist change was rolled back.');
    }
}

function selectCoin(coinId, navigate = true) {
    if (!state.marketData.some(coin => coin.id === coinId)) return;
    state.activeCoinId = coinId;
    updateChart();
    if (navigate) setView('dashboard');
}

function renderGlobalSearch(query) {
    const results = $('#globalSearchResults');
    const normalized = query.trim().toLowerCase();
    if (!normalized) { results.hidden = true; return; }
    const matches = state.marketData.filter(coin => coin.name.toLowerCase().includes(normalized) || coin.symbol.includes(normalized)).slice(0,6);
    results.innerHTML = matches.length ? matches.map(coin => `<button class="search-result" type="button" data-select-coin="${escapeHtml(coin.id)}"><img src="${escapeHtml(coin.image)}" alt=""><span><strong>${escapeHtml(coin.name)}</strong><small>${escapeHtml(coin.symbol)}</small></span><em>${formatPrice(coin.current_price)}</em></button>`).join('') : `<div class="search-empty">No assets found</div>`;
    results.hidden = false;
}

function exchangeCoin(id) {
    return state.marketData.find(coin => coin.id === id) || state.marketData[0];
}

function updateExchange() {
    const payCoin = exchangeCoin(state.payCoinId);
    const receiveCoin = exchangeCoin(state.receiveCoinId);
    if (!payCoin || !receiveCoin) return;
    const payAmount = Math.max(0, finite($('#payAmount').value));
    const receiveAmount = receiveCoin.current_price ? payAmount * payCoin.current_price / receiveCoin.current_price : 0;
    $('#payCoinImage').src = payCoin.image;
    $('#payCoinSymbol').textContent = payCoin.symbol.toUpperCase();
    $('#payCoinName').textContent = payCoin.name;
    $('#receiveCoinImage').src = receiveCoin.image;
    $('#receiveCoinSymbol').textContent = receiveCoin.symbol.toUpperCase();
    $('#receiveCoinName').textContent = receiveCoin.name;
    $('#receiveAmount').value = receiveAmount < .001 ? receiveAmount.toFixed(8) : receiveAmount.toFixed(5);
    $('#payEstimate').textContent = `≈ ${formatPrice(payAmount * payCoin.current_price)} market value`;
    $('#exchangeRate').textContent = `1 ${payCoin.symbol.toUpperCase()} ≈ ${(payCoin.current_price / receiveCoin.current_price).toFixed(5)} ${receiveCoin.symbol.toUpperCase()}`;
    $('#quoteCoinImage').src = receiveCoin.image;
    $('#quoteCoinName').textContent = receiveCoin.name;
    $('#quoteCoinPrice').textContent = formatPrice(receiveCoin.current_price);
    $('#quoteCoinChange').textContent = formatPercent(receiveCoin.price_change_percentage_24h);
    $('#quoteCoinChange').className = receiveCoin.price_change_percentage_24h >= 0 ? 'positive-text' : 'negative-text';
    $('#quoteRate').textContent = `${(payCoin.current_price / receiveCoin.current_price).toFixed(5)} ${receiveCoin.symbol.toUpperCase()}`;
    $('#swapButton span').textContent = `${state.tradeMode === 'sell' ? 'Preview sale' : 'Preview swap'}`;
}

function cycleExchangeCoin(side) {
    const currentId = side === 'pay' ? state.payCoinId : state.receiveCoinId;
    let index = state.marketData.findIndex(coin => coin.id === currentId);
    let next;
    do {
        index = (index + 1) % Math.min(state.marketData.length, 8);
        next = state.marketData[index];
    } while (next.id === (side === 'pay' ? state.receiveCoinId : state.payCoinId));
    if (side === 'pay') state.payCoinId = next.id;
    else state.receiveCoinId = next.id;
    updateExchange();
}

function reverseSwap() {
    [state.payCoinId, state.receiveCoinId] = [state.receiveCoinId, state.payCoinId];
    updateExchange();
}

function setTradeMode(mode) {
    state.tradeMode = mode === 'sell' ? 'sell' : 'buy';
    $$('[data-trade-mode]').forEach(button => button.classList.toggle('active', button.dataset.tradeMode === state.tradeMode));
    updateExchange();
}

function previewSwap() {
    const payCoin = exchangeCoin(state.payCoinId);
    const receiveCoin = exchangeCoin(state.receiveCoinId);
    const payAmount = Math.max(0, finite($('#payAmount').value));
    const receiveAmount = finite($('#receiveAmount').value);
    if (!payAmount || !receiveAmount) {
        showToast('Enter an amount greater than zero to preview this swap.');
        return;
    }
    const transaction = {
        id: `tx-${Date.now()}`,
        status: 'Simulated',
        date: new Date().toISOString(),
        pair: `${payCoin.symbol.toUpperCase()}/${receiveCoin.symbol.toUpperCase()}`,
        action: state.tradeMode === 'sell' ? 'Sell' : 'Swap',
        pay: `${payAmount.toLocaleString(undefined,{maximumFractionDigits:8})} ${payCoin.symbol.toUpperCase()}`,
        receive: `${receiveAmount.toLocaleString(undefined,{maximumFractionDigits:8})} ${receiveCoin.symbol.toUpperCase()}`,
        usdValue: payAmount * payCoin.current_price,
    };
    writeJson(transactionKey(), [transaction, ...getTransactions()].slice(0, 100));
    renderHistory();
    renderPortfolio();
    showToast(`Simulation recorded: ${transaction.pay} → ${transaction.receive}`);
    setView('history');
}

function getTransactions() {
    return readJson(transactionKey(), []);
}

function formatTransactionDate(date) {
    return new Intl.DateTimeFormat('en-KE', { dateStyle:'medium', timeStyle:'short' }).format(new Date(date));
}

function renderHistory() {
    const transactions = getTransactions();
    const query = state.historyQuery.trim().toLowerCase();
    const filtered = transactions.filter(transaction => Object.values(transaction).some(value => String(value).toLowerCase().includes(query)));
    $('#historyVolume').textContent = formatPrice(transactions.reduce((sum, transaction) => sum + finite(transaction.usdValue), 0));
    $('#historyCount').textContent = transactions.length;
    $('#historyTableBody').innerHTML = filtered.length ? filtered.map(transaction => `<tr><td><span class="live-pill"><span></span>${escapeHtml(transaction.status)}</span></td><td>${escapeHtml(formatTransactionDate(transaction.date))}</td><td>${escapeHtml(transaction.pair)}</td><td class="${transaction.action === 'Sell' ? 'negative-text' : 'positive-text'}">${escapeHtml(transaction.action)}</td><td>${escapeHtml(transaction.pay)}</td><td>${escapeHtml(transaction.receive)}</td><td>Portfolio simulation</td></tr>`).join('') : `<tr><td colspan="7" class="table-empty"><i class="ph ph-receipt"></i>${query ? 'No transactions match your search.' : 'No simulations yet. Use Exchange to record one.'}</td></tr>`;
}

function clearHistory() {
    if (!getTransactions().length) { showToast('There are no simulations to clear.'); return; }
    localStorage.removeItem(transactionKey());
    renderHistory();
    renderPortfolio();
    showToast('Simulation history cleared.');
}

async function fetchMarketData() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);
    try {
        const response = await fetch(API_URL, { signal:controller.signal, headers:{ accept:'application/json' } });
        if (!response.ok) throw new Error(`CoinGecko returned ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data) || !data.length) throw new Error('CoinGecko returned no assets');
        state.marketData = data.map(normalizeCoin);
        state.liveData = true;
    } catch (error) {
        console.warn('Live prices unavailable; retaining instant preview data.', error);
        state.liveData = false;
    } finally {
        clearTimeout(timeout);
    }
    if (!state.marketData.some(coin => coin.id === state.activeCoinId)) state.activeCoinId = state.marketData[0]?.id;
    if (!state.marketData.some(coin => coin.id === state.payCoinId)) state.payCoinId = state.marketData[0]?.id;
    if (!state.marketData.some(coin => coin.id === state.receiveCoinId)) state.receiveCoinId = state.marketData[1]?.id || state.marketData[0]?.id;
    renderAll();
}

function renderAll() {
    renderDashboard();
    renderMarkets();
    renderPortfolio();
    renderHistory();
    updateExchange();
}

function handleDocumentClick(event) {
    const viewLink = event.target.closest('[data-view-link]');
    if (viewLink) {
        event.preventDefault();
        setView(viewLink.dataset.viewLink, { mode:viewLink.dataset.mode });
        return;
    }
    const actionElement = event.target.closest('[data-action]');
    if (actionElement) {
        const actions = {
            'open-auth': () => openAuth(false),
            'open-auth-watchlist': () => openAuth(true),
            'close-auth': closeAuth,
            'sign-out': handleSignOut,
            'open-sidebar': openSidebar,
            'close-sidebar': closeSidebar,
            'toggle-user': () => { $('#userDropdown').hidden = !$('#userDropdown').hidden; },
            'cycle-pay-coin': () => cycleExchangeCoin('pay'),
            'cycle-receive-coin': () => cycleExchangeCoin('receive'),
            'reverse-swap': reverseSwap,
            'clear-history': clearHistory,
            'account-action': () => state.isGuest ? openAuth(false) : showToast('Your Firebase account and watchlist sync are active.'),
        };
        actions[actionElement.dataset.action]?.();
        return;
    }
    const watchButton = event.target.closest('[data-watch-coin]');
    if (watchButton) { toggleWatchlist(watchButton.dataset.watchCoin); return; }
    const coinButton = event.target.closest('[data-select-coin]');
    if (coinButton) { selectCoin(coinButton.dataset.selectCoin); $('#globalSearchResults').hidden = true; $('#globalSearchInput').value = ''; return; }
    const tradeButton = event.target.closest('[data-trade-coin]');
    if (tradeButton) {
        state.receiveCoinId = tradeButton.dataset.tradeCoin;
        if (state.receiveCoinId === state.payCoinId) state.payCoinId = state.marketData.find(coin => coin.id !== state.receiveCoinId)?.id;
        updateExchange();
        setView('exchange');
        return;
    }
    const filterButton = event.target.closest('[data-market-filter]');
    if (filterButton) {
        state.marketFilter = filterButton.dataset.marketFilter;
        state.marketPage = 1;
        $$('[data-market-filter]').forEach(button => button.classList.toggle('active', button === filterButton));
        renderMarkets();
        return;
    }
    const pageButton = event.target.closest('[data-page-step]');
    if (pageButton) { state.marketPage += Number(pageButton.dataset.pageStep); renderMarkets(); return; }
    const timeframeButton = event.target.closest('[data-timeframe]');
    if (timeframeButton) {
        state.activeTimeframe = timeframeButton.dataset.timeframe;
        $$('[data-timeframe]').forEach(button => button.classList.toggle('active', button === timeframeButton));
        updateChart();
        return;
    }
    const tradeModeButton = event.target.closest('[data-trade-mode]');
    if (tradeModeButton) { setTradeMode(tradeModeButton.dataset.tradeMode); return; }
    if (!event.target.closest('#userMenu')) $('#userDropdown').hidden = true;
    if (!event.target.closest('#globalSearch')) $('#globalSearchResults').hidden = true;
    if (event.target === $('#authOverlay')) closeAuth();
}

function loadPreferences() {
    const settings = readJson(SETTINGS_KEY, { notifications:true, motion:true });
    $('#notificationToggle').checked = settings.notifications !== false;
    $('#motionToggle').checked = settings.motion !== false;
    document.documentElement.classList.toggle('reduce-motion', settings.motion === false);
}

function savePreferences() {
    const settings = { notifications:$('#notificationToggle').checked, motion:$('#motionToggle').checked };
    writeJson(SETTINGS_KEY, settings);
    document.documentElement.classList.toggle('reduce-motion', !settings.motion);
    showToast('Preferences saved on this device.');
}

function bindEvents() {
    document.addEventListener('click', handleDocumentClick);
    $('#loginForm').addEventListener('submit', handleLogin);
    $('#signupForm').addEventListener('submit', handleSignup);
    $$('[data-auth-tab]').forEach(button => button.addEventListener('click', () => switchAuthTab(button.dataset.authTab)));
    $('#globalSearchInput').addEventListener('input', debounce(event => renderGlobalSearch(event.target.value), 160));
    $('#globalSearchInput').addEventListener('focus', event => renderGlobalSearch(event.target.value));
    $('#marketSearchInput').addEventListener('input', debounce(event => { state.marketQuery = event.target.value; state.marketPage = 1; renderMarkets(); }));
    $('#historySearchInput').addEventListener('input', debounce(event => { state.historyQuery = event.target.value; renderHistory(); }));
    $('#payAmount').addEventListener('input', updateExchange);
    $('#swapButton').addEventListener('click', previewSwap);
    $('#notificationToggle').addEventListener('change', savePreferences);
    $('#motionToggle').addEventListener('change', savePreferences);
    $('#globalSearch > i').addEventListener('click', () => {
        if (window.innerWidth > 700) return;
        $('#globalSearch').classList.add('mobile-open');
        $('#globalSearchInput').focus();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') { closeAuth(); closeSidebar(); $('#userDropdown').hidden = true; $('#globalSearch').classList.remove('mobile-open'); }
        if (event.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { event.preventDefault(); $('#globalSearch').classList.add('mobile-open'); $('#globalSearchInput').focus(); }
    });
    window.addEventListener('hashchange', () => {
        const view = location.hash.slice(1);
        if (VIEW_META[view] && view !== state.activeView) setView(view);
    });
}

function initAuth() {
    const hadCache = restoreCachedSession();
    if (!hadCache) activateGuest();
    if (!USING_FIREBASE) return;
    subscribeToAuthState(async user => {
        if (user) await restoreCloudSession(user);
        else if (state.currentUser && !String(state.currentUser.id).startsWith('local-')) activateGuest();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    loadPreferences();
    initChart();
    renderAll();
    initAuth();
    const initialView = location.hash.slice(1);
    setView(VIEW_META[initialView] ? initialView : 'dashboard');
    fetchMarketData();
});
