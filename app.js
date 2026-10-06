/* ================================================================
   AppCloud · Download Hub — app.js
   ================================================================ */
(function () {
  'use strict';

  // ============================================================
  // STORAGE
  // ============================================================
  const DB = {
    key: 'appcloud_db_v1',
    load() {
      try {
        const raw = localStorage.getItem(this.key);
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    },
    save(data) { try { localStorage.setItem(this.key, JSON.stringify(data)); } catch {} },
    reset() { localStorage.removeItem(this.key); }
  };

  const ADMIN_EMAIL = 'signin@gmail.com';

  const DEFAULT_DB = {
    users: [
      {
        id: 'u_admin_demo',
        name: 'Admin',
        email: ADMIN_EMAIL,
        phone: '712345678',
        password: 'Gm08202118269',
        level: 1,
        hasKey: false,
        keyApproved: false,
        appsInstalledToday: 0,
        installedToday: [],
        lastInstallDate: new Date().toDateString(),
        balance: 0,
        referralEarnings: 0,
        referredBy: null,
        status: 'Active',
        isAdmin: true,
        createdAt: Date.now()
      }
    ],
    transactions: [],
    withdrawals: [],
    referrals: [],
    logins: [],
    settings: { paybill: '400200', account: 'APPCLOUD' }
  };

  let db = DB.load();
  if (!db) { db = JSON.parse(JSON.stringify(DEFAULT_DB)); DB.save(db); }
  function saveDB() { DB.save(db); }

  // ============================================================
  // STATE
  // ============================================================
  const state = {
    currentUser: null,
    currentUserId: null,
    isAdmin: false,
    activeInstallations: {},
    selectedLevel: 1,
    selectedUpgradeLevel: null,
    dailyApps: null,
    basket: null
  };

  const LEVELS = {
    1: { name: 'Level 1', appsPerDay: 5,  keyPrice: 1000 },
    2: { name: 'Level 2', appsPerDay: 15, keyPrice: 2000 },
    3: { name: 'Level 3', appsPerDay: 30, keyPrice: 5000 },
    4: { name: 'Level 4', appsPerDay: 50, keyPrice: 8000 },
    5: { name: 'Level 5', appsPerDay: 90, keyPrice: 15000 }
  };

  // ============================================================
  // APP POOL — 1000 apps
  // ============================================================
  const APP_POOL = (() => {
    const baseNames = [
      'WhatsApp','Instagram','TikTok','Facebook','YouTube','Spotify','Netflix','X','Snapchat','Telegram',
      'Pinterest','Reddit','Discord','Twitch','LinkedIn','Zoom','Slack','Notion','Figma','Canva',
      'Dropbox','Google Drive','Gmail','Maps','Uber','Bolt','Airbnb','Booking','Amazon','eBay',
      'AliExpress','Shopify','PayPal','Revolut','Binance','Coinbase','Kraken','MetaMask','Trust Wallet','M-Pesa',
      'Airtel Money','Equity Bank','KCB','Chrome','Firefox','Edge','Safari','Opera','Brave','VLC',
      'Audible','Kindle','Goodreads','Duolingo','Khan Academy','Coursera','Udemy','Skillshare','Medium','Substack',
      'Quora','Stack Overflow','GitHub','GitLab','Bitbucket','Vercel','Netlify','Cloudflare','AWS','Azure',
      'GCP','DigitalOcean','Linode','Heroku','Render','Railway','Supabase','Firebase','MongoDB','Postgres',
      'MySQL','Redis','Docker','Kubernetes','Terraform','Ansible','Jenkins','CircleCI','Postman','Insomnia',
      'Swagger','GraphQL','Apollo','Prisma','Drizzle','NestJS','Next.js','Nuxt','SvelteKit','Astro'
    ];

    const icons = [
      '💬','📸','🎵','📘','▶️','🎧','🎬','🐦','👻','✈️',
      '📌','🤖','🎮','🟣','💼','📹','📝','🎨','🖼️','📦',
      '🗂️','📧','🗺️','🚗','⚡','🏠','🏨','🛒','🏷️','🛍️',
      '💳','💠','🪙','🔵','🐙','🦊','🛡️','📲','🔴','🏦',
      '💚','🌐','🌊','🧭','🎭','🦁','🎞️','🧸','🎙️','📖',
      '📚','🦉','🎓','🎯','✍️'
    ];

    const apps = [];
    let counter = 0;
    for (let pass = 1; pass <= 10; pass++) {
      baseNames.forEach((base, i) => {
        counter++;
        const icon = icons[(counter + i + pass) % icons.length];
        const name = pass === 1 ? base : `${base} ${pass}`;
        apps.push({ id: 'app' + counter, name, payout: 10, icon });
      });
    }
    return apps;
  })();

  // ============================================================
  // DAILY USER-SPECIFIC APP SET
  // ============================================================
  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function seededShuffle(array, seed) {
    let s = seed >>> 0;
    const rand = () => {
      s |= 0; s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function getDailyAppsForUser(user) {
    if (!user) return [];
    const seed = hashString(`${user.email}|${getTodayKey()}`);
    const shuffled = seededShuffle(APP_POOL, seed);
    return shuffled.slice(0, 200);
  }

  const APPS = APP_POOL;

  // ============================================================
  // DOM
  // ============================================================
  const $ = id => document.getElementById(id);
  const authScreen    = $('authScreen');
  const levelScreen   = $('levelScreen');
  const userDashboard = $('userDashboard');
  const upgradeScreen = $('upgradeScreen');
  const adminPanel    = $('adminPanel');

  // ============================================================
  // TOAST
  // ============================================================
  function toast(msg, error = false) {
    const t = document.createElement('div');
    t.className = 'toast' + (error ? ' error' : '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.4s'; }, 2500);
    setTimeout(() => t.remove(), 3000);
  }

  // ============================================================
  // HELPERS
  // ============================================================
  const normalizeEmail = v => String(v || '').trim().toLowerCase();
  const normalizePhone = v => String(v || '').replace(/\D/g, '').slice(0, 9);

  function isValidMpesaCode(code) {
    return /^[A-Z0-9]{10}$/.test(String(code || '').trim().toUpperCase());
  }

  // ============================================================
  // AUTH TABS
  // ============================================================
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const isLogin = tab.dataset.tab === 'login';
      $('loginForm').classList.toggle('hidden', !isLogin);
      $('registerForm').classList.toggle('hidden', isLogin);
    });
  });

  // Email → lowercase (no setSelectionRange — type=email doesn't support it)
  ['loginEmail', 'regEmail', 'regReferral'].forEach(id => {
    const el = $(id); if (!el) return;
    el.addEventListener('input', () => {
      el.value = el.value.toLowerCase();
    });
  });

  // Phone → digits only
  ['regPhone', 'withdrawNumber'].forEach(id => {
    const el = $(id); if (!el) return;
    el.addEventListener('input', () => {
      el.value = el.value.replace(/\D/g, '').slice(0, 9);
    });
  });

  // M-Pesa code → uppercase alphanumeric
  ['mpesaCode', 'upgradeMpesaCode'].forEach(id => {
    const el = $(id); if (!el) return;
    el.addEventListener('input', () => {
      el.value = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    });
  });

  // ============================================================
  // REGISTER
  // ============================================================
  const registerBtn = $('registerBtn');
  if (registerBtn) registerBtn.addEventListener('click', () => {
    const name     = $('regName').value.trim();
    const email    = normalizeEmail($('regEmail').value);
    const phone    = normalizePhone($('regPhone').value);
    const password = $('regPassword').value;
    const refEmail = normalizeEmail($('regReferral').value);

    if (!name || !email || !phone || !password) return toast('Please fill all required fields', true);
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return toast('Invalid email address', true);
    if (phone.length !== 9) return toast('Phone must be 9 digits after +254', true);
    if (password.length < 6) return toast('Password must be at least 6 characters', true);
    if (db.users.find(u => u.email === email)) return toast('Email already registered', true);

    let referredBy = null;
    if (refEmail) {
      const referrer = db.users.find(u => u.email === refEmail);
      if (referrer && referrer.email !== email) referredBy = referrer.id;
    }

    const newUser = {
      id: 'u_' + Date.now(),
      name, email, phone, password,
      level: 1,
      hasKey: false,
      keyApproved: false,
      appsInstalledToday: 0,
      installedToday: [],
      lastInstallDate: new Date().toDateString(),
      balance: 0,
      referralEarnings: 0,
      referredBy,
      status: 'Active',
      isAdmin: false,
      createdAt: Date.now()
    };
    db.users.push(newUser);

    if (referredBy) {
      db.referrals.push({
        id: 'r_' + Date.now(),
        referrerId: referredBy,
        referredUserId: newUser.id,
        referredEmail: email,
        amount: 0,
        status: 'pending',
        createdAt: Date.now()
      });
    }

    logLogin(email, 'Registered');
    saveDB();
    toast('Account created! Choose your key package to start earning.');
    state.currentUser = newUser;
    state.currentUserId = newUser.id;
    showLevelSelection();
  });

  // ============================================================
  // LOGIN
  // ============================================================
  const loginBtn = $('loginBtn');
  if (loginBtn) loginBtn.addEventListener('click', () => {
    const email = normalizeEmail($('loginEmail').value);
    const pwd   = $('loginPassword').value;
    const user  = db.users.find(u => u.email === email && u.password === pwd);

    if (!user) return toast('Invalid credentials', true);

    state.currentUser = user;
    state.currentUserId = user.id;
    logLogin(user.email, 'Login');
    saveDB();

    if (email === ADMIN_EMAIL) {
      state.isAdmin = true;
      showAdminPanel();
      return;
    }

    state.isAdmin = false;
    resetDailyIfNeeded(user);
    showUserDashboard();
  });

  function logLogin(email, type) {
    db.logins.unshift({ email, type, time: Date.now() });
    if (db.logins.length > 50) db.logins = db.logins.slice(0, 50);
    saveDB();
  }

  // ============================================================
  // NAV
  // ============================================================
  function hideAll() {
    if (authScreen)    authScreen.classList.add('hidden');
    if (levelScreen)   levelScreen.classList.add('hidden');
    if (userDashboard) userDashboard.classList.add('hidden');
    if (upgradeScreen) upgradeScreen.classList.add('hidden');
    if (adminPanel)    adminPanel.classList.add('hidden');
  }

  function showLevelSelection() {
    const u = state.currentUser;
    if (u && u.keyApproved) {
      showUserDashboard();
      return;
    }

    hideAll();
    if (levelScreen) levelScreen.classList.remove('hidden');
    renderLevelGrid();
    const pb = $('displayPaybill'); if (pb) pb.textContent = db.settings.paybill;
    const ac = $('displayAcc');     if (ac) ac.textContent = db.settings.account;
    const kp = $('keyPurchaseBox'); if (kp) kp.classList.add('hidden');
  }

  function showUserDashboard() {
    hideAll();
    if (userDashboard) userDashboard.classList.remove('hidden');
    const u = state.currentUser;
    if (!u) return;
    const rl = $('referralLink');
    if (rl) rl.value =
      `${location.origin}${location.pathname}?ref=${encodeURIComponent(u.email)}`;
    renderUserDashboard();
    startAppStrip();
  }

  function showAdminPanel() {
    hideAll();
    if (adminPanel) adminPanel.classList.remove('hidden');
    stopAppStrip();
    renderAdminPanel();
  }

  // ============================================================
  // LEVEL GRID
  // ============================================================
  function renderLevelGrid() {
    const grid = $('levelGrid');
    if (!grid) return;
    grid.innerHTML = '';
    Object.entries(LEVELS).forEach(([lvl, cfg]) => {
      const lvlNum = Number(lvl);
      const card = document.createElement('div');
      card.className = 'plan-card' + (state.selectedLevel === lvlNum ? ' selected' : '');
      card.innerHTML = `
        <h3>${cfg.name}</h3>
        <div class="plan-price">Ksh ${cfg.keyPrice.toLocaleString()}</div>
        <div class="plan-apps">${cfg.appsPerDay} apps / day</div>
        <div class="text-muted mt-1">Potential Ksh ${cfg.appsPerDay * 10}/day</div>
      `;
      card.addEventListener('click', () => {
        state.selectedLevel = lvlNum;
        renderLevelGrid();
        showKeyPurchaseBox(lvlNum);
      });
      grid.appendChild(card);
    });
  }

  function showKeyPurchaseBox(lvlNum) {
    const cfg = LEVELS[lvlNum];
    const n = $('selectedLevelName'); if (n) n.textContent = cfg.name;
    const a = $('displayAmount');     if (a) a.textContent = `Ksh ${cfg.keyPrice.toLocaleString()}`;
    const c = $('mpesaCode');         if (c) c.value = '';
    const box = $('keyPurchaseBox');
    if (box) {
      box.classList.remove('hidden');
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // ============================================================
  // SUBMIT KEY
  // ============================================================
  const submitKeyBtn = $('submitKeyBtn');
  if (submitKeyBtn) submitKeyBtn.addEventListener('click', () => {
    const u = state.currentUser;
    if (!u) return toast('Please log in again', true);

    if (u.keyApproved) {
      return toast('You already have an active key. Upgrade instead of re-buying.');
    }

    const code = $('mpesaCode').value.trim().toUpperCase();
    if (!isValidMpesaCode(code))
      return toast('Invalid M-Pesa code. Use 10 letters/numbers e.g. QW45RT67Y9', true);

    const lvl = state.selectedLevel;
    const price = LEVELS[lvl].keyPrice;

    u.level = lvl;
    u.hasKey = false;
    u.keyApproved = false;
    u.pendingKey = true;
    u.status = 'Pending key verification';

    db.transactions.unshift({
      id: 't_' + Date.now(),
      userId: u.id,
      userEmail: u.email,
      type: 'key_purchase',
      level: lvl,
      amount: price,
      mpesaCode: code,
      status: 'pending',
      createdAt: Date.now()
    });

    saveDB();
    toast('Key submitted! Awaiting admin verification.');
    showUserDashboard();
  });

  const skipBtn = $('skipLevelBtn');
  if (skipBtn) skipBtn.addEventListener('click', () => {
    if (!state.currentUser) return;
    state.currentUser.hasKey = false;
    showUserDashboard();
  });

  // ============================================================
  // DAILY RESET
  // ============================================================
  function resetDailyIfNeeded(user) {
    const today = new Date().toDateString();
    if (user.lastInstallDate !== today) {
      user.appsInstalledToday = 0;
      user.installedToday = [];
      user.lastInstallDate = today;
      state.dailyApps = null;
      state.basket = null;
      saveDB();
    }
  }

  // ============================================================
  // USER DASHBOARD
  // ============================================================
  function renderUserDashboard() {
    const u = state.currentUser;
    if (!u) return;
    resetDailyIfNeeded(u);

    // Pre-fill withdrawal form with saved details (only if empty)
    const wNumEl = $('withdrawNumber');
    if (wNumEl && !wNumEl.value && u.withdrawPhone) {
      wNumEl.value = String(u.withdrawPhone).replace(/^\+254/, '').replace(/\D/g, '').slice(0, 9);
    }
    const wNameEl = $('withdrawName');
    if (wNameEl && !wNameEl.value && u.withdrawName) {
      wNameEl.value = u.withdrawName;
    }

    const lvl  = u.level || 1;
    const cfg  = LEVELS[lvl];
    const limit = cfg.appsPerDay;
    const remaining = Math.max(0, limit - u.appsInstalledToday);
    const unlocked = !!u.keyApproved;

    const lvlEl = $('userLevelDisplay');
    const remEl = $('remainingAppsDisplay');
    const balEl = $('userBalanceDisplay');
    if (lvlEl) lvlEl.textContent = `${cfg.name} · Ksh ${cfg.keyPrice.toLocaleString()}`;
    if (remEl) remEl.textContent = `${remaining} / ${limit} apps left today`;
    if (balEl) balEl.textContent = `Ksh ${(u.balance || 0).toFixed(2)}`;

    const buyKeyBtn = $('buyKeyBtn');
    if (buyKeyBtn) {
      if (!unlocked) buyKeyBtn.classList.remove('hidden');
      else buyKeyBtn.classList.add('hidden');
    }

    const banner = $('pendingBanner');
    if (banner) {
      if (u.pendingKey && !u.keyApproved) banner.classList.remove('hidden');
      else banner.classList.add('hidden');
    }

    // ---- referral section ----
    const refCount = db.users.filter(x => x.referredBy === u.id).length;
    const rcEl = $('referredCount'); if (rcEl) rcEl.textContent = refCount;

    // Lifetime referral earnings — always visible, never resets
    const lifetimeReferral = db.referrals
      .filter(r => r.referrerId === u.id && r.status === 'approved')
      .reduce((s, r) => s + (r.amount || 0), 0);

    if (u.referralEarnings !== lifetimeReferral) {
      u.referralEarnings = lifetimeReferral;
      saveDB();
    }

    const reEl = $('referralEarnings');
    if (reEl) reEl.value = `Ksh ${lifetimeReferral.toFixed(2)}`;

    const pendingAmt = db.referrals
      .filter(r => r.referrerId === u.id && r.status === 'pending')
      .reduce((s, r) => s + (r.amount || 0), 0);
    const prEl = $('pendingReferralAmount');
    if (prEl) prEl.textContent = `Ksh ${pendingAmt.toFixed(2)}`;

    // ---- user withdrawal history (inline list, if you render it) ----
    const wHistEl = $('userWithdrawHistory');
    if (wHistEl) {
      const myWithdrawals = db.withdrawals
        .filter(w => w.userId === u.id)
        .sort((a, b) => b.createdAt - a.createdAt);

      wHistEl.innerHTML = myWithdrawals.length
        ? myWithdrawals.map(w => `
            <div class="log-row">
              ${new Date(w.createdAt).toLocaleString()} · Ksh ${w.amount} · ${w.phone}<br>
              <span class="badge badge-${w.status === 'pending' ? 'pending' : (w.status === 'approved' ? 'approved' : 'rejected')}">
                ${w.status}
              </span>
            </div>
          `).join('')
        : '<div class="log-row text-muted">No withdrawals yet</div>';
    }

    // ---- daily pool ----
    if (!state.dailyApps ||
        state.dailyApps._email !== u.email ||
        state.dailyApps._date  !== getTodayKey()) {
      state.dailyApps = getDailyAppsForUser(u);
      state.dailyApps._email = u.email;
      state.dailyApps._date  = getTodayKey();
      state.basket = null;
    }

    // ---- fixed basket for today ----
    if (!state.basket ||
        state.basket._email !== u.email ||
        state.basket._date  !== getTodayKey() ||
        state.basket._level !== lvl) {
      const picked = state.dailyApps.slice(0, Math.min(limit, state.dailyApps.length));
      state.basket = picked;
      state.basket._email = u.email;
      state.basket._date  = getTodayKey();
      state.basket._level = lvl;
    }

    const container = $('appListContainer');
    if (!container) return;
    container.innerHTML = '';

    const installedIds = Array.isArray(u.installedToday) ? u.installedToday : [];

    state.basket.forEach(app => {
      const appId = app.id;
      const installation = state.activeInstallations[appId];
      const isInstalling = !!installation;
      const isDone = installedIds.includes(appId);
      const atLimit = u.appsInstalledToday >= limit;

      const item = document.createElement('div');
      item.className = 'app-item' + (!unlocked ? ' locked' : '') + (isDone ? ' installed' : '');

      const leftDiv = document.createElement('div');
      leftDiv.className = 'app-info';
      leftDiv.innerHTML = `
        <div class="app-icon">${app.icon}</div>
        <div>
          <div class="app-name">${app.name}</div>
          <span class="app-payout">Earn Ksh ${app.payout}</span>
        </div>
      `;

      const rightDiv = document.createElement('div');
      rightDiv.style.minWidth = '220px';
      rightDiv.style.display  = 'flex';
      rightDiv.style.justifyContent = 'flex-end';

      if (!unlocked) {
        const lock = document.createElement('button');
        lock.className = 'install-btn btn btn-sm';
        lock.textContent = u.pendingKey ? 'Awaiting approval' : 'Key required';
        lock.disabled = true;
        rightDiv.appendChild(lock);
      } else if (isDone) {
        const done = document.createElement('span');
        done.className = 'installed-chip';
        done.textContent = '✅ Installed';
        rightDiv.appendChild(done);
      } else if (isInstalling) {
        const progress = installation.progress || 0;
        rightDiv.innerHTML = `
          <div class="progress-row">
            <div class="progress-bar-bg">
              <div class="progress-fill" style="width:${progress}%;"></div>
            </div>
            <span class="progress-percent">${Math.floor(progress)}%</span>
          </div>
        `;
      } else {
        const btn = document.createElement('button');
        btn.className = 'install-btn btn btn-sm';
        btn.textContent = atLimit ? 'Limit reached' : 'Install';
        btn.disabled = atLimit;
        btn.addEventListener('click', () => startInstallation(app));
        rightDiv.appendChild(btn);
      }

      item.appendChild(leftDiv);
      item.appendChild(rightDiv);
      container.appendChild(item);
    });
  }

  // ============================================================
  // INSTALL
  // ============================================================
  function flashBalance() {
    const el = $('userBalanceDisplay');
    if (!el) return;
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 700);
  }

  function startInstallation(app) {
    const u = state.currentUser;
    if (!u) return;
    if (!u.keyApproved) return toast('Apps locked — key not yet approved', true);
    const cfg = LEVELS[u.level || 1];
    if (u.appsInstalledToday >= cfg.appsPerDay) return toast('Daily limit reached', true);

    const appId = app.id;
    if (state.activeInstallations[appId]) return;

    const duration = 30000;
    const startTime = Date.now();
    state.activeInstallations[appId] = { progress: 0, startTime, duration };

    const intervalId = setInterval(() => {
      const inst = state.activeInstallations[appId];
      if (!inst) { clearInterval(intervalId); return; }

      const elapsed = Date.now() - inst.startTime;
      inst.progress = Math.min(100, (elapsed / duration) * 100);

      if (state.currentUser && userDashboard && !userDashboard.classList.contains('hidden')) {
        renderUserDashboard();
      }

      if (inst.progress >= 100) {
        clearInterval(intervalId);
        delete state.activeInstallations[appId];

        u.appsInstalledToday++;
        u.balance = (u.balance || 0) + app.payout;

        if (!Array.isArray(u.installedToday)) u.installedToday = [];
        if (!u.installedToday.includes(appId)) u.installedToday.push(appId);

        saveDB();
        renderUserDashboard();
        flashBalance();
        toast(`Installed ${app.name}! +Ksh ${app.payout}`);
      }
    }, 150);

    state.activeInstallations[appId].intervalId = intervalId;
    renderUserDashboard();
  }

  // ============================================================
  // WITHDRAWAL — request
  // ============================================================
  const requestWithdrawBtn = $('requestWithdrawBtn');
  if (requestWithdrawBtn) requestWithdrawBtn.addEventListener('click', () => {
    const u = state.currentUser;
    if (!u) return;

    const amount = Number($('withdrawAmount').value);
    const phone9 = normalizePhone($('withdrawNumber').value);
    const name   = $('withdrawName').value.trim();

    if (!amount || amount < 100) return toast('Minimum withdrawal is Ksh 100', true);
    if (amount > (u.balance || 0)) return toast('Insufficient balance', true);
    if (phone9.length !== 9) return toast('Enter a valid 9-digit M-Pesa number', true);
    if (!name) return toast('Enter full name as per M-Pesa', true);

    const fullPhone = '+254' + phone9;

    // 💾 Save these details on the user's profile so they auto-fill next time
    u.withdrawPhone = fullPhone;
    u.withdrawName  = name;

    u.balance -= amount;
    u.status = 'Withdrawn';

    // Each request keeps its own immutable snapshot (phone + name at time of request)
    db.withdrawals.unshift({
      id: 'w_' + Date.now(),
      userId: u.id,
      userEmail: u.email,
      amount,
      phone: fullPhone,
      name,
      status: 'pending',
      createdAt: Date.now()
    });

    db.transactions.unshift({
      id: 't_' + Date.now(),
      userId: u.id,
      userEmail: u.email,
      type: 'withdrawal',
      amount: -amount,
      status: 'pending',
      createdAt: Date.now()
    });

    saveDB();
    renderUserDashboard();
    $('withdrawAmount').value = '';
    $('withdrawNumber').value = '';
    $('withdrawName').value = '';
    toast('Withdrawal request submitted (24hr processing, Mon–Fri)');
  });

  // ============================================================
  // WITHDRAWAL — history toggle (independent, always works)
  // ============================================================
  const toggleWithdrawHistory = $('toggleWithdrawHistory');
  if (toggleWithdrawHistory) {
    toggleWithdrawHistory.addEventListener('click', (e) => {
      e.preventDefault();

      const box = $('withdrawHistoryBox');
      if (!box) return;

      // Rebuild history content from DB every time the user opens it
      const u = state.currentUser;
      const hist = $('userWithdrawHistory');
      if (hist && u) {
        const myWithdrawals = db.withdrawals
          .filter(w => w.userId === u.id)
          .sort((a, b) => b.createdAt - a.createdAt);

        hist.innerHTML = myWithdrawals.length
          ? myWithdrawals.map(w => `
              <div class="log-row">
                ${new Date(w.createdAt).toLocaleString()} · Ksh ${w.amount} · ${w.phone}<br>
                <span class="badge badge-${w.status === 'pending' ? 'pending' : (w.status === 'approved' ? 'approved' : 'rejected')}">
                  ${w.status}
                </span>
              </div>
            `).join('')
          : '<div class="log-row text-muted">No withdrawals yet</div>';
      }

      const isHidden = box.classList.contains('hidden');
      if (isHidden) {
        box.classList.remove('hidden');
        toggleWithdrawHistory.textContent = '📜 Hide Withdrawal History';
      } else {
        box.classList.add('hidden');
        toggleWithdrawHistory.textContent = '📜 View Withdrawal History';
      }
    });
  }

  // ============================================================
  // UPGRADE
  // ============================================================
  const upgradeLevelBtn = $('upgradeLevelBtn');
  if (upgradeLevelBtn) upgradeLevelBtn.addEventListener('click', () => {
    hideAll();
    if (upgradeScreen) upgradeScreen.classList.remove('hidden');
    stopAppStrip();
    renderUpgradeGrid();
    const pb = $('upgradePaybill'); if (pb) pb.textContent = db.settings.paybill;
    const ac = $('upgradeAcc');     if (ac) ac.textContent = db.settings.account;
    const box = $('upgradePurchaseBox'); if (box) box.classList.add('hidden');
  });

  const backFromUpgrade = $('backFromUpgrade');
  if (backFromUpgrade) backFromUpgrade.addEventListener('click', () => showUserDashboard());

  function renderUpgradeGrid() {
    const grid = $('upgradeGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const currentLvl = (state.currentUser && state.currentUser.level) || 1;

    Object.entries(LEVELS).forEach(([lvl, cfg]) => {
      const lvlNum = Number(lvl);
      if (lvlNum <= currentLvl) return;

      const card = document.createElement('div');
      card.className = 'plan-card' + (state.selectedUpgradeLevel === lvlNum ? ' selected' : '');
      card.innerHTML = `
        <h3>${cfg.name}</h3>
        <div class="plan-price">Ksh ${cfg.keyPrice.toLocaleString()}</div>
        <div class="plan-apps">${cfg.appsPerDay} apps / day</div>
        <div class="text-muted mt-1">Upgrade price</div>
      `;
      card.addEventListener('click', () => {
        state.selectedUpgradeLevel = lvlNum;
        renderUpgradeGrid();
        const n = $('upgradeLevelName'); if (n) n.textContent = cfg.name;
        const a = $('upgradeAmount');    if (a) a.textContent = `Ksh ${cfg.keyPrice.toLocaleString()}`;
        const c = $('upgradeMpesaCode'); if (c) c.value = '';
        const box = $('upgradePurchaseBox');
        if (box) {
          box.classList.remove('hidden');
          box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      grid.appendChild(card);
    });

    if (!grid.children.length) {
      grid.innerHTML = '<p class="text-muted">You are already at the highest level.</p>';
    }
  }

  const submitUpgradeBtn = $('submitUpgradeBtn');
  if (submitUpgradeBtn) submitUpgradeBtn.addEventListener('click', () => {
    const u = state.currentUser;
    if (!u) return;
    const code = $('upgradeMpesaCode').value.trim().toUpperCase();
    const newLvl = state.selectedUpgradeLevel;

    if (!newLvl) return toast('Select a level to upgrade to', true);
    if (!isValidMpesaCode(code))
      return toast('Invalid M-Pesa code. Use 10 letters/numbers', true);

    const price = LEVELS[newLvl].keyPrice;
    u.level = newLvl;
    u.appsInstalledToday = 0;
    u.installedToday = [];
    u.lastInstallDate = new Date().toDateString();
    u.status = 'Pending upgrade verification';
    u.keyApproved = false;
    u.pendingKey = true;
    state.basket = null;

    db.transactions.unshift({
      id: 't_' + Date.now(),
      userId: u.id,
      userEmail: u.email,
      type: 'upgrade',
      level: newLvl,
      amount: price,
      mpesaCode: code,
      status: 'pending',
      createdAt: Date.now()
    });

    saveDB();
    toast('Upgrade submitted! Awaiting admin verification.');
    showUserDashboard();
  });

  // ============================================================
  // LOGOUT
  // ============================================================
  const logoutUserBtn = $('logoutUserBtn');
  if (logoutUserBtn) logoutUserBtn.addEventListener('click', () => {
    stopAppStrip();
    for (const id in state.activeInstallations) {
      const inst = state.activeInstallations[id];
      if (inst && inst.intervalId) clearInterval(inst.intervalId);
    }
    state.dailyApps = null;
    state.basket = null;
    state.activeInstallations = {};
    state.currentUser = null;
    state.currentUserId = null;
    state.isAdmin = false;
    hideAll();
    if (authScreen) authScreen.classList.remove('hidden');
  });

  const logoutAdminBtn = $('logoutAdminBtn');
  if (logoutAdminBtn) logoutAdminBtn.addEventListener('click', () => {
    state.dailyApps = null;
    state.basket = null;
    state.isAdmin = false;
    state.currentUser = null;
    state.currentUserId = null;
    hideAll();
    if (authScreen) authScreen.classList.remove('hidden');
  });

  // ============================================================
  // ADMIN TABS
  // ============================================================
  document.querySelectorAll('[data-admin-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-admin-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.adminTab;

      ['adminOverview','adminUsers','adminKeys','adminTransactions',
       'adminWithdrawals','adminReferrals','adminSettings']
        .forEach(id => { const el = $(id); if (el) el.classList.add('hidden'); });

      const map = {
        overview: 'adminOverview',
        users: 'adminUsers',
        keys: 'adminKeys',
        transactions: 'adminTransactions',
        withdrawals: 'adminWithdrawals',
        referrals: 'adminReferrals',
        settings: 'adminSettings'
      };
      const target = $(map[tab]);
      if (target) target.classList.remove('hidden');
    });
  });

  // ============================================================
  // ADMIN RENDER
  // ============================================================
  function renderAdminPanel() {
    // ---- stats ----
    const sUsers = $('statUsers'); if (sUsers) sUsers.textContent = db.users.length;
    const keysSold = db.transactions
      .filter(t => (t.type === 'key_purchase' || t.type === 'upgrade') && t.status === 'completed')
      .length;
    const sKeys = $('statKeys'); if (sKeys) sKeys.textContent = keysSold;
    const revenue = db.transactions
      .filter(t => (t.type === 'key_purchase' || t.type === 'upgrade') && t.status === 'completed')
      .reduce((s, t) => s + (t.amount || 0), 0);
    const sRev = $('statRevenue'); if (sRev) sRev.textContent = `Ksh ${revenue.toLocaleString()}`;
    const sWd = $('statWithdrawals');
    if (sWd) sWd.textContent = db.withdrawals.filter(w => w.status === 'pending').length;
    const pendingKeys = db.transactions
      .filter(t => (t.type === 'key_purchase' || t.type === 'upgrade') && t.status === 'pending')
      .length;
    const sPk = $('statPendingKeys'); if (sPk) sPk.textContent = pendingKeys;

    // ---- logins ----
    const lEl = $('adminUserLogins');
    if (lEl) lEl.innerHTML = db.logins.length
      ? db.logins.slice(0, 15).map(l =>
          `<div class="log-row">${l.email} · ${l.type} · ${new Date(l.time).toLocaleString()}</div>`
        ).join('')
      : '<div class="log-row text-muted">No logins yet</div>';

    // ---- codes ----
    const codes = db.transactions.filter(t => t.mpesaCode);
    const cEl = $('adminMpesaCodes');
    if (cEl) cEl.innerHTML = codes.length
      ? codes.slice(0, 15).map(t =>
          `<div class="log-row">
            <strong>${t.mpesaCode}</strong> · Ksh ${t.amount} · ${t.userEmail}
            <span class="badge badge-${t.status === 'pending' ? 'pending' : 'approved'}">${t.status}</span>
          </div>`
        ).join('')
      : '<div class="log-row text-muted">No codes yet</div>';

    // ---- pending referrals ----
    const pendingRefs = db.referrals.filter(r => r.status === 'pending');
    const prEl = $('adminPendingReferrals');
    if (prEl) prEl.innerHTML = pendingRefs.length
      ? pendingRefs.slice(0, 10).map(r =>
          `<div class="log-row">
            <strong>${r.referrerEmail || 'user'}</strong> ← ${r.referredEmail} · Ksh ${r.amount.toFixed(2)}
            <button class="btn btn-sm btn-success" onclick="window.__approveRef('${r.id}')">Approve</button>
          </div>`
        ).join('')
      : '<div class="log-row text-muted">No pending referrals</div>';

    // ---- users ----
    const ulEl = $('adminUsersList');
    if (ulEl) ulEl.innerHTML = db.users.map(u => {
      const savedPhone = u.withdrawPhone || '—';
      const savedName  = u.withdrawName  || '—';

      const pastReqs = db.withdrawals
        .filter(w => w.userId === u.id)
        .sort((a, b) => b.createdAt - a.createdAt);

      const historyHtml = pastReqs.length
        ? pastReqs.map(w => `
            <div class="log-row" style="border-left:2px solid #2c7050;padding-left:8px;margin-top:6px;">
              <span class="text-muted">${new Date(w.createdAt).toLocaleString()}</span><br>
              Ksh ${w.amount} → <strong>${w.name}</strong> · ${w.phone}
              <span class="badge badge-${w.status === 'pending' ? 'pending' : (w.status === 'approved' ? 'approved' : 'rejected')}">${w.status}</span>
            </div>
          `).join('')
        : '<div class="text-muted" style="margin-top:6px;font-size:0.78rem;">No withdrawal requests yet</div>';

      return `
        <div class="log-row">
          <strong>${u.name}</strong> · ${u.email} · +254${u.phone}<br>
          Level ${u.level || 1} · Balance Ksh ${(u.balance || 0).toFixed(2)} · Status:
          <span class="badge badge-active">${u.status || 'Active'}</span>
          ${u.keyApproved ? ' · <span class="badge badge-approved">Key verified</span>' : ''}

          <div style="margin-top:8px;padding:8px;background:#0b1420;border-radius:10px;font-size:0.78rem;">
            <strong style="color:#9bc2ff;">Current saved withdrawal details</strong><br>
            Name: <strong>${savedName}</strong> · M-Pesa: <strong>${savedPhone}</strong>
          </div>

          <div style="margin-top:6px;font-size:0.78rem;">
            <strong style="color:#9bc2ff;">Withdrawal request history (${pastReqs.length})</strong>
            ${historyHtml}
          </div>

          <div class="mt-1">
            <button class="btn btn-sm" onclick="window.__setStatus('${u.id}','Key bought')">Key bought</button>
            <button class="btn btn-sm" onclick="window.__setStatus('${u.id}','Withdrawn')">Withdrawn</button>
            <button class="btn btn-sm" onclick="window.__setStatus('${u.id}','Upgraded')">Upgraded</button>
            <button class="btn btn-sm btn-danger" onclick="window.__deleteUser('${u.id}')">🗑 Delete</button>
          </div>
        </div>
      `;
    }).join('');

    // ---- key approvals ----
    const pendingKeyTx = db.transactions.filter(t =>
      (t.type === 'key_purchase' || t.type === 'upgrade') && t.status === 'pending'
    );
    const kEl = $('adminKeysList');
    if (kEl) kEl.innerHTML = pendingKeyTx.length
      ? pendingKeyTx.map(t => {
          const user = db.users.find(u => u.id === t.userId);
          return `
            <div class="log-row">
              <strong>${user ? user.name : 'Unknown'}</strong> · ${t.userEmail}<br>
              ${t.type === 'upgrade' ? 'Upgrade' : 'Key purchase'} · Level ${t.level} · Ksh ${t.amount}<br>
              M-Pesa code: <strong style="color:#9bc2ff">${t.mpesaCode}</strong> ·
              <span class="badge badge-pending">pending</span>
              <div class="mt-1">
                <button class="btn btn-sm btn-success" onclick="window.__approveKey('${t.id}')">Approve</button>
                <button class="btn btn-sm btn-danger" onclick="window.__rejectKey('${t.id}')">Reject</button>
              </div>
            </div>
          `;
        }).join('')
      : '<div class="log-row text-muted">No pending key approvals</div>';

    // ---- transactions (grouped) ----
    const txEl = $('adminTransactionsList');
    if (txEl) {
      const groups = [
        { key: 'key_purchase',        title: '🔑 Key Purchases' },
        { key: 'upgrade',             title: '⬆️ Level Upgrades' },
        { key: 'withdrawal',          title: '💰 Withdrawals' },
        { key: 'referral_commission', title: '🤝 Referral Commissions' }
      ];
      const safeTx = db.transactions.filter(t => t.type !== 'install');

      if (!safeTx.length) {
        txEl.innerHTML = '<div class="log-row text-muted">No transactions yet</div>';
      } else {
        txEl.innerHTML = groups.map(g => {
          const rows = safeTx
            .filter(t => t.type === g.key)
            .sort((a, b) => b.createdAt - a.createdAt);
          if (!rows.length) return '';
          return `
            <div style="margin-bottom:18px;">
              <div style="font-weight:600;color:#9bc2ff;margin-bottom:6px;">${g.title} (${rows.length})</div>
              ${rows.map(t => `
                <div class="log-row">
                  ${new Date(t.createdAt).toLocaleString()} · Ksh ${t.amount} · ${t.userEmail}
                  ${t.mpesaCode ? ' · Code: ' + t.mpesaCode : ''}
                  ${t.level ? ' · L' + t.level : ''}
                  · <span class="badge badge-${t.status === 'pending' ? 'pending' : 'approved'}">${t.status}</span>
                </div>
              `).join('')}
            </div>
          `;
        }).join('') || '<div class="log-row text-muted">No transactions yet</div>';
      }
    }

    // ---- withdrawals ----
    const wEl = $('adminWithdrawalsList');
    if (wEl) wEl.innerHTML = db.withdrawals.length
      ? db.withdrawals.map(w => `
          <div class="log-row">
            <strong>${w.name}</strong> · ${w.phone} · Ksh ${w.amount} ·
            <span class="badge badge-${w.status === 'pending' ? 'pending' : 'approved'}">${w.status}</span>
            ${w.status === 'pending'
              ? `<button class="btn btn-sm btn-success" onclick="window.__approveWithdraw('${w.id}')">Approve</button>`
              : ''}
          </div>
        `).join('')
      : '<div class="log-row text-muted">No withdrawals yet</div>';

    // ---- referrals ----
    const rEl = $('adminReferralsList');
    if (rEl) rEl.innerHTML = db.referrals.length
      ? db.referrals.map(r => `
          <div class="log-row">
            ${r.referrerEmail || 'referrer'} ← ${r.referredEmail} · Ksh ${r.amount.toFixed(2)}
            <span class="badge badge-${r.status === 'pending' ? 'pending' : 'approved'}">${r.status}</span>
            ${r.status === 'pending'
              ? `<button class="btn btn-sm btn-success" onclick="window.__approveRef('${r.id}')">Approve</button>`
              : ''}
          </div>
        `).join('')
      : '<div class="log-row text-muted">No referrals yet</div>';

    // ---- settings ----
    const pbI = $('paybillInput'); if (pbI) pbI.value = db.settings.paybill;
    const acI = $('accInput');     if (acI) acI.value = db.settings.account;
  }

  // ============================================================
  // ADMIN ACTIONS
  // ============================================================
  window.__approveRef = function (id) {
    const r = db.referrals.find(x => x.id === id);
    if (!r || r.status !== 'pending') return;
    r.status = 'approved';

    const referrer = db.users.find(u => u.id === r.referrerId);
    if (referrer) {
      referrer.balance = (referrer.balance || 0) + r.amount;
      referrer.referralEarnings = (referrer.referralEarnings || 0) + r.amount;

      if (state.currentUser && state.currentUser.id === referrer.id) {
        state.currentUser = referrer;
        renderUserDashboard();
        flashBalance();
      }
    }

    db.transactions.unshift({
      id: 't_' + Date.now(),
      userId: r.referrerId,
      userEmail: r.referrerEmail || 'referrer',
      type: 'referral_commission',
      amount: r.amount,
      status: 'completed',
      createdAt: Date.now()
    });
    saveDB(); renderAdminPanel();
    toast('Referral approved!');
  };

  window.__approveWithdraw = function (id) {
    const w = db.withdrawals.find(x => x.id === id);
    if (!w || w.status !== 'pending') return;
    w.status = 'approved';
    saveDB(); renderAdminPanel(); toast('Withdrawal approved!');
  };

  window.__setStatus = function (userId, status) {
    const u = db.users.find(x => x.id === userId);
    if (!u) return;
    u.status = status;
    saveDB(); renderAdminPanel(); toast(`User status set to: ${status}`);
  };

  window.__approveKey = function (txId) {
    const tx = db.transactions.find(t => t.id === txId);
    if (!tx || tx.status !== 'pending') return;
    tx.status = 'completed';

    const u = db.users.find(x => x.id === tx.userId);
    if (u) {
      u.keyApproved = true;
      u.hasKey = true;
      u.pendingKey = false;
      u.appsInstalledToday = 0;
      u.installedToday = [];
      u.lastInstallDate = new Date().toDateString();
      u.status = tx.type === 'upgrade' ? 'Upgraded' : 'Key bought';
      state.basket = null;

      if (u.referredBy) {
        const referrer = db.users.find(x => x.id === u.referredBy);
        if (referrer) {
          db.referrals.push({
            id: 'r_' + Date.now(),
            referrerId: referrer.id,
            referrerEmail: referrer.email,
            referredUserId: u.id,
            referredEmail: u.email,
            amount: tx.amount * 0.30,
            status: 'pending',
            createdAt: Date.now()
          });
        }
      }
    }
    saveDB(); renderAdminPanel();
    toast('Key approved — user apps unlocked');
  };

  window.__rejectKey = function (txId) {
    const tx = db.transactions.find(t => t.id === txId);
    if (!tx || tx.status !== 'pending') return;
    tx.status = 'rejected';
    const u = db.users.find(x => x.id === tx.userId);
    if (u) {
      u.pendingKey = false;
      u.keyApproved = false;
      u.hasKey = false;
      u.status = 'Key rejected';
    }
    saveDB(); renderAdminPanel();
    toast('Key rejected', true);
  };

  window.__deleteUser = function (userId) {
    const u = db.users.find(x => x.id === userId);
    if (!u) return;
    if (u.email === ADMIN_EMAIL) return toast('Cannot delete the admin account', true);

    const confirmMsg = `Delete "${u.name}" (${u.email}) and ALL their records?\n\n` +
      `• Transactions\n• Withdrawals\n• Referral entries\n• Login history\n\nThis cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    db.transactions = db.transactions.filter(t => t.userId !== userId && t.userEmail !== u.email);
    db.withdrawals = db.withdrawals.filter(w => w.userId !== userId && w.userEmail !== u.email);
    db.referrals = db.referrals.filter(r =>
      r.referrerId !== userId &&
      r.referredUserId !== userId &&
      r.referrerEmail !== u.email &&
      r.referredEmail !== u.email
    );
    db.logins = db.logins.filter(l => l.email !== u.email);
    db.users = db.users.filter(x => x.id !== userId);

    if (state.currentUser && state.currentUser.id === userId) {
      state.currentUser = null;
      state.currentUserId = null;
      state.isAdmin = false;
      state.dailyApps = null;
      state.basket = null;
      hideAll();
      if (authScreen) authScreen.classList.remove('hidden');
    }
    saveDB();
    renderAdminPanel();
    toast('User and all associated records deleted');
  };

  const savePaybillBtn = $('savePaybillBtn');
  if (savePaybillBtn) savePaybillBtn.addEventListener('click', () => {
    db.settings.paybill = $('paybillInput').value.trim() || '400200';
    db.settings.account = $('accInput').value.trim() || 'APPCLOUD';
    saveDB();
    toast('Settings saved!');
  });

  // ============================================================
  // APP STRIP
  // ============================================================
  const STRIP_APPS = [
    { name: 'WhatsApp', icon: '💬' }, { name: 'Instagram', icon: '📸' }, { name: 'TikTok', icon: '🎵' },
    { name: 'Facebook', icon: '📘' }, { name: 'YouTube', icon: '▶️' }, { name: 'Spotify', icon: '🎧' },
    { name: 'Netflix', icon: '🎬' }, { name: 'X', icon: '🐦' }, { name: 'Snapchat', icon: '👻' },
    { name: 'Telegram', icon: '✈️' }, { name: 'Pinterest', icon: '📌' }, { name: 'Reddit', icon: '🤖' },
    { name: 'Discord', icon: '🎮' }, { name: 'Twitch', icon: '🟣' }, { name: 'LinkedIn', icon: '💼' },
    { name: 'Zoom', icon: '📹' }, { name: 'Slack', icon: '💬' }, { name: 'Notion', icon: '📝' },
    { name: 'Figma', icon: '🎨' }, { name: 'Canva', icon: '🖼️' }, { name: 'Dropbox', icon: '📦' },
    { name: 'Google Drive', icon: '🗂️' }, { name: 'Gmail', icon: '📧' }, { name: 'Maps', icon: '🗺️' },
    { name: 'Uber', icon: '🚗' }, { name: 'Bolt', icon: '⚡' }, { name: 'Airbnb', icon: '🏠' },
    { name: 'Booking.com', icon: '🏨' }, { name: 'Amazon', icon: '🛒' }, { name: 'eBay', icon: '🏷️' },
    { name: 'AliExpress', icon: '📦' }, { name: 'Shopify', icon: '🛍️' }, { name: 'PayPal', icon: '💳' },
    { name: 'Revolut', icon: '💠' }, { name: 'Binance', icon: '🪙' }, { name: 'Coinbase', icon: '🔵' },
    { name: 'Kraken', icon: '🐙' }, { name: 'MetaMask', icon: '🦊' }, { name: 'Trust Wallet', icon: '🛡️' },
    { name: 'M-Pesa', icon: '📲' }, { name: 'Airtel Money', icon: '🔴' }, { name: 'Equity Bank', icon: '🏦' },
    { name: 'KCB', icon: '🏦' }, { name: 'Mpesa App', icon: '💚' }, { name: 'Chrome', icon: '🌐' },
    { name: 'Firefox', icon: '🦊' }, { name: 'Edge', icon: '🌊' }, { name: 'Safari', icon: '🧭' },
    { name: 'Opera', icon: '🎭' }, { name: 'Brave', icon: '🦁' }, { name: 'VLC', icon: '🎞️' },
    { name: 'Spotify Kids', icon: '🧸' }, { name: 'Audible', icon: '🎙️' }, { name: 'Kindle', icon: '📖' },
    { name: 'Goodreads', icon: '📚' }, { name: 'Duolingo', icon: '🦉' }, { name: 'Khan Academy', icon: '🎓' },
    { name: 'Coursera', icon: '📘' }, { name: 'Udemy', icon: '🎯' }, { name: 'Skillshare', icon: '🎨' },
    { name: 'Medium', icon: '✍️' }, { name: 'Substack', icon: '📰' }, { name: 'Quora', icon: '❓' },
    { name: 'Stack Overflow', icon: '💻' }, { name: 'GitHub', icon: '🐙' }, { name: 'GitLab', icon: '🦊' },
    { name: 'Bitbucket', icon: '🪣' }, { name: 'Vercel', icon: '▲' }, { name: 'Netlify', icon: '🟢' },
    { name: 'Cloudflare', icon: '☁️' }, { name: 'AWS', icon: '🟠' }, { name: 'Azure', icon: '🔷' },
    { name: 'GCP', icon: '🔵' }, { name: 'DigitalOcean', icon: '🌊' }, { name: 'Linode', icon: '🟩' },
    { name: 'Heroku', icon: '🟣' }, { name: 'Render', icon: '🎨' }, { name: 'Railway', icon: '🚂' },
    { name: 'Supabase', icon: '⚡' }, { name: 'Firebase', icon: '🔥' }, { name: 'MongoDB', icon: '🍃' },
    { name: 'Postgres', icon: '🐘' }, { name: 'MySQL', icon: '🐬' }, { name: 'Redis', icon: '🔴' },
    { name: 'Docker', icon: '🐳' }, { name: 'Kubernetes', icon: '☸️' }, { name: 'Terraform', icon: '🏗️' },
    { name: 'Ansible', icon: '⚙️' }, { name: 'Jenkins', icon: '🤵' }, { name: 'CircleCI', icon: '⭕' },
    { name: 'Travis CI', icon: '🚦' }, { name: 'Postman', icon: '📮' }, { name: 'Insomnia', icon: '🌙' },
    { name: 'Swagger', icon: '🦢' }, { name: 'GraphQL', icon: '🕸️' }, { name: 'Apollo', icon: '🚀' },
    { name: 'Prisma', icon: '🔺' }, { name: 'Drizzle', icon: '💧' }, { name: 'TypeORM', icon: '📘' },
    { name: 'Sequelize', icon: '🔷' }, { name: 'Mongoose', icon: '🐹' }, { name: 'NestJS', icon: '🐱' },
    { name: 'Next.js', icon: '▲' }, { name: 'Nuxt', icon: '🟩' }, { name: 'SvelteKit', icon: '🔥' },
    { name: 'Remix', icon: '💿' }, { name: 'Astro', icon: '🚀' }, { name: 'Vite', icon: '⚡' },
    { name: 'Webpack', icon: '📦' }, { name: 'Rollup', icon: '🎯' }, { name: 'Parcel', icon: '📦' },
    { name: 'esbuild', icon: '⚡' }, { name: 'Bun', icon: '🥟' }, { name: 'Deno', icon: '🦕' },
    { name: 'Node.js', icon: '🟢' }, { name: 'React', icon: '⚛️' }, { name: 'Vue', icon: '🟩' },
    { name: 'Angular', icon: '🅰️' }, { name: 'Svelte', icon: '🔥' }, { name: 'Solid', icon: '🔷' },
    { name: 'Qwik', icon: '⚡' }, { name: 'Preact', icon: '⚛️' }, { name: 'Lit', icon: '🔥' },
    { name: 'Alpine', icon: '🏔️' }, { name: 'HTMX', icon: '🔗' }, { name: 'Tailwind', icon: '🌬️' },
    { name: 'Bootstrap', icon: '🅱️' }, { name: 'Material UI', icon: '🎨' }, { name: 'Chakra UI', icon: '⚡' },
    { name: 'Ant Design', icon: '🐜' }, { name: 'Mantine', icon: '🎭' }, { name: 'Radix', icon: '🔺' },
    { name: 'Shadcn UI', icon: '🎨' }, { name: 'Headless UI', icon: '👻' }, { name: 'Framer Motion', icon: '🎞️' },
    { name: 'GSAP', icon: '🎬' }, { name: 'Three.js', icon: '🎲' }, { name: 'Babylon.js', icon: '🏛️' },
    { name: 'D3.js', icon: '📊' }, { name: 'Chart.js', icon: '📈' }, { name: 'ECharts', icon: '📉' },
    { name: 'Recharts', icon: '📊' }, { name: 'Mapbox', icon: '🗺️' }, { name: 'Leaflet', icon: '🍃' },
    { name: 'OpenLayers', icon: '🌍' }, { name: 'Turf.js', icon: '🌱' }, { name: 'Socket.io', icon: '🔌' },
    { name: 'Pusher', icon: '📡' }, { name: 'Ably', icon: '⚡' }, { name: 'Supabase RT', icon: '⚡' },
    { name: 'Firebase RT', icon: '🔥' }, { name: 'Amplify', icon: '📱' }, { name: 'Appwrite', icon: '🅰️' },
    { name: 'Nhost', icon: '🟣' }, { name: 'PocketBase', icon: '📮' }, { name: 'Directus', icon: '🎯' },
    { name: 'Strapi', icon: '🚀' }, { name: 'Sanity', icon: '🧠' }, { name: 'Contentful', icon: '📝' },
    { name: 'Prismic', icon: '🔷' }, { name: 'Storyblok', icon: '📖' }, { name: 'WordPress', icon: '📰' },
    { name: 'Webflow', icon: '🌊' }, { name: 'Framer', icon: '🎞️' }, { name: 'Wix', icon: '🟡' },
    { name: 'Squarespace', icon: '⬛' }, { name: 'Shopify Plus', icon: '🛍️' }, { name: 'WooCommerce', icon: '🛒' },
    { name: 'Magento', icon: '🟠' }, { name: 'BigCommerce', icon: '🔵' }, { name: 'PrestaShop', icon: '🟣' },
    { name: 'OpenCart', icon: '🛒' }, { name: 'Stripe', icon: '💳' }, { name: 'Razorpay', icon: '💠' },
    { name: 'Paystack', icon: '💰' }, { name: 'Flutterwave', icon: '🌊' }, { name: 'Pesapal', icon: '📲' },
    { name: 'IntaSend', icon: '📤' }, { name: 'PayU', icon: '💳' }, { name: 'Adyen', icon: '🏦' },
    { name: 'Klarna', icon: '🛍️' }, { name: 'Affirm', icon: '✅' }, { name: 'Afterpay', icon: '🅰️' },
    { name: 'Zip', icon: '⚡' }, { name: 'M-Pesa Global', icon: '🌍' }, { name: 'Wave', icon: '🌊' },
    { name: 'Chipper Cash', icon: '💵' }, { name: 'Kuda', icon: '🟣' }, { name: 'Monzo', icon: '🟠' },
    { name: 'N26', icon: '⬛' }, { name: 'Wise', icon: '🟢' }, { name: 'Payoneer', icon: '🟠' },
    { name: 'Skrill', icon: '🟣' }, { name: 'Neteller', icon: '🔷' }, { name: 'Payeer', icon: '💳' },
    { name: 'Perfect Money', icon: '💵' }, { name: 'AdvCash', icon: '💰' }
  ];

  let stripInitialized = false;

  function buildStrip(stripEl, apps) {
    if (!stripEl) return;
    stripEl.innerHTML = '';
    for (let rep = 0; rep < 2; rep++) {
      apps.forEach(app => {
        const el = document.createElement('div');
        el.className = 'strip-app';
        el.innerHTML = `
          <div class="strip-icon">${app.icon}</div>
          <div class="strip-name">${app.name}</div>
        `;
        stripEl.appendChild(el);
      });
    }
  }

  function startAppStrip() {
    if (stripInitialized) return;
    const strip1 = $('appStrip');
    const strip2 = $('appStrip2');
    if (!strip1 || !strip2) return;
    buildStrip(strip1, STRIP_APPS);
    const reversed = [...STRIP_APPS].reverse();
    buildStrip(strip2, reversed);
    stripInitialized = true;
  }

  function stopAppStrip() {
    stripInitialized = false;
  }

  // ============================================================
  // URL REFERRAL
  // ============================================================
  const urlParams = new URLSearchParams(location.search);
  const refEmail = urlParams.get('ref');
  if (refEmail) {
    const rr = $('regReferral'); if (rr) rr.value = normalizeEmail(refEmail);
    const regTab = document.querySelector('.auth-tab[data-tab="register"]');
    if (regTab) regTab.click();
  }

  // Buy Key button
  const buyKeyBtnEl = $('buyKeyBtn');
  if (buyKeyBtnEl) {
    buyKeyBtnEl.addEventListener('click', () => {
      const u = state.currentUser;
      if (!u) return;
      if (u.keyApproved) {
        toast('You already have an active key. Use Upgrade to move to a higher level.');
        return;
      }
      if (u.status === 'Key rejected') u.pendingKey = false;
      showLevelSelection();
    });
  }

  // ============================================================
  // INIT
  // ============================================================
  hideAll();
  if (authScreen) authScreen.classList.remove('hidden');

  window.__appCloud = { state, db, DB, saveDB, LEVELS, APPS };
})();