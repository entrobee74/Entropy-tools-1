/* ═══════════════════════════════════════════
   ENTROPY TOOLS — Core App (Auth + State)
═══════════════════════════════════════════ */

const ET = (() => {

  // ── DEFAULT SERVICES CONFIG ──
  const DEFAULT_SERVICES = [
    {
      id: 'position-gen',
      name: 'Position Generator',
      desc: 'Generate professional trading position cards with entry, exit, and P&L details.',
      icon: '📊',
      category: 'Trading',
      price: 200,
      isFree: false,
      repo: 'https://entrobee74.github.io/Position-gen',
      githubRepo: 'https://github.com/entrobee74/Position-gen',
      active: true,
    },
    {
      id: 'crypto-receipt',
      name: 'Transaction Receipt',
      desc: 'Generate professional crypto transaction receipts for any blockchain transfer.',
      icon: '🧾',
      category: 'Crypto',
      price: 150,
      isFree: false,
      repo: 'https://entrobee74.github.io/crypto-receipt',
      githubRepo: 'https://github.com/entrobee74/crypto-receipt',
      active: true,
    },
    {
      id: 'support-center',
      name: 'Support Center',
      desc: 'Build and deploy a customised support/help center site instantly.',
      icon: '🛠️',
      category: 'Site Builder',
      price: 300,
      isFree: false,
      repo: 'https://entrobee74.github.io/Support-center',
      githubRepo: 'https://github.com/entrobee74/Support-center',
      active: true,
    },
  ];

  // ── DEFAULT ADMIN ──
  const DEFAULT_ADMIN = {
    id: 'admin',
    name: 'Admin',
    email: 'admin@entropytools.com',
    password: 'Admin@2025',  // change after first login
    role: 'admin',
    createdAt: new Date().toISOString(),
  };

  // ── STORAGE HELPERS ──
  const db = {
    get: (k, def = null) => {
      try { const v = localStorage.getItem('et_' + k); return v ? JSON.parse(v) : def; }
      catch { return def; }
    },
    set: (k, v) => { try { localStorage.setItem('et_' + k, JSON.stringify(v)); } catch {} },
    del: (k) => { localStorage.removeItem('et_' + k); },
  };

  // ── INIT DB ──
  function initDB() {
    if (!db.get('initialized')) {
      db.set('users', [DEFAULT_ADMIN]);
      db.set('services', DEFAULT_SERVICES);
      db.set('transactions', []);
      db.set('generations', []);
      db.set('initialized', true);
    }
    // Ensure services exist (for updates)
    if (!db.get('services')) db.set('services', DEFAULT_SERVICES);
  }

  // ── AUTH ──
  const auth = {
    current: () => db.get('current_user'),
    isLoggedIn: () => !!db.get('current_user'),
    isAdmin: () => { const u = db.get('current_user'); return u && u.role === 'admin'; },

    login(email, password) {
      const users = db.get('users', []);
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (!user) return { ok: false, msg: 'Invalid email or password.' };
      db.set('current_user', user);
      return { ok: true, user };
    },

    register(name, email, password) {
      const users = db.get('users', []);
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { ok: false, msg: 'Email already registered.' };
      }
      const user = {
        id: 'u_' + Date.now(),
        name, email, password,
        role: 'user',
        balance: 0,
        totalDeposited: 0,
        totalSpent: 0,
        uses: 0,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      db.set('users', users);
      db.set('current_user', user);
      return { ok: true, user };
    },

    logout() {
      db.del('current_user');
      window.location.href = '/index.html';
    },

    updateUser(updates) {
      const users = db.get('users', []);
      const cur = db.get('current_user');
      const idx = users.findIndex(u => u.id === cur.id);
      if (idx === -1) return;
      Object.assign(users[idx], updates);
      db.set('users', users);
      db.set('current_user', users[idx]);
      return users[idx];
    },

    getUser(id) {
      return db.get('users', []).find(u => u.id === id);
    },

    getAllUsers() {
      return db.get('users', []).filter(u => u.role !== 'admin');
    },
  };

  // ── WALLET ──
  const wallet = {
    balance() { return parseFloat(auth.current()?.balance || 0); },

    credit(amount, ref, note = 'Wallet Deposit') {
      const user = auth.current();
      if (!user) return;
      const newBal = (parseFloat(user.balance || 0) + amount).toFixed(2);
      auth.updateUser({
        balance: parseFloat(newBal),
        totalDeposited: (parseFloat(user.totalDeposited || 0) + amount),
      });
      transactions.add({
        userId: user.id,
        type: 'credit',
        amount,
        note,
        ref,
        icon: '💳',
      });
      return parseFloat(newBal);
    },

    deduct(amount, note = 'Tool Use') {
      const user = auth.current();
      if (!user) return false;
      if (parseFloat(user.balance || 0) < amount) return false;
      const newBal = (parseFloat(user.balance || 0) - amount).toFixed(2);
      auth.updateUser({
        balance: parseFloat(newBal),
        totalSpent: (parseFloat(user.totalSpent || 0) + amount),
        uses: (parseInt(user.uses || 0) + 1),
      });
      transactions.add({
        userId: user.id,
        type: 'debit',
        amount,
        note,
        ref: 'USE_' + Date.now(),
        icon: '⚡',
      });
      return true;
    },
  };

  // ── TRANSACTIONS ──
  const transactions = {
    add(tx) {
      const all = db.get('transactions', []);
      all.unshift({ ...tx, id: 'tx_' + Date.now(), date: new Date().toISOString() });
      db.set('transactions', all.slice(0, 500));
    },
    forUser(userId) {
      return db.get('transactions', []).filter(t => t.userId === userId);
    },
    all() { return db.get('transactions', []); },
  };

  // ── SERVICES ──
  const services = {
    all() { return db.get('services', DEFAULT_SERVICES); },
    active() { return services.all().filter(s => s.active); },
    get(id) { return services.all().find(s => s.id === id); },

    updatePrice(id, price) {
      const all = services.all();
      const s = all.find(s => s.id === id);
      if (s) { s.price = price; db.set('services', all); }
    },

    updateService(id, updates) {
      const all = services.all();
      const idx = all.findIndex(s => s.id === id);
      if (idx > -1) { Object.assign(all[idx], updates); db.set('services', all); }
    },

    toggle(id) {
      const all = services.all();
      const s = all.find(s => s.id === id);
      if (s) { s.active = !s.active; db.set('services', all); }
    },
  };

  // ── GENERATIONS ──
  const generations = {
    add(gen) {
      const all = db.get('generations', []);
      const id = 'gen_' + Date.now();
      all.unshift({ ...gen, id, date: new Date().toISOString() });
      db.set('generations', all.slice(0, 1000));
      return id;
    },
    forUser(userId) {
      return db.get('generations', []).filter(g => g.userId === userId);
    },
    all() { return db.get('generations', []); },
    get(id) { return db.get('generations', []).find(g => g.id === id); },
  };

  // ── ADMIN STATS ──
  const stats = {
    overview() {
      const users = auth.getAllUsers();
      const txns = transactions.all();
      const gens = generations.all();
      const credits = txns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
      const debits  = txns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
      return {
        totalUsers: users.length,
        totalRevenue: debits,
        totalDeposited: credits,
        totalGenerations: gens.length,
        activeUsers: users.filter(u => u.uses > 0).length,
      };
    },
  };

  // ── UI HELPERS ──
  const ui = {
    toast(msg, type = 'info', dur = 4000) {
      let stack = document.getElementById('toast-stack');
      if (!stack) {
        stack = document.createElement('div');
        stack.id = 'toast-stack';
        stack.className = 'toast-stack';
        document.body.appendChild(stack);
      }
      const icons = { success: '✅', error: '❌', info: '⚡', warn: '⚠️' };
      const el = document.createElement('div');
      el.className = `toast ${type}`;
      el.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span><span class="toast-msg">${msg}</span>`;
      stack.appendChild(el);
      setTimeout(() => el.remove(), dur);
    },

    hideLoader() {
      const l = document.getElementById('page-loader');
      if (l) { setTimeout(() => l.classList.add('hidden'), 800); }
    },

    requireAuth(adminOnly = false) {
      if (!auth.isLoggedIn()) { window.location.href = '/auth.html'; return false; }
      if (adminOnly && !auth.isAdmin()) { window.location.href = '/dashboard.html'; return false; }
      return true;
    },

    formatMoney(n) { return '₦' + parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },
    formatDate(d) { return new Date(d).toLocaleDateString('en-NG', { day:'2-digit', month:'short', year:'numeric' }); },
    formatDateTime(d) { return new Date(d).toLocaleString('en-NG', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }); },

    setNavBalance() {
      const el = document.getElementById('nav-balance-val');
      if (el) el.textContent = ui.formatMoney(auth.current()?.balance || 0);
    },

    fillNavUser() {
      const user = auth.current();
      if (!user) return;
      const nameEl = document.getElementById('nav-user-name');
      if (nameEl) nameEl.textContent = user.name;
      ui.setNavBalance();
    },
  };

  // ── INIT ──
  initDB();

  return { auth, wallet, transactions, services, generations, stats, ui, db };
})();

// ── GLOBAL HELPERS ──
function showLoader() {
  const l = document.getElementById('page-loader');
  if (l) l.classList.remove('hidden');
}
function hideLoader() {
  const l = document.getElementById('page-loader');
  if (l) setTimeout(() => l.classList.add('hidden'), 900);
}

// Page load handler
document.addEventListener('DOMContentLoaded', () => {
  hideLoader();
  ET.ui.fillNavUser();
});
