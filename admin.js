/* ═══════════════════════════════════════════
   ENTROPY TOOLS — Admin Logic
═══════════════════════════════════════════ */

const Admin = {

  init() {
    if (!ET.ui.requireAuth(true)) return;
    Admin.renderStats();
    Admin.renderServices();
    Admin.renderUsers();
    Admin.renderTransactions();
  },

  renderStats() {
    const s = ET.stats.overview();
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('stat-users', s.totalUsers);
    set('stat-revenue', ET.ui.formatMoney(s.totalRevenue));
    set('stat-deposits', ET.ui.formatMoney(s.totalDeposited));
    set('stat-gens', s.totalGenerations);
    set('stat-active', s.activeUsers);
  },

  renderServices() {
    const tbody = document.getElementById('admin-services-tbody');
    if (!tbody) return;
    const svcs = ET.services.all();
    tbody.innerHTML = svcs.map(s => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:1.3rem">${s.icon}</span>
            <div>
              <div style="font-weight:600">${s.name}</div>
              <div style="font-size:.72rem;color:var(--text3);font-family:var(--font-mono)">${s.id}</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-gold">${s.category}</span></td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-family:var(--font-display);font-weight:700;color:var(--gold)" id="price-display-${s.id}">₦${s.price.toLocaleString()}</span>
            <button class="btn btn-ghost btn-sm" onclick="Admin.editPrice('${s.id}')"><span class="blob1"></span><span class="inner">Edit</span></button>
          </div>
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:6px">
            <span class="glow-dot ${s.active ? '' : 'red'}"></span>
            <span style="font-size:.8rem;color:${s.active ? 'var(--green)' : 'var(--red)'}">${s.active ? 'Active' : 'Disabled'}</span>
          </div>
        </td>
        <td>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <a href="${s.githubRepo}" target="_blank" class="btn btn-ghost btn-sm"><span class="blob1"></span><span class="inner">GitHub</span></a>
            <button class="btn ${s.active ? 'btn-danger' : 'btn-outline'} btn-sm" onclick="Admin.toggleService('${s.id}')"><span class="blob1"></span><span class="inner">${s.active ? 'Disable' : 'Enable'}</span></button>
          </div>
        </td>
      </tr>`).join('');
  },

  editPrice(serviceId) {
    const s = ET.services.get(serviceId);
    if (!s) return;

    let existing = document.getElementById('edit-price-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'edit-price-modal';
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-close" onclick="document.getElementById('edit-price-modal').remove()">✕</div>
        <div class="modal-title">Edit Price</div>
        <p class="modal-sub" style="font-family:var(--font-mono)">${s.name}</p>
        <div class="form-group" style="margin-bottom:24px">
          <label class="form-label">Price per Use (₦)</label>
          <div class="input-group">
            <span class="input-prefix">₦</span>
            <input class="form-input" id="new-price-input" type="number" value="${s.price}" min="0" placeholder="0 for free" />
          </div>
          <div style="font-size:.72rem;color:var(--text3);font-family:var(--font-mono);margin-top:4px">Set to 0 to make it free</div>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-ghost" style="flex:1" onclick="document.getElementById('edit-price-modal').remove()"><span class="blob1"></span><span class="inner">Cancel</span></button>
          <button class="btn btn-gold" style="flex:2" onclick="Admin.savePrice('${s.id}')"><span class="blob1"></span><span class="inner">Save Price →</span></button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.getElementById('new-price-input').focus();
  },

  savePrice(serviceId) {
    const input = document.getElementById('new-price-input');
    const price = parseFloat(input?.value || 0);
    if (isNaN(price) || price < 0) { ET.ui.toast('Enter a valid price', 'error'); return; }
    ET.services.updatePrice(serviceId, price);
    document.getElementById('edit-price-modal')?.remove();
    const display = document.getElementById(`price-display-${serviceId}`);
    if (display) display.textContent = price === 0 ? 'FREE' : '₦' + price.toLocaleString();
    ET.ui.toast(`Price updated to ${price === 0 ? 'FREE' : '₦' + price.toLocaleString()}`, 'success');
    Admin.renderServices();
  },

  toggleService(serviceId) {
    ET.services.toggle(serviceId);
    Admin.renderServices();
    const s = ET.services.get(serviceId);
    ET.ui.toast(`${s.name} ${s.active ? 'enabled' : 'disabled'}`, s.active ? 'success' : 'warn');
  },

  renderUsers() {
    const tbody = document.getElementById('admin-users-tbody');
    if (!tbody) return;
    const users = ET.auth.getAllUsers();
    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text3);font-family:var(--font-mono)">No users registered yet</td></tr>`;
      return;
    }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div style="font-weight:600">${u.name}</div>
          <div style="font-size:.72rem;color:var(--text3);font-family:var(--font-mono)">${u.id}</div>
        </td>
        <td style="font-family:var(--font-mono);font-size:.82rem">${u.email}</td>
        <td><span style="color:var(--gold);font-family:var(--font-display);font-weight:700">${ET.ui.formatMoney(u.balance||0)}</span></td>
        <td>${ET.ui.formatMoney(u.totalDeposited||0)}</td>
        <td><span class="badge badge-cyan">${u.uses||0} uses</span></td>
        <td style="font-size:.78rem;color:var(--text3)">${ET.ui.formatDate(u.createdAt)}</td>
      </tr>`).join('');
  },

  renderTransactions() {
    const tbody = document.getElementById('admin-tx-tbody');
    if (!tbody) return;
    const txns = ET.transactions.all().slice(0, 50);
    if (!txns.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text3);font-family:var(--font-mono)">No transactions yet</td></tr>`;
      return;
    }
    tbody.innerHTML = txns.map(t => {
      const user = ET.auth.getUser(t.userId);
      return `
        <tr>
          <td style="font-family:var(--font-mono);font-size:.7rem;color:var(--text3)">${t.ref||t.id}</td>
          <td>${user ? user.name : t.userId}</td>
          <td><span class="badge ${t.type === 'credit' ? 'badge-green' : 'badge-red'}">${t.type}</span></td>
          <td><span style="color:${t.type==='credit'?'var(--green)':'var(--red)'};font-family:var(--font-display);font-weight:700">${t.type==='credit'?'+':'-'}${ET.ui.formatMoney(t.amount)}</span></td>
          <td style="font-size:.78rem;color:var(--text3)">${ET.ui.formatDateTime(t.date)}</td>
        </tr>`;
    }).join('');
  },
};
