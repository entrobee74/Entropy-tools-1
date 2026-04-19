/* ═══════════════════════════════════════════
   ENTROPY TOOLS — Services Logic
═══════════════════════════════════════════ */

const ServicesHandler = {

  // Launch a tool after deducting credits
  async launch(serviceId) {
    if (!ET.ui.requireAuth()) return;

    const service = ET.services.get(serviceId);
    if (!service) { ET.ui.toast('Service not found.', 'error'); return; }
    if (!service.active) { ET.ui.toast('This service is currently unavailable.', 'warn'); return; }

    const user = ET.auth.current();
    const balance = parseFloat(user.balance || 0);

    // Free service or has balance
    if (!service.isFree && service.price > 0) {
      if (balance < service.price) {
        ET.ui.toast(`Insufficient balance. Need ₦${service.price}. Please deposit first.`, 'error', 5000);
        setTimeout(() => window.location.href = '/deposit.html', 1500);
        return;
      }

      // Confirm launch
      const confirmed = await ServicesHandler.confirmModal(service);
      if (!confirmed) return;

      const deducted = ET.wallet.deduct(service.price, `${service.name} — Use`);
      if (!deducted) {
        ET.ui.toast('Failed to deduct credits. Please try again.', 'error');
        return;
      }
      ET.ui.toast(`₦${service.price} deducted. Launching ${service.name}...`, 'info');
      ET.ui.setNavBalance();
    }

    // Show generation overlay then open tool
    ServicesHandler.showGenOverlay(service, () => {
      ServicesHandler.openTool(service);
    });
  },

  showGenOverlay(service, onDone) {
    // Remove any existing overlay
    document.getElementById('gen-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'gen-overlay';
    overlay.innerHTML = `
      <style>
        #gen-overlay {
          position: fixed; inset: 0; z-index: 9000;
          background: rgba(5,7,9,.96);
          backdrop-filter: blur(10px);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 24px;
          animation: genOverlayIn .3s ease;
        }
        @keyframes genOverlayIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        #gen-overlay .go-title {
          font-family: var(--font-mono);
          font-size: .65rem;
          color: var(--text3);
          text-transform: uppercase;
          letter-spacing: 3px;
        }
        #gen-overlay .go-service {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 700;
          color: var(--gold);
          letter-spacing: 2px;
        }
        /* Ring loader (uiverse.io by dexter-st) — gold themed */
        #gen-overlay .gen-loader-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 180px; height: 180px;
          border-radius: 50%;
          background-color: transparent;
          user-select: none;
        }
        #gen-overlay .gen-loader {
          position: absolute; top: 0; left: 0;
          width: 100%; aspect-ratio: 1/1;
          border-radius: 50%;
          background-color: transparent;
          animation: gen-loader-rotate 2s linear infinite;
          z-index: 0;
        }
        @keyframes gen-loader-rotate {
          0% {
            transform: rotate(90deg);
            box-shadow:
              0 10px 20px 0 rgba(245,202,90,.9) inset,
              0 20px 30px 0 rgba(245,166,35,.7) inset,
              0 60px 60px 0 rgba(120,70,0,.8) inset;
          }
          50% {
            transform: rotate(270deg);
            box-shadow:
              0 10px 20px 0 rgba(255,255,255,.8) inset,
              0 20px 10px 0 rgba(245,166,35,.9) inset,
              0 40px 60px 0 rgba(80,40,0,.9) inset;
          }
          100% {
            transform: rotate(450deg);
            box-shadow:
              0 10px 20px 0 rgba(245,202,90,.9) inset,
              0 20px 30px 0 rgba(245,166,35,.7) inset,
              0 60px 60px 0 rgba(120,70,0,.8) inset;
          }
        }
        #gen-overlay .gen-loader-letter {
          display: inline-block;
          opacity: 0.4;
          transform: translateY(0);
          animation: gen-letter-anim 2s infinite;
          z-index: 1;
          font-family: var(--font-display);
          font-size: .78rem;
          font-weight: 700;
          letter-spacing: 1px;
          color: var(--gold);
        }
        #gen-overlay .gen-loader-letter:nth-child(1)  { animation-delay: 0s; }
        #gen-overlay .gen-loader-letter:nth-child(2)  { animation-delay: .1s; }
        #gen-overlay .gen-loader-letter:nth-child(3)  { animation-delay: .2s; }
        #gen-overlay .gen-loader-letter:nth-child(4)  { animation-delay: .3s; }
        #gen-overlay .gen-loader-letter:nth-child(5)  { animation-delay: .4s; }
        #gen-overlay .gen-loader-letter:nth-child(6)  { animation-delay: .5s; }
        #gen-overlay .gen-loader-letter:nth-child(7)  { animation-delay: .6s; }
        #gen-overlay .gen-loader-letter:nth-child(8)  { animation-delay: .7s; }
        #gen-overlay .gen-loader-letter:nth-child(9)  { animation-delay: .8s; }
        #gen-overlay .gen-loader-letter:nth-child(10) { animation-delay: .9s; }
        @keyframes gen-letter-anim {
          0%, 100% { opacity: 0.4; transform: translateY(0); }
          20%       { opacity: 1; transform: scale(1.2); text-shadow: 0 0 12px rgba(245,166,35,.8); }
          40%       { opacity: 0.7; transform: translateY(0); }
        }
        #gen-overlay .go-sub {
          font-family: var(--font-mono);
          font-size: .6rem;
          color: var(--text3);
          text-transform: uppercase;
          letter-spacing: 2.5px;
          animation: blink-go 1.2s step-end infinite;
        }
        @keyframes blink-go { 0%,100%{opacity:1} 50%{opacity:0} }
      </style>

      <div class="go-title">Entropy Tools</div>
      <div class="go-service">${service.icon} ${service.name}</div>

      <div class="gen-loader-wrap">
        <div class="gen-loader"></div>
        <span class="gen-loader-letter">G</span>
        <span class="gen-loader-letter">E</span>
        <span class="gen-loader-letter">N</span>
        <span class="gen-loader-letter">E</span>
        <span class="gen-loader-letter">R</span>
        <span class="gen-loader-letter">A</span>
        <span class="gen-loader-letter">T</span>
        <span class="gen-loader-letter">I</span>
        <span class="gen-loader-letter">N</span>
        <span class="gen-loader-letter">G</span>
      </div>

      <div class="go-sub" id="gen-overlay-status">processing request...</div>
    `;
    document.body.appendChild(overlay);

    // Status message sequence
    const steps = [
      [400,  'verifying balance...'],
      [900,  'recording generation...'],
      [1500, 'opening tool...'],
    ];
    steps.forEach(([delay, msg]) => {
      setTimeout(() => {
        const el = document.getElementById('gen-overlay-status');
        if (el) el.textContent = msg;
      }, delay);
    });

    // Run callback then fade out
    setTimeout(() => {
      if (onDone) onDone();
      // Fade out overlay
      setTimeout(() => {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity .4s ease';
        setTimeout(() => overlay.remove(), 400);
      }, 300);
    }, 1800);
  },

  openTool(service) {
    // Record generation
    const genId = ET.generations.add({
      userId: ET.auth.current().id,
      serviceId: service.id,
      serviceName: service.name,
      price: service.price,
      viewLink: ServicesHandler.makeViewLink(service.id),
    });

    // Build launcher URL
    const launchUrl = `/tool-frame.html?id=${service.id}&gen=${genId}`;

    // Open in new tab
    window.open(launchUrl, '_blank');
  },

  makeViewLink(serviceId) {
    return `${window.location.origin}/view.html?id=${serviceId}&t=${Date.now()}`;
  },

  confirmModal(service) {
    return new Promise((resolve) => {
      // Inject confirm modal
      let existing = document.getElementById('launch-confirm-modal');
      if (existing) existing.remove();

      const modal = document.createElement('div');
      modal.id = 'launch-confirm-modal';
      modal.className = 'modal-overlay open';
      modal.innerHTML = `
        <div class="modal" style="max-width:400px">
          <div class="modal-title">⚡ Confirm Launch</div>
          <p class="modal-sub">This will deduct credits from your wallet</p>
          <div style="background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:18px;margin-bottom:24px">
            <div style="display:flex;align-items:center;gap:14px">
              <span style="font-size:2rem">${service.icon}</span>
              <div>
                <div style="font-family:var(--font-display);font-weight:700;font-size:.9rem">${service.name}</div>
                <div style="color:var(--text3);font-size:.8rem;margin-top:2px">${service.category}</div>
              </div>
            </div>
            <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
              <span style="font-family:var(--font-mono);font-size:.72rem;color:var(--text3)">Cost</span>
              <span style="font-family:var(--font-display);font-size:1.2rem;font-weight:700;color:var(--gold)">₦${service.price.toLocaleString()}</span>
            </div>
            <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center">
              <span style="font-family:var(--font-mono);font-size:.72rem;color:var(--text3)">Your Balance</span>
              <span style="font-family:var(--font-display);font-size:.9rem;font-weight:600;color:var(--text)">${ET.ui.formatMoney(ET.auth.current()?.balance)}</span>
            </div>
          </div>
          <div style="display:flex;gap:10px">
            <button class="btn btn-ghost" style="flex:1" id="launch-cancel"><span class="blob1"></span><span class="inner">Cancel</span></button>
            <button class="btn btn-gold" style="flex:2" id="launch-confirm"><span class="blob1"></span><span class="inner">Launch Tool →</span></button>
          </div>
        </div>`;
      document.body.appendChild(modal);

      document.getElementById('launch-cancel').onclick = () => { modal.remove(); resolve(false); };
      document.getElementById('launch-confirm').onclick = () => { modal.remove(); resolve(true); };
      modal.addEventListener('click', e => { if (e.target === modal) { modal.remove(); resolve(false); } });
    });
  },

  // Render service cards
  renderCards(containerId, services) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!services || services.length === 0) {
      container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text3);font-family:var(--font-mono)">No services available</div>`;
      return;
    }

    container.innerHTML = services.map(s => `
      <div class="card hover-glow fade-up" style="display:flex;flex-direction:column;gap:0">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px">
          <div style="width:50px;height:50px;background:var(--gold-dim);border:1px solid rgba(245,166,35,.2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.5rem">${s.icon}</div>
          <span class="badge badge-gold">${s.category}</span>
        </div>
        <div style="font-family:var(--font-display);font-weight:700;font-size:.95rem;letter-spacing:1px;margin-bottom:8px">${s.name}</div>
        <div style="color:var(--text3);font-size:.85rem;line-height:1.6;flex:1;margin-bottom:20px">${s.desc}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding-top:16px;border-top:1px solid var(--border)">
          <div>
            <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:700;color:var(--gold)">${s.isFree || s.price === 0 ? 'FREE' : '₦' + s.price.toLocaleString()}</div>
            <div style="font-family:var(--font-mono);font-size:.6rem;color:var(--text3)">per use</div>
          </div>
          <div style="display:flex;gap:8px">
            <a href="${s.githubRepo}" target="_blank" class="btn btn-ghost btn-sm" title="View Source"><span class="blob1"></span><span class="inner">⌥</span></a>
            <button class="btn btn-gold btn-sm" onclick="ServicesHandler.launch('${s.id}')"><span class="blob1"></span><span class="inner">Launch →</span></button>
          </div>
        </div>
      </div>`).join('');
  },

  // Render user's generation history
  renderGenerations(containerId, gens) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!gens.length) {
      container.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text3);font-family:var(--font-mono)">No generations yet</td></tr>`;
      return;
    }
    container.innerHTML = gens.map(g => `
      <tr>
        <td><span style="font-family:var(--font-mono);font-size:.7rem;color:var(--text3)">${g.id}</span></td>
        <td>${g.serviceName}</td>
        <td>${ET.ui.formatDateTime(g.date)}</td>
        <td><span style="color:var(--red);font-family:var(--font-display);font-weight:600">-₦${(g.price||0).toLocaleString()}</span></td>
        <td>
          <div style="display:flex;gap:6px">
            <a href="${g.viewLink}" target="_blank" class="btn btn-ghost btn-sm"><span class="blob1"></span><span class="inner">👁 View</span></a>
            <button class="btn btn-outline btn-sm" onclick="ServicesHandler.downloadGen('${g.id}')"><span class="blob1"></span><span class="inner">↓ Download</span></button>
          </div>
        </td>
      </tr>`).join('');
  },

  downloadGen(genId) {
    const gen = ET.generations.get(genId);
    if (!gen) { ET.ui.toast('Generation not found', 'error'); return; }
    // Build download content
    const content = `ENTROPY TOOLS — Generation Record
=====================================
Service:     ${gen.serviceName}
Generated:   ${ET.ui.formatDateTime(gen.date)}
Reference:   ${gen.id}
Cost:        ₦${(gen.price||0).toLocaleString()}
View Link:   ${gen.viewLink}
User:        ${gen.userId}
=====================================
Generated by Entropy Tools
${window.location.origin}
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `entropy-${genId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    ET.ui.toast('Receipt downloaded!', 'success');
  },
};
