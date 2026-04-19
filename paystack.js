/* ═══════════════════════════════════════════
   ENTROPY TOOLS — Paystack Integration
   Replace PAYSTACK_KEY with your live key
═══════════════════════════════════════════ */

const PAYSTACK_KEY = 'pk_live_69fcc7c11f24d782bb103fddf833dee1daa85e9d';

const PaystackHandler = {

  pay({ email, amount, onSuccess, onClose, meta = {} }) {
    const ref = 'ET_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8).toUpperCase();

    const handler = PaystackPop.setup({
      key: PAYSTACK_KEY,
      email,
      amount: Math.round(amount * 100), // kobo
      currency: 'NGN',
      ref,
      metadata: {
        custom_fields: [
          { display_name: 'Platform', variable_name: 'platform', value: 'Entropy Tools' },
          ...Object.entries(meta).map(([k, v]) => ({ display_name: k, variable_name: k.toLowerCase().replace(/\s/g,'_'), value: String(v) })),
        ],
      },
      onClose() {
        ET.ui.toast('Payment window closed.', 'warn');
        if (onClose) onClose();
      },
      callback(response) {
        // ⚠️ In production: VERIFY on your backend before crediting!
        // POST response.reference to your server → server verifies with Paystack API
        if (onSuccess) onSuccess(response.reference, amount);
      },
    });

    handler.openIframe();
    return ref;
  },

  deposit(amount, onSuccess) {
    const user = ET.auth.current();
    if (!user) { ET.ui.toast('Please log in first.', 'error'); return; }
    if (amount < 100) { ET.ui.toast('Minimum deposit is ₦100', 'error'); return; }

    PaystackHandler.pay({
      email: user.email,
      amount,
      meta: { 'User ID': user.id, 'User Name': user.name, 'Type': 'Wallet Deposit' },
      onSuccess(ref, amt) {
        const newBal = ET.wallet.credit(amt, ref, 'Wallet Deposit');
        ET.ui.toast(`₦${amt.toLocaleString()} deposited successfully! 🎉`, 'success', 5000);
        ET.ui.setNavBalance();
        if (onSuccess) onSuccess(newBal);
      },
    });
  },
};
