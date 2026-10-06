/* ================================================================
   AppCloud · Download Hub — app.js  (Firebase + real brand icons)
   ================================================================ */
(function () {
  'use strict';

  // ============================================================
  // WAIT FOR FIREBASE
  // ============================================================
  function firebaseReady() {
    return new Promise(resolve => {
      if (window.firebaseReady && window.firebase) return resolve();
      window.addEventListener('firebase-ready', () => resolve(), { once: true });
    });
  }

  // ============================================================
  // STATE
  // ============================================================
  const state = {
    currentUser: null,
    isAdmin: false,
    activeInstallations: {},
    selectedLevel: 1,
    selectedUpgradeLevel: null,
    dailyApps: null,
    basket: null,
    allUsers: [],
    allTransactions: [],
    allWithdrawals: [],
    allReferrals: [],
    userTxs: [],
    userWithdrawals: [],
    userReferrals: [],
    settings: { paybill: '400200', account: 'APPCLOUD' }
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
    const apps = [];
    let counter = 0;
    for (let pass = 1; pass <= 10; pass++) {
      baseNames.forEach(base => {
        counter++;
        const name = pass === 1 ? base : `${base} ${pass}`;
        apps.push({ id: 'app' + counter, name, payout: 10 });
      });
    }
    return apps;
  })();

  // ============================================================
  // BRAND DOMAINS — maps app name → domain for real logo
  // ============================================================
  const BRAND_DOMAINS = {
    'WhatsApp': 'whatsapp.com', 'Instagram': 'instagram.com', 'TikTok': 'tiktok.com',
    'Facebook': 'facebook.com', 'YouTube': 'youtube.com', 'Spotify': 'spotify.com',
    'Netflix': 'netflix.com', 'X': 'x.com', 'Snapchat': 'snapchat.com',
    'Telegram': 'telegram.org', 'Pinterest': 'pinterest.com', 'Reddit': 'reddit.com',
    'Discord': 'discord.com', 'Twitch': 'twitch.tv', 'LinkedIn': 'linkedin.com',
    'Zoom': 'zoom.us', 'Slack': 'slack.com', 'Notion': 'notion.so',
    'Figma': 'figma.com', 'Canva': 'canva.com', 'Dropbox': 'dropbox.com',
    'Google Drive': 'drive.google.com', 'Gmail': 'mail.google.com', 'Maps': 'maps.google.com',
    'Uber': 'uber.com', 'Bolt': 'bolt.eu', 'Airbnb': 'airbnb.com',
    'Booking': 'booking.com', 'Amazon': 'amazon.com', 'eBay': 'ebay.com',
    'AliExpress': 'aliexpress.com', 'Shopify': 'shopify.com', 'PayPal': 'paypal.com',
    'Revolut': 'revolut.com', 'Binance': 'binance.com', 'Coinbase': 'coinbase.com',
    'Kraken': 'kraken.com', 'MetaMask': 'metamask.io', 'Trust Wallet': 'trustwallet.com',
    'M-Pesa': 'safaricom.co.ke', 'Airtel Money': 'airtel.co.ke',
    'Equity Bank': 'equitygroupholdings.com', 'KCB': 'kcbgroup.com',
    'Chrome': 'google.com', 'Firefox': 'mozilla.org', 'Edge': 'microsoft.com',
    'Safari': 'apple.com', 'Opera': 'opera.com', 'Brave': 'brave.com',
    'VLC': 'videolan.org', 'Audible': 'audible.com', 'Kindle': 'amazon.com',
    'Goodreads': 'goodreads.com', 'Duolingo': 'duolingo.com', 'Khan Academy': 'khanacademy.org',
    'Coursera': 'coursera.org', 'Udemy': 'udemy.com', 'Skillshare': 'skillshare.com',
    'Medium': 'medium.com', 'Substack': 'substack.com', 'Quora': 'quora.com',
    'Stack Overflow': 'stackoverflow.com', 'GitHub': 'github.com', 'GitLab': 'gitlab.com',
    'Bitbucket': 'bitbucket.org', 'Vercel': 'vercel.com', 'Netlify': 'netlify.com',
    'Cloudflare': 'cloudflare.com', 'AWS': 'aws.amazon.com', 'Azure': 'azure.microsoft.com',
    'GCP': 'cloud.google.com', 'DigitalOcean': 'digitalocean.com', 'Linode': 'linode.com',
    'Heroku': 'heroku.com', 'Render': 'render.com', 'Railway': 'railway.app',
    'Supabase': 'supabase.com', 'Firebase': 'firebase.google.com', 'MongoDB': 'mongodb.com',
    'Postgres': 'postgresql.org', 'MySQL': 'mysql.com', 'Redis': 'redis.io',
    'Docker': 'docker.com', 'Kubernetes': 'kubernetes.io', 'Terraform': 'terraform.io',
    'Ansible': 'ansible.com', 'Jenkins': 'jenkins.io', 'CircleCI': 'circleci.com',
    'Postman': 'postman.com', 'Insomnia': 'insomnia.rest', 'Swagger': 'swagger.io',
    'GraphQL': 'graphql.org', 'Apollo': 'apollographql.com', 'Prisma': 'prisma.io',
    'Drizzle': 'orm.drizzle.team', 'NestJS': 'nestjs.com', 'Next.js': 'nextjs.org',
    'Nuxt': 'nuxt.com', 'SvelteKit': 'kit.svelte.dev', 'Astro': 'astro.build',
    'Vite': 'vitejs.dev', 'Webpack': 'webpack.js.org', 'Rollup': 'rollupjs.org',
    'Parcel': 'parceljs.org', 'esbuild': 'esbuild.github.io', 'Bun': 'bun.sh',
    'Deno': 'deno.com', 'Node.js': 'nodejs.org', 'React': 'react.dev',
    'Vue': 'vuejs.org', 'Angular': 'angular.io', 'Svelte': 'svelte.dev',
    'Solid': 'solidjs.com', 'Qwik': 'qwik.dev', 'Preact': 'preactjs.com',
    'Lit': 'lit.dev', 'Alpine': 'alpinejs.dev', 'HTMX': 'htmx.org',
    'Tailwind': 'tailwindcss.com', 'Bootstrap': 'getbootstrap.com', 'Material UI': 'mui.com',
    'Chakra UI': 'chakra-ui.com', 'Ant Design': 'ant.design', 'Mantine': 'mantine.dev',
    'Radix': 'radix-ui.com', 'Shadcn UI': 'ui.shadcn.com', 'Headless UI': 'headlessui.com',
    'Framer Motion': 'framer.com', 'GSAP': 'gsap.com', 'Three.js': 'threejs.org',
    'Babylon.js': 'babylonjs.com', 'D3.js': 'd3js.org', 'Chart.js': 'chartjs.org',
    'ECharts': 'echarts.apache.org', 'Recharts': 'recharts.org', 'Mapbox': 'mapbox.com',
    'Leaflet': 'leafletjs.com', 'OpenLayers': 'openlayers.org', 'Turf.js': 'turfjs.org',
    'Socket.io': 'socket.io', 'Pusher': 'pusher.com', 'Ably': 'ably.com',
    'Amplify': 'aws.amazon.com', 'Appwrite': 'appwrite.io', 'Nhost': 'nhost.io',
    'PocketBase': 'pocketbase.io', 'Directus': 'directus.io', 'Strapi': 'strapi.io',
    'Sanity': 'sanity.io', 'Contentful': 'contentful.com', 'Prismic': 'prismic.io',
    'Storyblok': 'storyblok.com', 'WordPress': 'wordpress.org', 'Webflow': 'webflow.com',
    'Framer': 'framer.com', 'Wix': 'wix.com', 'Squarespace': 'squarespace.com',
    'WooCommerce': 'woocommerce.com', 'Magento': 'magento.com', 'BigCommerce': 'bigcommerce.com',
    'PrestaShop': 'prestashop.com', 'OpenCart': 'opencart.com', 'Stripe': 'stripe.com',
    'Razorpay': 'razorpay.com', 'Paystack': 'paystack.com', 'Flutterwave': 'flutterwave.com',
    'Pesapal': 'pesapal.com', 'IntaSend': 'intasend.com', 'PayU': 'payu.com',
    'Adyen': 'adyen.com', 'Klarna': 'klarna.com', 'Affirm': 'affirm.com',
    'Afterpay': 'afterpay.com', 'Zip': 'zip.co', 'Wave': 'waveapps.com',
    'Chipper Cash': 'chippercash.com', 'Kuda': 'kuda.com', 'Monzo': 'monzo.com',
    'N26': 'n26.com', 'Wise': 'wise.com', 'Payoneer': 'payoneer.com',
    'Skrill': 'skrill.com', 'Neteller': 'neteller.com', 'Payeer': 'payeer.com',
    'AdvCash': 'advcash.com'
  };

  function getAppIconUrl(appName) {
    const base = appName.replace(/\s\d+$/, '').trim();
    const domain = BRAND_DOMAINS[base];
    if (domain) return `https://logo.clearbit.com/${domain}`;
    const guess = base.toLowerCase().replace(/\s/g, '') + '.com';
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(guess)}&sz=128`;
  }

  function iconImg(appName, size = 44) {
    const url = getAppIconUrl(appName);
    const guess = appName.replace(/\s\d+$/, '').trim().toLowerCase().replace(/\s/g, '') + '.com';
    const fallback = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(guess)}&sz=128`;
    return `<img src="${url}" alt="${appName}" width="${size}" height="${size}"
      style="width:${size}px;height:${size}px;border-radius:12px;object-fit:contain;"
      onerror="this.onerror=null;this.src='${fallback}';this.style.opacity='0.7';">`;
  }

  // ============================================================
  // SEEDED SHUFFLE
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
    return seededShuffle(APP_POOL, seed).slice(0, 200);
  }

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

  function tsToMs(ts) {
    if (!ts) return 0;
    if (typeof ts === 'number') return ts;
    if (ts.seconds) return ts.seconds * 1000;
    return 0;
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

  ['loginEmail', 'regEmail', 'regReferral'].forEach(id => {
    const el = $(id); if (!el) return;
    el.addEventListener('input', () => { el.value = el.value.toLowerCase(); });
  });

  ['regPhone', 'withdrawNumber'].forEach(id => {
    const el = $(id); if (!el) return;
    el.addEventListener('input', () => { el.value = el.value.replace(/\D/g, '').slice(0, 9); });
  });

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
  if (registerBtn) registerBtn.addEventListener('click', async () => {
    const name     = $('regName').value.trim();
    const email    = normalizeEmail($('regEmail').value);
    const phone    = normalizePhone($('regPhone').value);
    const password = $('regPassword').value;
    const refEmail = normalizeEmail($('regReferral').value);

    if (!name || !email || !phone || !password) return toast('Please fill all required fields', true);
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return toast('Invalid email address', true);
    if (phone.length !== 9) return toast('Phone must be 9 digits after +254', true);
    if (password.length < 6) return toast('Password must be at least 6 characters', true);

    let referredBy = null;
    if (refEmail) {
      try {
        const refUser = await window.firebase.getUserByEmail(refEmail);
        if (refUser && refUser.email !== email) referredBy = refUser.id;
      } catch {}
    }

    try {
      toast('Creating your account…');
      const fbUser = await window.firebase.register(email, password, { name, phone, referredBy });
      const profile = await window.firebase.getUser(fbUser.uid);
      state.currentUser = profile;

      if (referredBy) {
        try {
          await window.firebase.addRef({
            referrerId: referredBy,
            referredUserId: fbUser.uid,
            referredEmail: email,
            amount: 0,
            status: 'pending'
          });
        } catch (e) { console.warn('referral write failed', e); }
      }

      toast('Account created! Choose your key package.');
      showLevelSelection();
    } catch (err) {
      const msg = (err && err.message) || 'Registration failed';
      toast(msg.replace('Firebase: ', ''), true);
    }
  });

  // ============================================================
  // LOGIN — just triggers Firebase; onAuth handles the rest
  // ============================================================
  const loginBtn = $('loginBtn');
  if (loginBtn) loginBtn.addEventListener('click', async () => {
    const email = normalizeEmail($('loginEmail').value);
    const pwd   = $('loginPassword').value;
    if (!email || !pwd) return toast('Enter email and password', true);

    try {
      await window.firebase.login(email, pwd);
      // 🎉 That's it. onAuth below will fetch the profile and switch screens.
    } catch (err) {
      const msg = (err && err.message) || 'Login failed';
      toast(msg.replace('Firebase: ', ''), true);
    }
  });

  // ============================================================
  // AUTO-LOGIN / POST-LOGIN ROUTER (the only place that sets state.currentUser)
  // ============================================================
  async function checkAuthState() {
    return new Promise(resolve => {
      let firstFire = true;
      const unsub = window.firebase.onAuth(async (fbUser) => {
        if (!fbUser) {
          if (firstFire) { resolve(false); firstFire = false; }
          return;
        }

        try {
          const profile = await window.firebase.getUser(fbUser.uid);
          if (!profile) {
            toast('Profile not found. Contact admin.', true);
            resolve(true);
            return;
          }

          state.currentUser = profile;
          state.isAdmin = (fbUser.email === window.firebase.ADMIN_EMAIL);

          if (state.isAdmin) {
            await loadAdminData();
            showAdminPanel();
          } else {
            await loadUserData();
            await resetDailyIfNeededLocal(profile);
            showUserDashboard();
          }
        } catch (e) {
          console.error('Auth routing error:', e);
          toast('Failed to load profile: ' + (e.message || e), true);
        }

        if (firstFire) { resolve(true); firstFire = false; }
      });

      // Timeout so we don't hang forever on the first load
      setTimeout(() => { if (firstFire) { try { unsub(); } catch {} resolve(false); firstFire = false; } }, 2500);
    });
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

  function showAuth() {
    hideAll();
    if (authScreen) authScreen.classList.remove('hidden');
  }

  function showLevelSelection() {
    const u = state.currentUser;
    if (u && u.keyApproved) { showUserDashboard(); return; }
    hideAll();
    if (levelScreen) levelScreen.classList.remove('hidden');
    renderLevelGrid();
    const pb = $('displayPaybill'); if (pb) pb.textContent = state.settings.paybill;
    const ac = $('displayAcc');     if (ac) ac.textContent = state.settings.account;
    const kp = $('keyPurchaseBox'); if (kp) kp.classList.add('hidden');

    window.firebase.getSettings().then(s => {
      state.settings = s;
      const pb2 = $('displayPaybill'); if (pb2) pb2.textContent = s.paybill;
      const ac2 = $('displayAcc');     if (ac2) ac2.textContent = s.account;
    }).catch(() => {});
  }

  async function showUserDashboard() {
    hideAll();
    if (userDashboard) userDashboard.classList.remove('hidden');
    const u = state.currentUser;
    if (!u) return;
    const rl = $('referralLink');
    if (rl) rl.value = `${location.origin}${location.pathname}?ref=${encodeURIComponent(u.email)}`;
    await renderUserDashboard();
    startAppStrip();
  }

  async function showAdminPanel() {
    hideAll();
    if (adminPanel) adminPanel.classList.remove('hidden');
    stopAppStrip();
    await loadAdminData();
    renderAdminPanel();
  }

  // ============================================================
  // DATA LOADERS
  // ============================================================
  async function loadUserData() {
    const u = state.currentUser;
    if (!u) return;
    try {
      const [txs, wds, refs, settings] = await Promise.all([
        window.firebase.userTxs(u.id),
        window.firebase.userWithdrawals(u.id),
        window.firebase.userRefs(u.id),
        window.firebase.getSettings()
      ]);
      state.userTxs = txs;
      state.userWithdrawals = wds;
      state.userReferrals = refs;
      state.settings = settings;
    } catch (e) { console.warn('loadUserData', e); }
  }

  async function loadAdminData() {
    try {
      const [users, txs, wds, refs] = await Promise.all([
        window.firebase.allUsers(),
        window.firebase.allTxs(),
        window.firebase.allWithdrawals(),
        window.firebase.allRefs()
      ]);
      state.allUsers = users;
      state.allTransactions = txs;
      state.allWithdrawals = wds;
      state.allReferrals = refs;
    } catch (e) { console.warn('loadAdminData', e); }
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
  if (submitKeyBtn) submitKeyBtn.addEventListener('click', async () => {
    const u = state.currentUser;
    if (!u) return toast('Please log in again', true);
    if (u.keyApproved) return toast('You already have an active key. Upgrade instead of re-buying.');

    const code = $('mpesaCode').value.trim().toUpperCase();
    if (!isValidMpesaCode(code))
      return toast('Invalid M-Pesa code. Use 10 letters/numbers e.g. QW45RT67Y9', true);

    const lvl = state.selectedLevel;
    const price = LEVELS[lvl].keyPrice;

    try {
      await window.firebase.updateUser(u.id, {
        level: lvl, hasKey: false, keyApproved: false,
        pendingKey: true, status: 'Pending key verification'
      });
      await window.firebase.addTx({
        userId: u.id, userEmail: u.email, type: 'key_purchase',
        level: lvl, amount: price, mpesaCode: code, status: 'pending'
      });
      state.currentUser = await window.firebase.getUser(u.id);
      await loadUserData();
      toast('Key submitted! Awaiting admin verification.');
      showUserDashboard();
    } catch (e) {
      toast('Submission failed: ' + (e.message || e), true);
    }
  });

  const skipBtn = $('skipLevelBtn');
  if (skipBtn) skipBtn.addEventListener('click', async () => {
    if (!state.currentUser) return;
    try { await window.firebase.updateUser(state.currentUser.id, { hasKey: false }); } catch {}
    state.currentUser.hasKey = false;
    showUserDashboard();
  });

  // ============================================================
  // DAILY RESET
  // ============================================================
  async function resetDailyIfNeededLocal(user) {
    const today = new Date().toDateString();
    if (user.lastInstallDate !== today) {
      try {
        await window.firebase.updateUser(user.id, {
          appsInstalledToday: 0, installedToday: [], lastInstallDate: today
        });
        user.appsInstalledToday = 0;
        user.installedToday = [];
        user.lastInstallDate = today;
      } catch {}
    }
  }

  // ============================================================
  // USER DASHBOARD
  // ============================================================
  async function renderUserDashboard() {
    const u = state.currentUser;
    if (!u) return;

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
    const remaining = Math.max(0, limit - (u.appsInstalledToday || 0));
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

    const refs = state.userReferrals || [];
    const refCount = refs.filter(r => r.referrerId === u.id).length;
    const rcEl = $('referredCount'); if (rcEl) rcEl.textContent = refCount;

    const lifetimeReferral = refs
      .filter(r => r.referrerId === u.id && r.status === 'approved')
      .reduce((s, r) => s + (r.amount || 0), 0);
    const reEl = $('referralEarnings');
    if (reEl) reEl.value = `Ksh ${lifetimeReferral.toFixed(2)}`;

    const pendingAmt = refs
      .filter(r => r.referrerId === u.id && r.status === 'pending')
      .reduce((s, r) => s + (r.amount || 0), 0);
    const prEl = $('pendingReferralAmount');
    if (prEl) prEl.textContent = `Ksh ${pendingAmt.toFixed(2)}`;

    const wHistEl = $('userWithdrawHistory');
    if (wHistEl) {
      const myWithdrawals = (state.userWithdrawals || [])
        .slice().sort((a, b) => tsToMs(b.createdAt) - tsToMs(a.createdAt));
      wHistEl.innerHTML = myWithdrawals.length
        ? myWithdrawals.map(w => `
            <div class="log-row">
              ${new Date(tsToMs(w.createdAt)).toLocaleString()} · Ksh ${w.amount} · ${w.phone}<br>
              <span class="badge badge-${w.status === 'pending' ? 'pending' : (w.status === 'approved' ? 'approved' : 'rejected')}">
                ${w.status}
              </span>
            </div>
          `).join('')
        : '<div class="log-row text-muted">No withdrawals yet</div>';
    }

    if (!state.dailyApps ||
        state.dailyApps._email !== u.email ||
        state.dailyApps._date  !== getTodayKey()) {
      state.dailyApps = getDailyAppsForUser(u);
      state.dailyApps._email = u.email;
      state.dailyApps._date  = getTodayKey();
      state.basket = null;
    }
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
      const atLimit = (u.appsInstalledToday || 0) >= limit;

      const item = document.createElement('div');
      item.className = 'app-item' + (!unlocked ? ' locked' : '') + (isDone ? ' installed' : '');

      const leftDiv = document.createElement('div');
      leftDiv.className = 'app-info';
      leftDiv.innerHTML = `
        <div class="app-icon">${iconImg(app.name, 44)}</div>
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
    if ((u.appsInstalledToday || 0) >= cfg.appsPerDay) return toast('Daily limit reached', true);

    const appId = app.id;
    if (state.activeInstallations[appId]) return;

    const duration = 30000;
    const startTime = Date.now();
    state.activeInstallations[appId] = { progress: 0, startTime, duration };

    const intervalId = setInterval(async () => {
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

        const newInstalled = Array.isArray(u.installedToday) ? [...u.installedToday] : [];
        if (!newInstalled.includes(appId)) newInstalled.push(appId);
        const newBalance = (u.balance || 0) + app.payout;
        const newCount = (u.appsInstalledToday || 0) + 1;

        u.balance = newBalance;
        u.appsInstalledToday = newCount;
        u.installedToday = newInstalled;

        try {
          await window.firebase.updateUser(u.id, {
            balance: newBalance,
            appsInstalledToday: newCount,
            installedToday: newInstalled
          });
        } catch (e) { console.warn('install write failed', e); }

        renderUserDashboard();
        flashBalance();
        toast(`Installed ${app.name}! +Ksh ${app.payout}`);
      }
    }, 150);

    state.activeInstallations[appId].intervalId = intervalId;
    renderUserDashboard();
  }

  // ============================================================
  // WITHDRAWAL REQUEST
  // ============================================================
  const requestWithdrawBtn = $('requestWithdrawBtn');
  if (requestWithdrawBtn) requestWithdrawBtn.addEventListener('click', async () => {
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

    try {
      await window.firebase.updateUser(u.id, {
        withdrawPhone: fullPhone,
        withdrawName: name,
        balance: (u.balance || 0) - amount,
        status: 'Withdrawn'
      });
      await window.firebase.addWithdraw({
        userId: u.id, userEmail: u.email, amount,
        phone: fullPhone, name, status: 'pending'
      });
      await window.firebase.addTx({
        userId: u.id, userEmail: u.email,
        type: 'withdrawal', amount: -amount, status: 'pending'
      });

      state.currentUser = await window.firebase.getUser(u.id);
      await loadUserData();
      renderUserDashboard();

      $('withdrawAmount').value = '';
      $('withdrawNumber').value = '';
      $('withdrawName').value = '';
      toast('Withdrawal request submitted (24hr processing, Mon–Fri)');
    } catch (e) {
      toast('Withdrawal failed: ' + (e.message || e), true);
    }
  });

  // ============================================================
  // WITHDRAWAL HISTORY TOGGLE
  // ============================================================
  const toggleWithdrawHistory = $('toggleWithdrawHistory');
  if (toggleWithdrawHistory) {
    toggleWithdrawHistory.addEventListener('click', async (e) => {
      e.preventDefault();
      const box = $('withdrawHistoryBox');
      if (!box) return;

      try {
        state.userWithdrawals = await window.firebase.userWithdrawals(state.currentUser.id);
      } catch {}

      const hist = $('userWithdrawHistory');
      if (hist) {
        const list = (state.userWithdrawals || []).slice()
          .sort((a, b) => tsToMs(b.createdAt) - tsToMs(a.createdAt));
        hist.innerHTML = list.length
          ? list.map(w => `
              <div class="log-row">
                ${new Date(tsToMs(w.createdAt)).toLocaleString()} · Ksh ${w.amount} · ${w.phone}<br>
                <span class="badge badge-${w.status === 'pending' ? 'pending' : (w.status === 'approved' ? 'approved' : 'rejected')}">
                  ${w.status}
                </span>
              </div>
            `).join('')
          : '<div class="log-row text-muted">No withdrawals yet</div>';
      }

      const isHidden = box.classList.contains('hidden');
      box.classList.toggle('hidden', !isHidden);
      toggleWithdrawHistory.textContent = isHidden
        ? '📜 Hide Withdrawal History'
        : '📜 View Withdrawal History';
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
    const pb = $('upgradePaybill'); if (pb) pb.textContent = state.settings.paybill;
    const ac = $('upgradeAcc');     if (ac) ac.textContent = state.settings.account;
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
  if (submitUpgradeBtn) submitUpgradeBtn.addEventListener('click', async () => {
    const u = state.currentUser;
    if (!u) return;
    const code = $('upgradeMpesaCode').value.trim().toUpperCase();
    const newLvl = state.selectedUpgradeLevel;

    if (!newLvl) return toast('Select a level to upgrade to', true);
    if (!isValidMpesaCode(code))
      return toast('Invalid M-Pesa code. Use 10 letters/numbers', true);

    const price = LEVELS[newLvl].keyPrice;
    try {
      await window.firebase.updateUser(u.id, {
        level: newLvl, appsInstalledToday: 0, installedToday: [],
        lastInstallDate: new Date().toDateString(),
        status: 'Pending upgrade verification',
        keyApproved: false, pendingKey: true
      });
      await window.firebase.addTx({
        userId: u.id, userEmail: u.email, type: 'upgrade',
        level: newLvl, amount: price, mpesaCode: code, status: 'pending'
      });
      state.currentUser = await window.firebase.getUser(u.id);
      state.basket = null;
      await loadUserData();
      toast('Upgrade submitted! Awaiting admin verification.');
      showUserDashboard();
    } catch (e) {
      toast('Upgrade failed: ' + (e.message || e), true);
    }
  });

  // ============================================================
  // LOGOUT
  // ============================================================
  const logoutUserBtn = $('logoutUserBtn');
  if (logoutUserBtn) logoutUserBtn.addEventListener('click', async () => {
    stopAppStrip();
    for (const id in state.activeInstallations) {
      const inst = state.activeInstallations[id];
      if (inst && inst.intervalId) clearInterval(inst.intervalId);
    }
    state.activeInstallations = {};
    state.dailyApps = null;
    state.basket = null;
    state.currentUser = null;
    state.isAdmin = false;
    state.userTxs = [];
    state.userWithdrawals = [];
    state.userReferrals = [];
    try { await window.firebase.logout(); } catch {}
    showAuth();
  });

  const logoutAdminBtn = $('logoutAdminBtn');
  if (logoutAdminBtn) logoutAdminBtn.addEventListener('click', async () => {
    state.dailyApps = null;
    state.basket = null;
    state.isAdmin = false;
    state.currentUser = null;
    state.allUsers = [];
    state.allTransactions = [];
    state.allWithdrawals = [];
    state.allReferrals = [];
    try { await window.firebase.logout(); } catch {}
    showAuth();
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
        overview: 'adminOverview', users: 'adminUsers', keys: 'adminKeys',
        transactions: 'adminTransactions', withdrawals: 'adminWithdrawals',
        referrals: 'adminReferrals', settings: 'adminSettings'
      };
      const target = $(map[tab]);
      if (target) target.classList.remove('hidden');
    });
  });

  // ============================================================
  // ADMIN RENDER
  // ============================================================
  function renderAdminPanel() {
    const users = state.allUsers || [];
    const txs = state.allTransactions || [];
    const wds = state.allWithdrawals || [];
    const refs = state.allReferrals || [];

    const sUsers = $('statUsers'); if (sUsers) sUsers.textContent = users.length;
    const keysSold = txs.filter(t => (t.type === 'key_purchase' || t.type === 'upgrade') && t.status === 'completed').length;
    const sKeys = $('statKeys'); if (sKeys) sKeys.textContent = keysSold;
    const revenue = txs
      .filter(t => (t.type === 'key_purchase' || t.type === 'upgrade') && t.status === 'completed')
      .reduce((s, t) => s + (t.amount || 0), 0);
    const sRev = $('statRevenue'); if (sRev) sRev.textContent = `Ksh ${revenue.toLocaleString()}`;
    const sWd = $('statWithdrawals');
    if (sWd) sWd.textContent = wds.filter(w => w.status === 'pending').length;
    const pendingKeys = txs.filter(t => (t.type === 'key_purchase' || t.type === 'upgrade') && t.status === 'pending').length;
    const sPk = $('statPendingKeys'); if (sPk) sPk.textContent = pendingKeys;

    const lEl = $('adminUserLogins');
    if (lEl) {
      lEl.innerHTML = users.slice(0, 15).map(u =>
        `<div class="log-row">${u.email} · L${u.level || 1} · ${u.status || 'Active'}</div>`
      ).join('') || '<div class="log-row text-muted">No users yet</div>';
    }

    const codes = txs.filter(t => t.mpesaCode);
    const cEl = $('adminMpesaCodes');
    if (cEl) cEl.innerHTML = codes.slice(0, 15).map(t =>
      `<div class="log-row">
        <strong>${t.mpesaCode}</strong> · Ksh ${t.amount} · ${t.userEmail}
        <span class="badge badge-${t.status === 'pending' ? 'pending' : 'approved'}">${t.status}</span>
      </div>`
    ).join('') || '<div class="log-row text-muted">No codes yet</div>';

    const pendingRefs = refs.filter(r => r.status === 'pending');
    const prEl = $('adminPendingReferrals');
    if (prEl) prEl.innerHTML = pendingRefs.slice(0, 10).map(r =>
      `<div class="log-row">
        <strong>${r.referrerEmail || 'user'}</strong> ← ${r.referredEmail} · Ksh ${(r.amount || 0).toFixed(2)}
        <button class="btn btn-sm btn-success" onclick="window.__approveRef('${r.id}')">Approve</button>
      </div>`
    ).join('') || '<div class="log-row text-muted">No pending referrals</div>';

    const ulEl = $('adminUsersList');
    if (ulEl) ulEl.innerHTML = users.map(u => {
      const savedPhone = u.withdrawPhone || '—';
      const savedName  = u.withdrawName || '—';
      const pastReqs = wds.filter(w => w.userId === u.id).sort((a, b) => tsToMs(b.createdAt) - tsToMs(a.createdAt));
      const historyHtml = pastReqs.length
        ? pastReqs.map(w => `
            <div class="log-row" style="border-left:2px solid #2c7050;padding-left:8px;margin-top:6px;">
              <span class="text-muted">${new Date(tsToMs(w.createdAt)).toLocaleString()}</span><br>
              Ksh ${w.amount} → <strong>${w.name}</strong> · ${w.phone}
              <span class="badge badge-${w.status === 'pending' ? 'pending' : (w.status === 'approved' ? 'approved' : 'rejected')}">${w.status}</span>
            </div>
          `).join('')
        : '<div class="text-muted" style="margin-top:6px;font-size:0.78rem;">No withdrawal requests yet</div>';

      return `
        <div class="log-row">
          <strong>${u.name}</strong> · ${u.email} · +254${u.phone || '—'}<br>
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
    }).join('') || '<div class="log-row text-muted">No users yet</div>';

    const pendingKeyTx = txs.filter(t => (t.type === 'key_purchase' || t.type === 'upgrade') && t.status === 'pending');
    const kEl = $('adminKeysList');
    if (kEl) kEl.innerHTML = pendingKeyTx.map(t => {
      const user = users.find(u => u.id === t.userId);
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
    }).join('') || '<div class="log-row text-muted">No pending key approvals</div>';

    const txEl = $('adminTransactionsList');
    if (txEl) {
      const groups = [
        { key: 'key_purchase',        title: '🔑 Key Purchases' },
        { key: 'upgrade',             title: '⬆️ Level Upgrades' },
        { key: 'withdrawal',          title: '💰 Withdrawals' },
        { key: 'referral_commission', title: '🤝 Referral Commissions' }
      ];
      const safeTx = txs.filter(t => t.type !== 'install');
      if (!safeTx.length) {
        txEl.innerHTML = '<div class="log-row text-muted">No transactions yet</div>';
      } else {
        txEl.innerHTML = groups.map(g => {
          const rows = safeTx.filter(t => t.type === g.key).sort((a, b) => tsToMs(b.createdAt) - tsToMs(a.createdAt));
          if (!rows.length) return '';
          return `
            <div style="margin-bottom:18px;">
              <div style="font-weight:600;color:#9bc2ff;margin-bottom:6px;">${g.title} (${rows.length})</div>
              ${rows.map(t => `
                <div class="log-row">
                  ${new Date(tsToMs(t.createdAt)).toLocaleString()} · Ksh ${t.amount} · ${t.userEmail}
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

    const wEl = $('adminWithdrawalsList');
    if (wEl) wEl.innerHTML = wds.map(w => `
      <div class="log-row">
        <strong>${w.name}</strong> · ${w.phone} · Ksh ${w.amount} ·
        <span class="badge badge-${w.status === 'pending' ? 'pending' : 'approved'}">${w.status}</span>
        ${w.status === 'pending'
          ? `<button class="btn btn-sm btn-success" onclick="window.__approveWithdraw('${w.id}')">Approve</button>`
          : ''}
      </div>
    `).join('') || '<div class="log-row text-muted">No withdrawals yet</div>';

    const rEl = $('adminReferralsList');
    if (rEl) rEl.innerHTML = refs.map(r => `
      <div class="log-row">
        ${r.referrerEmail || 'referrer'} ← ${r.referredEmail} · Ksh ${(r.amount || 0).toFixed(2)}
        <span class="badge badge-${r.status === 'pending' ? 'pending' : 'approved'}">${r.status}</span>
        ${r.status === 'pending'
          ? `<button class="btn btn-sm btn-success" onclick="window.__approveRef('${r.id}')">Approve</button>`
          : ''}
      </div>
    `).join('') || '<div class="log-row text-muted">No referrals yet</div>';

    window.firebase.getSettings().then(s => {
      const pbI = $('paybillInput'); if (pbI) pbI.value = s.paybill;
      const acI = $('accInput');     if (acI) acI.value = s.account;
    }).catch(() => {});
  }

  // ============================================================
  // ADMIN ACTIONS
  // ============================================================
  window.__approveRef = async function (id) {
    try {
      const refs = state.allReferrals || [];
      const r = refs.find(x => x.id === id);
      if (!r || r.status !== 'pending') return;
      await window.firebase.updateRef(id, { status: 'approved' });
      const referrer = state.allUsers.find(u => u.id === r.referrerId);
      if (referrer) {
        await window.firebase.updateUser(referrer.id, {
          balance: (referrer.balance || 0) + r.amount,
          referralEarnings: (referrer.referralEarnings || 0) + r.amount
        });
      }
      await window.firebase.addTx({
        userId: r.referrerId,
        userEmail: r.referrerEmail || 'referrer',
        type: 'referral_commission',
        amount: r.amount,
        status: 'completed'
      });
      await loadAdminData();
      renderAdminPanel();
      toast('Referral approved!');
    } catch (e) { toast('Approval failed: ' + (e.message || e), true); }
  };

  window.__approveWithdraw = async function (id) {
    try {
      await window.firebase.updateWithdraw(id, { status: 'approved' });
      await loadAdminData();
      renderAdminPanel();
      toast('Withdrawal approved!');
    } catch (e) { toast('Approval failed', true); }
  };

  window.__setStatus = async function (userId, status) {
    try {
      await window.firebase.updateUser(userId, { status });
      await loadAdminData();
      renderAdminPanel();
      toast(`User status set to: ${status}`);
    } catch (e) { toast('Update failed', true); }
  };

  window.__approveKey = async function (txId) {
    try {
      const tx = (state.allTransactions || []).find(t => t.id === txId);
      if (!tx || tx.status !== 'pending') return;
      await window.firebase.updateTx(txId, { status: 'completed' });
      const u = state.allUsers.find(x => x.id === tx.userId);
      if (u) {
        await window.firebase.updateUser(u.id, {
          keyApproved: true, hasKey: true, pendingKey: false,
          appsInstalledToday: 0, installedToday: [],
          lastInstallDate: new Date().toDateString(),
          status: tx.type === 'upgrade' ? 'Upgraded' : 'Key bought'
        });
        if (u.referredBy) {
          const referrer = state.allUsers.find(x => x.id === u.referredBy);
          if (referrer) {
            await window.firebase.addRef({
              referrerId: referrer.id,
              referrerEmail: referrer.email,
              referredUserId: u.id,
              referredEmail: u.email,
              amount: tx.amount * 0.30,
              status: 'pending'
            });
          }
        }
      }
      await loadAdminData();
      renderAdminPanel();
      toast('Key approved — user apps unlocked');
    } catch (e) { toast('Approval failed: ' + (e.message || e), true); }
  };

  window.__rejectKey = async function (txId) {
    try {
      const tx = (state.allTransactions || []).find(t => t.id === txId);
      if (!tx || tx.status !== 'pending') return;
      await window.firebase.updateTx(txId, { status: 'rejected' });
      const u = state.allUsers.find(x => x.id === tx.userId);
      if (u) {
        await window.firebase.updateUser(u.id, {
          pendingKey: false, keyApproved: false, hasKey: false, status: 'Key rejected'
        });
      }
      await loadAdminData();
      renderAdminPanel();
      toast('Key rejected', true);
    } catch (e) { toast('Reject failed', true); }
  };

  window.__deleteUser = async function (userId) {
    const u = state.allUsers.find(x => x.id === userId);
    if (!u) return;
    if (u.email === window.firebase.ADMIN_EMAIL) return toast('Cannot delete the admin account', true);
    const confirmMsg = `Delete "${u.name}" (${u.email}) and ALL their records?\n\n` +
      `• Transactions\n• Withdrawals\n• Referral entries\n\nThis cannot be undone.`;
    if (!confirm(confirmMsg)) return;
    try {
      await window.firebase.deleteUser(userId);
      await loadAdminData();
      renderAdminPanel();
      toast('User and all associated records deleted');
    } catch (e) { toast('Delete failed: ' + (e.message || e), true); }
  };

  const savePaybillBtn = $('savePaybillBtn');
  if (savePaybillBtn) savePaybillBtn.addEventListener('click', async () => {
    try {
      await window.firebase.saveSettings({
        paybill: $('paybillInput').value.trim() || '400200',
        account: $('accInput').value.trim() || 'APPCLOUD'
      });
      toast('Settings saved!');
    } catch (e) { toast('Save failed', true); }
  });

  // ============================================================
  // APP STRIP (marquee)
  // ============================================================
  const STRIP_APPS = [
    { name: 'WhatsApp' }, { name: 'Instagram' }, { name: 'TikTok' },
    { name: 'Facebook' }, { name: 'YouTube' }, { name: 'Spotify' },
    { name: 'Netflix' }, { name: 'X' }, { name: 'Snapchat' },
    { name: 'Telegram' }, { name: 'Pinterest' }, { name: 'Reddit' },
    { name: 'Discord' }, { name: 'Twitch' }, { name: 'LinkedIn' },
    { name: 'Zoom' }, { name: 'Slack' }, { name: 'Notion' },
    { name: 'Figma' }, { name: 'Canva' }, { name: 'Dropbox' },
    { name: 'Google Drive' }, { name: 'Gmail' }, { name: 'Maps' },
    { name: 'Uber' }, { name: 'Bolt' }, { name: 'Airbnb' },
    { name: 'Booking' }, { name: 'Amazon' }, { name: 'eBay' },
    { name: 'AliExpress' }, { name: 'Shopify' }, { name: 'PayPal' },
    { name: 'Revolut' }, { name: 'Binance' }, { name: 'Coinbase' },
    { name: 'Kraken' }, { name: 'MetaMask' }, { name: 'Trust Wallet' },
    { name: 'M-Pesa' }, { name: 'Airtel Money' }, { name: 'Equity Bank' },
    { name: 'KCB' }, { name: 'Chrome' }, { name: 'Firefox' },
    { name: 'Edge' }, { name: 'Safari' }, { name: 'Opera' },
    { name: 'Brave' }, { name: 'VLC' }, { name: 'Audible' },
    { name: 'Kindle' }, { name: 'Goodreads' }, { name: 'Duolingo' },
    { name: 'Khan Academy' }, { name: 'Coursera' }, { name: 'Udemy' },
    { name: 'Skillshare' }, { name: 'Medium' }, { name: 'Substack' },
    { name: 'Quora' }, { name: 'Stack Overflow' }, { name: 'GitHub' },
    { name: 'GitLab' }, { name: 'Bitbucket' }, { name: 'Vercel' },
    { name: 'Netlify' }, { name: 'Cloudflare' }, { name: 'AWS' },
    { name: 'Azure' }, { name: 'GCP' }, { name: 'DigitalOcean' },
    { name: 'Linode' }, { name: 'Heroku' }, { name: 'Render' },
    { name: 'Railway' }, { name: 'Supabase' }, { name: 'Firebase' },
    { name: 'MongoDB' }, { name: 'Postgres' }, { name: 'MySQL' },
    { name: 'Redis' }, { name: 'Docker' }, { name: 'Kubernetes' },
    { name: 'Terraform' }, { name: 'Ansible' }, { name: 'Jenkins' },
    { name: 'CircleCI' }, { name: 'Postman' }, { name: 'Insomnia' },
    { name: 'Swagger' }, { name: 'GraphQL' }, { name: 'Apollo' },
    { name: 'Prisma' }, { name: 'Drizzle' }, { name: 'NestJS' },
    { name: 'Next.js' }, { name: 'Nuxt' }, { name: 'SvelteKit' },
    { name: 'Astro' }, { name: 'Vite' }, { name: 'Webpack' },
    { name: 'Rollup' }, { name: 'Parcel' }, { name: 'esbuild' },
    { name: 'Bun' }, { name: 'Deno' }, { name: 'Node.js' },
    { name: 'React' }, { name: 'Vue' }, { name: 'Angular' },
    { name: 'Svelte' }, { name: 'Solid' }, { name: 'Qwik' },
    { name: 'Preact' }, { name: 'Lit' }, { name: 'Alpine' },
    { name: 'HTMX' }, { name: 'Tailwind' }, { name: 'Bootstrap' },
    { name: 'Material UI' }, { name: 'Chakra UI' }, { name: 'Ant Design' },
    { name: 'Mantine' }, { name: 'Radix' }, { name: 'Shadcn UI' },
    { name: 'Headless UI' }, { name: 'Framer Motion' }, { name: 'GSAP' },
    { name: 'Three.js' }, { name: 'Babylon.js' }, { name: 'D3.js' },
    { name: 'Chart.js' }, { name: 'ECharts' }, { name: 'Recharts' },
    { name: 'Mapbox' }, { name: 'Leaflet' }, { name: 'OpenLayers' },
    { name: 'Turf.js' }, { name: 'Socket.io' }, { name: 'Pusher' },
    { name: 'Ably' }, { name: 'Amplify' }, { name: 'Appwrite' },
    { name: 'Nhost' }, { name: 'PocketBase' }, { name: 'Directus' },
    { name: 'Strapi' }, { name: 'Sanity' }, { name: 'Contentful' },
    { name: 'Prismic' }, { name: 'Storyblok' }, { name: 'WordPress' },
    { name: 'Webflow' }, { name: 'Framer' }, { name: 'Wix' },
    { name: 'Squarespace' }, { name: 'WooCommerce' }, { name: 'Magento' },
    { name: 'BigCommerce' }, { name: 'PrestaShop' }, { name: 'OpenCart' },
    { name: 'Stripe' }, { name: 'Razorpay' }, { name: 'Paystack' },
    { name: 'Flutterwave' }, { name: 'Pesapal' }, { name: 'IntaSend' },
    { name: 'PayU' }, { name: 'Adyen' }, { name: 'Klarna' },
    { name: 'Affirm' }, { name: 'Afterpay' }, { name: 'Zip' },
    { name: 'Wave' }, { name: 'Chipper Cash' }, { name: 'Kuda' },
    { name: 'Monzo' }, { name: 'N26' }, { name: 'Wise' },
    { name: 'Payoneer' }, { name: 'Skrill' }, { name: 'Neteller' },
    { name: 'Payeer' }, { name: 'AdvCash' }
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
          <div class="strip-icon">${iconImg(app.name, 46)}</div>
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
    buildStrip(strip2, [...STRIP_APPS].reverse());
    stripInitialized = true;
  }

  function stopAppStrip() { stripInitialized = false; }

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
  (async () => {
    showAuth();
    await firebaseReady();
    await checkAuthState();
  })();

  window.__appCloud = { state, LEVELS, APP_POOL };
})();