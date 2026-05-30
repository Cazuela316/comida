/* ============================================================
   app.js — FE Sandwichería
   ============================================================ */

// ── DATA ──────────────────────────────────────────────────────
const EXTRAS = [
  { id:'bacon',   emoji:'🥓', name:'Bacon',                 price:990  },
  { id:'vacuno',  emoji:'🥩', name:'Carne mechada',          price:1200 },
  { id:'lomito',  emoji:'🐷', name:'Lomito',                 price:1300 },
  { id:'pollo',   emoji:'🍗', name:'Pollo apanado',          price:1100 },
  { id:'huevo',   emoji:'🥚', name:'Huevo frito',            price:500  },
  { id:'palta',   emoji:'🥑', name:'Palta',                  price:600  },
  { id:'queso',   emoji:'🧀', name:'Queso extra',            price:400  },
  { id:'salmon',  emoji:'🐟', name:'Salmón',                 price:1500 },
  { id:'pepino',  emoji:'🥒', name:'Pepino',                 price:200  },
  { id:'choclo',  emoji:'🌽', name:'Choclo',                 price:300  },
  { id:'cebolla', emoji:'🧅', name:'Cebolla caramelizada',   price:400  },
  { id:'champi',  emoji:'🍄', name:'Champiñones',            price:500  },
];

const SAUCES = [
  { id:'mayo',         emoji:'🤍', name:'Mayonesa',      price:0   },
  { id:'ketchup',      emoji:'❤️',  name:'Ketchup',       price:0   },
  { id:'mostaza',      emoji:'💛', name:'Mostaza',       price:0   },
  { id:'mayo-ajo',     emoji:'🧄', name:'Mayo ajo',      price:200 },
  { id:'bbq',          emoji:'🟤', name:'BBQ',           price:200 },
  { id:'picante',      emoji:'🌶️', name:'Salsa picante', price:200 },
  { id:'chimichurri',  emoji:'🌿', name:'Chimichurri',   price:300 },
];

const LAYER_COLORS = {
  '🥬':'#5a9e5a', '🍅':'#c0392b', '🧅':'#9b59b6', '🥩':'#7b3a18',
  '🥚':'#e8a000', '🥑':'#5d8a3c', '🧀':'#e8c840', '🍗':'#c8782a',
  '🐷':'#d4826a', '🐟':'#5a8ac0', '🥒':'#7ab87a', '🌽':'#e8c040',
  '🍄':'#9b7040', '🧄':'#d4c070', '🥓':'#c84820',
};

const DELIVERY_COST = 1500;

// ── STATE ─────────────────────────────────────────────────────
let currentSandwich = null;
let selectedExtras  = new Set();
let selectedSauces  = new Set();
let removedBaseIngs = new Set();   // índices de ingredientes base quitados
let selectedPan     = 'Marraqueta';
let qty             = 1;

let cart = [];
let selectedDelivery   = 'delivery';
let selectedPayMethod  = 'transfer';

// ── HELPERS ───────────────────────────────────────────────────
const clp = n => '$' + n.toLocaleString('es-CL');

// ── MODAL SANDWICH ────────────────────────────────────────────
function openModal(name, desc, baseIngs, basePrice, bg) {
  currentSandwich = { name, desc, baseIngs, basePrice, bg };
  selectedExtras  = new Set();
  selectedSauces  = new Set();
  removedBaseIngs = new Set();
  selectedPan     = 'Marraqueta';
  qty             = 1;

  document.getElementById('modal-name').textContent = name;
  document.getElementById('modal-desc').textContent = desc;
  document.getElementById('qty-num').textContent    = '1';

  document.querySelectorAll('.pan-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector('[data-pan="Marraqueta"]').classList.add('selected');

  renderBaseIngs(baseIngs);
  renderExtras();
  renderSauces();
  updatePreview();
  updateTotal();

  document.querySelector('.modal').classList.remove('modo-postre');
  document.getElementById('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  document.querySelector('.modal').classList.remove('modo-postre');
  document.body.style.overflow = '';
}

document.getElementById('modal').addEventListener('click', e => {
  if (e.target === document.getElementById('modal')) closeModal();
});

// ── RENDER: INGREDIENTES BASE (removibles) ────────────────────
function renderBaseIngs(ings) {
  const el = document.getElementById('base-ings');
  el.innerHTML = ings.map((ing, i) => {
    const removed = removedBaseIngs.has(i);
    return `
    <div class="ing-option base-ing ${removed ? 'base-removed' : ''}"
         onclick="toggleBaseIng(${i})">
      <div class="ing-left">
        <span class="ing-emoji" style="${removed ? 'opacity:.35;text-decoration:line-through' : ''}">${ing.split(' ')[0]}</span>
        <span class="ing-name"  style="${removed ? 'opacity:.4;text-decoration:line-through' : ''}">${ing.split(' ').slice(1).join(' ')}</span>
      </div>
      ${removed
        ? `<span class="base-removed-badge">sin este ✕</span>`
        : `<span class="base-quitar-hint">quitar ✕</span>`
      }
    </div>
  `}).join('');
}

function toggleBaseIng(index) {
  removedBaseIngs.has(index) ? removedBaseIngs.delete(index) : removedBaseIngs.add(index);
  renderBaseIngs(currentSandwich.baseIngs);
  updatePreview();
}

// ── RENDER: EXTRAS ────────────────────────────────────────────
function renderExtras() {
  const el = document.getElementById('extra-ings');
  el.innerHTML = EXTRAS.map(e => `
    <div class="ing-option ${selectedExtras.has(e.id) ? 'selected' : ''}"
         onclick="toggleExtra('${e.id}')">
      <div class="ing-left">
        <span class="ing-emoji">${e.emoji}</span>
        <span class="ing-name">${e.name}</span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px">
        <span class="ing-price">+${clp(e.price)}</span>
        <div class="ing-check">✓</div>
      </div>
    </div>
  `).join('');
}

// ── RENDER: SALSAS ────────────────────────────────────────────
function renderSauces() {
  const el = document.getElementById('sauce-ings');
  el.innerHTML = SAUCES.map(s => `
    <div class="ing-option ${selectedSauces.has(s.id) ? 'selected' : ''}"
         onclick="toggleSauce('${s.id}')">
      <div class="ing-left">
        <span class="ing-emoji">${s.emoji}</span>
        <span class="ing-name">${s.name}</span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px">
        <span class="ing-price">${s.price > 0 ? '+' + clp(s.price) : 'gratis'}</span>
        <div class="ing-check">✓</div>
      </div>
    </div>
  `).join('');
}

function toggleExtra(id) {
  selectedExtras.has(id) ? selectedExtras.delete(id) : selectedExtras.add(id);
  renderExtras(); updatePreview(); updateTotal();
}
function toggleSauce(id) {
  selectedSauces.has(id) ? selectedSauces.delete(id) : selectedSauces.add(id);
  renderSauces(); updateTotal();
}
function selectPan(btn) {
  document.querySelectorAll('.pan-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedPan = btn.dataset.pan;
  updateTotal();
}

// ── VISTA PREVIA ──────────────────────────────────────────────
function updatePreview() {
  if (!currentSandwich) return;
  const container = document.getElementById('preview-layers');
  const panStyle  = 'background:#b87d40;color:#fff;';
  const layers    = [];
  layers.push(`<div class="preview-layer adding" style="${panStyle}border-radius:50px 50px 6px 6px;">🍞 ${selectedPan} (arriba)</div>`);

  currentSandwich.baseIngs.forEach((ing, i) => {
    if (removedBaseIngs.has(i)) return;   // omitir quitados
    const emoji = ing.split(' ')[0];
    const name  = ing.split(' ').slice(1).join(' ');
    const bg    = LAYER_COLORS[emoji] || '#888';
    layers.push(`<div class="preview-layer adding" style="background:${bg};color:#fff;">${emoji} ${name}</div>`);
  });

  selectedExtras.forEach(id => {
    const ex = EXTRAS.find(e => e.id === id);
    if (!ex) return;
    const bg = LAYER_COLORS[ex.emoji] || '#a67a44';
    layers.push(`<div class="preview-layer adding" style="background:${bg};color:#fff;">${ex.emoji} ${ex.name}</div>`);
  });

  layers.push(`<div class="preview-layer adding" style="${panStyle}border-radius:6px 6px 50px 50px;">🍞 ${selectedPan} (abajo)</div>`);
  container.innerHTML = layers.join('');
}

// ── CÁLCULO ───────────────────────────────────────────────────
function calcUnitPrice() {
  if (!currentSandwich) return 0;
  let total = currentSandwich.basePrice;
  if (selectedPan === 'Brioche') total += 300;
  selectedExtras.forEach(id => { const ex = EXTRAS.find(e => e.id === id); if (ex) total += ex.price; });
  selectedSauces.forEach(id => { const s  = SAUCES.find(s => s.id === id); if (s)  total += s.price;  });
  return total;
}

function updateTotal() {
  if (!currentSandwich) return;
  document.getElementById('modal-total').textContent = clp(calcUnitPrice() * qty);
}

function changeQty(d) {
  qty = Math.max(1, qty + d);
  document.getElementById('qty-num').textContent = qty;
  updateTotal();
}

// ── AGREGAR AL CARRITO ────────────────────────────────────────
function addToCart() {
  const unitPrice = calcUnitPrice();
  const extras    = [...selectedExtras].map(id => EXTRAS.find(e => e.id === id)).filter(Boolean);
  const sauces    = [...selectedSauces].map(id => SAUCES.find(s => s.id === id)).filter(Boolean);
  const removedNames = [...removedBaseIngs].map(i => currentSandwich.baseIngs[i]).filter(Boolean);

  const key = `${currentSandwich.name}|${selectedPan}|${[...selectedExtras].sort().join(',')}|${[...selectedSauces].sort().join(',')}|${[...removedBaseIngs].sort().join(',')}`;
  const existing = cart.find(i => i.key === key);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      key,
      id: Date.now(),
      name: currentSandwich.name,
      emoji: currentSandwich.baseIngs.find((_, i) => !removedBaseIngs.has(i))?.split(' ')[0] || '🥪',
      baseIngs: currentSandwich.baseIngs,
      removedBaseIngs: removedNames,
      extras,
      sauces,
      pan: selectedPan,
      unitPrice,
      qty,
    });
  }

  updateCartBadge();
  closeModal();
  showToast(`🥪 ${qty}× ${currentSandwich.name} agregado`);
}

// ── POSTRE ────────────────────────────────────────────────────
function openPostreModal(nombre, desc, precio) {
  currentSandwich = { name: nombre, desc, baseIngs: [], basePrice: precio };
  selectedExtras  = new Set();
  selectedSauces  = new Set();
  removedBaseIngs = new Set();
  qty = 1;

  document.getElementById('modal-name').textContent = nombre;
  document.getElementById('modal-desc').textContent = desc;
  document.getElementById('qty-num').textContent = '1';
  updateTotal();

  document.querySelector('.modal').classList.add('modo-postre');
  document.getElementById('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

// ── SANDWICH PERSONALIZADO ────────────────────────────────────
function openCustomModal() {
  openModal('🛠 Sandwich Personalizado', 'Arma tu sandwich desde cero. Elige todo lo que quieras.', [], 3000, 'bg-custom');
  // Mostrar hint en la sección de ingredientes base
  const baseEl = document.getElementById('base-ings');
  baseEl.innerHTML = `<div style="font-size:.8rem;color:var(--gris);padding:.4rem .2rem;font-style:italic">
    Este sandwich no trae ingredientes por defecto — agrega los que quieras en "Extras" 👇
  </div>`;
}

// ── CARRITO PANEL ─────────────────────────────────────────────
function openCart(e) {
  e && e.preventDefault();
  renderCartPanel();
  document.getElementById('cart-panel').classList.add('open');
  document.getElementById('cart-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-panel').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function renderCartPanel() {
  const body   = document.getElementById('cart-body');
  const empty  = document.getElementById('cart-empty');
  const footer = document.getElementById('cart-footer');

  if (cart.length === 0) {
    body.innerHTML = '';
    empty.classList.add('show');
    footer.classList.remove('show');
    return;
  }
  empty.classList.remove('show');
  footer.classList.add('show');

  body.innerHTML = cart.map(item => {
    const tags = [
      `🍞 ${item.pan}`,
      ...item.extras.map(e => `${e.emoji} ${e.name}`),
      ...item.sauces.map(s => `${s.emoji} ${s.name}`),
      ...(item.removedBaseIngs || []).map(r => `<span style="color:#c0392b">✕ sin ${r.split(' ').slice(1).join(' ') || r}</span>`),
    ].map(t => `<span class="cart-item-tag">${t}</span>`).join('');

    return `
      <div class="cart-item" id="cart-item-${item.id}">
        <div class="cart-item-emoji">${item.emoji}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-tags">${tags}</div>
          <div class="cart-item-bottom">
            <div class="cart-item-price">${clp(item.unitPrice * item.qty)}</div>
            <div style="display:flex;align-items:center;gap:.6rem">
              <div class="cart-item-qty">
                <button class="cart-qty-btn" onclick="changeCartQty(${item.id}, -1)">−</button>
                <span class="cart-qty-num">${item.qty}</span>
                <button class="cart-qty-btn" onclick="changeCartQty(${item.id}, 1)">+</button>
              </div>
              <button class="cart-remove-btn" onclick="removeCartItem(${item.id})">🗑</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  updateCartTotals();
}

function changeCartQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  renderCartPanel();
}

function removeCartItem(id) {
  cart = cart.filter(i => i.id !== id);
  renderCartPanel();
  updateCartBadge();
}

function updateCartBadge() {
  const total = cart.reduce((acc, i) => acc + i.qty, 0);
  document.getElementById('cart-badge').textContent = total;
}

function updateCartTotals() {
  const subtotal = cart.reduce((acc, i) => acc + i.unitPrice * i.qty, 0);
  const delivery = selectedDelivery === 'pickup' ? 0 : DELIVERY_COST;
  const total    = subtotal + delivery;
  document.getElementById('cart-subtotal-val').textContent  = clp(subtotal);
  document.getElementById('cart-delivery-val').textContent  = delivery > 0 ? clp(delivery) : 'Gratis';
  document.getElementById('cart-total-val').textContent     = clp(total);
}

// ── PAGO ──────────────────────────────────────────────────────
function openPayment() {
  closeCart();
  renderPaySummary();
  const el = document.getElementById('payment-overlay');
  el.style.display = 'block';
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePayment() {
  document.getElementById('payment-overlay').style.display = 'none';
  document.body.style.overflow = '';
  openCart();
}

function selectDelivery(type) {
  selectedDelivery = type;
  document.querySelectorAll('.delivery-opt').forEach(el => el.classList.remove('selected'));
  document.getElementById('opt-' + type).classList.add('selected');
  const addrSection = document.getElementById('address-section');
  addrSection.style.display = type === 'delivery' ? 'block' : 'none';
  updateCartTotals();
  renderPaySummary();
}

function selectPayMethod(method) {
  selectedPayMethod = method;
  document.querySelectorAll('.pay-method').forEach(el => el.classList.remove('selected'));
  document.getElementById('pm-' + method).classList.add('selected');
  ['transfer','card','cash','mercadopago'].forEach(m => {
    const el = document.getElementById('pay-detail-' + m);
    if (el) el.style.display = m === method ? 'block' : 'none';
  });
}

function renderPaySummary() {
  const subtotal = cart.reduce((acc, i) => acc + i.unitPrice * i.qty, 0);
  const delivery = selectedDelivery === 'pickup' ? 0 : DELIVERY_COST;
  const total    = subtotal + delivery;

  const rows = cart.map(item => `
    <div class="pay-sum-item">
      <span class="pay-sum-name">${item.qty}× ${item.name}</span>
      <span>${clp(item.unitPrice * item.qty)}</span>
    </div>
  `).join('');

  document.getElementById('pay-summary').innerHTML = rows + `
    <div class="pay-sum-item">
      <span class="pay-sum-name">Envío</span>
      <span>${delivery > 0 ? clp(delivery) : 'Gratis'}</span>
    </div>
  `;
  document.getElementById('pay-total-display').textContent = clp(total);
}

// ── CONFIRMAR PEDIDO ──────────────────────────────────────────
function confirmOrder() {
  document.getElementById('payment-overlay').style.display = 'none';

  const orderNum  = '#' + String(Math.floor(Math.random() * 9000) + 1000);
  const subtotal  = cart.reduce((acc, i) => acc + i.unitPrice * i.qty, 0);
  const delivery  = selectedDelivery === 'pickup' ? 0 : DELIVERY_COST;
  const total     = subtotal + delivery;

  const payLabels = {
    transfer: 'Transferencia bancaria',
    card: 'Tarjeta débito/crédito',
    cash: 'Efectivo',
    mercadopago: 'Mercado Pago',
  };
  const deliveryLabels = { delivery: '🛵 Delivery (30–45 min)', pickup: '🏪 Retiro en local (15–20 min)' };

  document.getElementById('confirm-order-num').textContent = orderNum;
  document.getElementById('eta-time').textContent = selectedDelivery === 'pickup' ? '15–20 min' : '30–45 min';

  document.getElementById('confirm-details').innerHTML = `
    <div class="confirm-detail-row">
      <span class="confirm-detail-label">Entrega</span>
      <span class="confirm-detail-val">${deliveryLabels[selectedDelivery]}</span>
    </div>
    <div class="confirm-detail-row">
      <span class="confirm-detail-label">Pago</span>
      <span class="confirm-detail-val">${payLabels[selectedPayMethod]}</span>
    </div>
    <div class="confirm-detail-row">
      <span class="confirm-detail-label">Items</span>
      <span class="confirm-detail-val">${cart.reduce((a,i) => a + i.qty, 0)} productos</span>
    </div>
    <div class="confirm-detail-row">
      <span class="confirm-detail-label">Total</span>
      <span class="confirm-detail-val">${clp(total)}</span>
    </div>
  `;

  const overlay = document.getElementById('confirm-overlay');
  overlay.style.display = 'block';
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  animateOrderSteps();
}

function animateOrderSteps() {
  const steps = ['cstep-1','cstep-2','cstep-3'];
  let i = 1;
  const interval = setInterval(() => {
    if (i >= steps.length) { clearInterval(interval); return; }
    document.getElementById(steps[i]).classList.add('active');
    i++;
  }, 1800);
}

function backToMenu() {
  cart = [];
  updateCartBadge();
  document.getElementById('confirm-overlay').style.display = 'none';
  document.body.style.overflow = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('¡Gracias por tu pedido! 🎉');
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── SCROLL ANIMATIONS ─────────────────────────────────────────
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.animationPlayState = 'running';
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));

// Formateo tarjeta
document.addEventListener('input', e => {
  if (e.target.id === 'card-num') {
    e.target.value = e.target.value.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim().slice(0,19);
  }
  if (e.target.id === 'card-exp') {
    let v = e.target.value.replace(/\D/g,'');
    if (v.length >= 3) v = v.slice(0,2) + '/' + v.slice(2,4);
    e.target.value = v;
  }
});
