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
  { id:'pepino',  emoji:'🥒', name:'Pepino',                 price:200  },
  { id:'choclo',  emoji:'🌽', name:'Choclo',                 price:300  },
  { id:'cebolla', emoji:'🧅', name:'Cebolla caramelizada',   price:400  },
  { id:'champi',  emoji:'🍄', name:'Champiñones',            price:500  },
  { id:'tomate',  emoji:'🍅', name:'Tomate',                 price:200  },
  { id:'huevo frito', emoji:'🍳', name:'Huevo Frito',        price:350  },  

];

const SAUCES = [
  { id:'mayo',         emoji:'🤍', name:'Mayonesa',       price:0   },
  { id:'ketchup',      emoji:'❤️',  name:'Ketchup',       price:0   },
  { id:'mostaza',      emoji:'💛', name:'Mostaza',        price:0   },
  { id:'mayo-ajo',     emoji:'🧄', name:'Mayo ajo',       price:200 },
  { id:'bbq',          emoji:'🟤', name:'BBQ',            price:200 },
  { id:'picante',      emoji:'🌶️', name:'Salsa picante',  price:200 },
  { id:'chimichurri',  emoji:'🌿', name:'Chimichurri',    price:300 },
];

const LAYER_COLORS = {
  '🥬':'#5a9e5a', '🍅':'#c0392b', '🧅':'#9b59b6', '🥩':'#7b3a18', '🍳':'#bda762',
  '🥚':'#e8a000', '🥑':'#5d8a3c', '🧀':'#e8c840', '🍗':'#c8782a',
  '🐷':'#d4826a', '🥒':'#7ab87a', '🌽':'#e8c040', '🌿':'#00521b',
  '🍄':'#9b7040', '🧄':'#d4c070', '🥓':'#c84820', '🌶️':'#21aa4e'
};

const DELIVERY_COST   = 1500;
const INV_KEY         = 'fe_inventory';
const MENU_INV_KEY    = 'fe_menu_inventory';
const ORDERS_KEY      = 'fe_orders';
const ORDER_READY_KEY = 'fe_order_ready';
const SHIFT_KEY       = 'fe_shift_change';
const OPEN_HOUR       = 7;
const CLOSE_HOUR      = 19;

// ── INVENTARIO ────────────────────────────────────────────────
function getInventory() {
  try {
    const saved = localStorage.getItem(INV_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  const def = {};
  [...EXTRAS, ...SAUCES].forEach(i => { def[i.id] = true; });
  return def;
}

function isAvailable(id) {
  const inv = getInventory();
  return inv[id] !== false;
}

function getMenuInventory() {
  try {
    const saved = localStorage.getItem(MENU_INV_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
}

function isMenuItemAvailable(id) {
  const inv = getMenuInventory();
  return inv[id] !== false;
}

function applyMenuAvailability() {
  document.querySelectorAll('[data-menu-id]').forEach(card => {
    const id    = card.dataset.menuId;
    const avail = isMenuItemAvailable(id);
    card.classList.toggle('card-agotado', !avail);
    const badge = card.querySelector('.card-agotado-badge');
    if (badge) badge.style.display = avail ? 'none' : 'flex';
    const btn = card.querySelector('.btn-customize, .btn-customize-custom');
    if (btn) {
      btn.disabled = !avail;
      if (!avail) btn.textContent = '❌ Agotado';
    }
  });
}

// ── STATE ─────────────────────────────────────────────────────
let currentSandwich    = null;
let selectedExtras     = new Set();
let selectedSauces     = new Set();
let removedBaseIngs    = new Set();
let selectedPan        = 'Marraqueta';
let qty                = 1;
let cart               = [];
let selectedDelivery   = 'delivery';
let selectedPayMethod  = 'transfer';
let currentOrderNum    = null;
let bebidaSeleccionada = null;

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
  // Ocultar y limpiar opciones de bebida
  const wrap = document.getElementById('bebida-opciones');
  const lista = document.getElementById('bebida-lista');
  if (wrap)  wrap.style.display = 'none';
  if (lista) lista.innerHTML = '';
  bebidaSeleccionada = null;
}

document.getElementById('modal').addEventListener('click', e => {
  if (e.target === document.getElementById('modal')) closeModal();
});

// ── RENDER: INGREDIENTES BASE ─────────────────────────────────
function renderBaseIngs(ings) {
  const el = document.getElementById('base-ings');
  el.innerHTML = ings.map((ing, i) => {
    const removed = removedBaseIngs.has(i);
    return `
    <div class="ing-option base-ing ${removed ? 'base-removed' : ''}" onclick="toggleBaseIng(${i})">
      <div class="ing-left">
        <span class="ing-emoji" style="${removed ? 'opacity:.35;text-decoration:line-through' : ''}">${ing.split(' ')[0]}</span>
        <span class="ing-name"  style="${removed ? 'opacity:.4;text-decoration:line-through'  : ''}">${ing.split(' ').slice(1).join(' ')}</span>
      </div>
      ${removed
        ? `<span class="base-removed-badge">sin este ✕</span>`
        : `<span class="base-quitar-hint">quitar ✕</span>`}
    </div>`;
  }).join('');
}

function toggleBaseIng(index) {
  removedBaseIngs.has(index) ? removedBaseIngs.delete(index) : removedBaseIngs.add(index);
  renderBaseIngs(currentSandwich.baseIngs);
  updatePreview();
}

// ── RENDER: EXTRAS ────────────────────────────────────────────
function renderExtras() {
  const el = document.getElementById('extra-ings');
  el.innerHTML = EXTRAS.map(e => {
    const avail    = isAvailable(e.id);
    const selected = selectedExtras.has(e.id);
    return `
    <div class="ing-option ${selected ? 'selected' : ''} ${avail ? '' : 'ing-agotado'}"
         onclick="${avail ? `toggleExtra('${e.id}')` : "showToast('❌ Este ingrediente está agotado.')"}">
      <div class="ing-left">
        <span class="ing-emoji" style="${avail ? '' : 'opacity:.35;filter:grayscale(.8)'}">${e.emoji}</span>
        <span class="ing-name"  style="${avail ? '' : 'opacity:.45;text-decoration:line-through'}">${e.name}</span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px">
        ${avail
          ? `<span class="ing-price">+${clp(e.price)}</span><div class="ing-check">✓</div>`
          : `<span class="ing-stock-badge">Agotado</span>`}
      </div>
    </div>`;
  }).join('');
}

// ── RENDER: SALSAS ────────────────────────────────────────────
function renderSauces() {
  const el = document.getElementById('sauce-ings');
  el.innerHTML = SAUCES.map(s => {
    const avail    = isAvailable(s.id);
    const selected = selectedSauces.has(s.id);
    return `
    <div class="ing-option ${selected ? 'selected' : ''} ${avail ? '' : 'ing-agotado'}"
         onclick="${avail ? `toggleSauce('${s.id}')` : "showToast('❌ Esta salsa está agotada.')"}">
      <div class="ing-left">
        <span class="ing-emoji" style="${avail ? '' : 'opacity:.35;filter:grayscale(.8)'}">${s.emoji}</span>
        <span class="ing-name"  style="${avail ? '' : 'opacity:.45;text-decoration:line-through'}">${s.name}</span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px">
        ${avail
          ? `<span class="ing-price">${s.price > 0 ? '+' + clp(s.price) : 'gratis'}</span><div class="ing-check">✓</div>`
          : `<span class="ing-stock-badge">Agotado</span>`}
      </div>
    </div>`;
  }).join('');
}

function toggleExtra(id) {
  if (!isAvailable(id)) return;
  selectedExtras.has(id) ? selectedExtras.delete(id) : selectedExtras.add(id);
  renderExtras(); updatePreview(); updateTotal();
}
function toggleSauce(id) {
  if (!isAvailable(id)) return;
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
    if (removedBaseIngs.has(i)) return;
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
  // Caso bebida
  if (currentSandwich && currentSandwich.esBebida && bebidaSeleccionada) {
    const unitPrice = bebidaSeleccionada.precio;
    const key       = `bebida|${bebidaSeleccionada.id}`;
    const existing  = cart.find(i => i.key === key);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ key, id: Date.now(), name: bebidaSeleccionada.nombre,
        emoji: bebidaSeleccionada.emoji, baseIngs: [], removedBaseIngs: [],
        extras: [], sauces: [], pan: '—', unitPrice, qty });
    }
    updateCartBadge();
    closeModal();
    showToast(`${bebidaSeleccionada.emoji} ${qty}× ${bebidaSeleccionada.nombre} agregado`);
    bebidaSeleccionada = null;
    return;
  }

  // Caso sandwich/postre normal
  const unitPrice    = calcUnitPrice();
  const extras       = [...selectedExtras].map(id => EXTRAS.find(e => e.id === id)).filter(Boolean);
  const sauces       = [...selectedSauces].map(id => SAUCES.find(s => s.id === id)).filter(Boolean);
  const removedNames = [...removedBaseIngs].map(i => currentSandwich.baseIngs[i]).filter(Boolean);

  const key      = `${currentSandwich.name}|${selectedPan}|${[...selectedExtras].sort().join(',')}|${[...selectedSauces].sort().join(',')}|${[...removedBaseIngs].sort().join(',')}`;
  const existing = cart.find(i => i.key === key);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ key, id: Date.now(), name: currentSandwich.name,
      emoji: currentSandwich.baseIngs.find((_, i) => !removedBaseIngs.has(i))?.split(' ')[0] || '🥪',
      baseIngs: currentSandwich.baseIngs, removedBaseIngs: removedNames,
      extras, sauces, pan: selectedPan, unitPrice, qty });
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
  document.getElementById('qty-num').textContent    = '1';
  updateTotal();
  document.querySelector('.modal').classList.add('modo-postre');
  document.getElementById('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

// ── BEBIDAS ───────────────────────────────────────────────────
const BEBIDAS = {
  agua: { titulo:'💧 Agua', opciones:[
    { id:'cachantun-gas', nombre:'Cachantun con gas 500ml',   precio:800, emoji:'💧' },
    { id:'benedictino',   nombre:'Benedictino sin gas 500ml', precio:700, emoji:'🫧' },
    { id:'vital',         nombre:'Vital sin gas 500ml',       precio:700, emoji:'💧' },
  ]},
  jugo: { titulo:'🍊 Jugo', opciones:[
    { id:'watts-naranja', nombre:'Watts Naranja 200ml',  precio:700, emoji:'🍊' },
    { id:'watts-durazno', nombre:'Watts Durazno 200ml',  precio:700, emoji:'🍑' },
    { id:'watts-pera',    nombre:'Watts Pera 200ml',     precio:700, emoji:'🍐' },
    { id:'ades-manzana',  nombre:'Ades Manzana 200ml',   precio:800, emoji:'🍎' },
  ]},
  cola: { titulo:'🥤 Bebida con azúcar', opciones:[
    { id:'cocacola', nombre:'Coca-Cola 350ml',      precio:1200, emoji:'🥤' },
    { id:'sprite',   nombre:'Sprite 350ml',         precio:1200, emoji:'🟢' },
    { id:'fanta',    nombre:'Fanta Naranja 350ml',  precio:1200, emoji:'🟠' },
    { id:'pepsi',    nombre:'Pepsi 350ml',          precio:1100, emoji:'🔵' },
  ]},
  zero: { titulo:'🫙 Bebida sin azúcar', opciones:[
    { id:'cocacola-zero', nombre:'Coca-Cola Zero 350ml', precio:1200, emoji:'⚫' },
    { id:'sprite-zero',   nombre:'Sprite Zero 350ml',    precio:1200, emoji:'🟩' },
    { id:'pepsi-black',   nombre:'Pepsi Black 350ml',    precio:1200, emoji:'🔵' },
  ]},
};

function openBebidaModal(tipo) {
  const bebida = BEBIDAS[tipo];
  if (!bebida) return;
  currentSandwich = { name: bebida.titulo, desc:'Selecciona tu opción preferida:',
    baseIngs:[], basePrice:0, esBebida:true, opciones:bebida.opciones };
  selectedExtras = new Set(); selectedSauces = new Set(); removedBaseIngs = new Set();
  qty = 1;

  document.getElementById('modal-name').textContent = bebida.titulo;
  document.getElementById('modal-desc').textContent = 'Selecciona tu opción preferida:';
  document.getElementById('qty-num').textContent    = '1';

  // Activar modo-postre (oculta pan, extras, salsas, preview)
  document.querySelector('.modal').classList.add('modo-postre');

  // Mostrar contenedor de bebidas (está fuera de las secciones ocultas)
  const wrap = document.getElementById('bebida-opciones');
  const lista = document.getElementById('bebida-lista');
  if (wrap) wrap.style.display = 'block';
  if (lista) {
    lista.innerHTML = bebida.opciones.map(op => `
      <div class="ing-option bebida-opcion" id="bop-${op.id}" onclick="seleccionarBebida('${tipo}','${op.id}')">
        <div class="ing-left">
          <span class="ing-emoji">${op.emoji}</span>
          <span class="ing-name">${op.nombre}</span>
        </div>
        <span class="ing-price">$${op.precio.toLocaleString('es-CL')}</span>
      </div>`).join('');
  }

  seleccionarBebida(tipo, bebida.opciones[0].id);
  document.getElementById('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function seleccionarBebida(tipo, id) {
  const op = BEBIDAS[tipo]?.opciones.find(o => o.id === id);
  if (!op) return;
  bebidaSeleccionada = { tipo, ...op };
  currentSandwich.basePrice = op.precio;
  document.querySelectorAll('.bebida-opcion').forEach(el => el.classList.remove('selected'));
  const el = document.getElementById('bop-' + id);
  if (el) el.classList.add('selected');
  updateTotal();
}

// ── SANDWICH PERSONALIZADO ────────────────────────────────────
function openCustomModal() {
  openModal('🛠 Sandwich Personalizado', 'Arma tu sandwich desde cero.', [], 3000, 'bg-custom');
  document.getElementById('base-ings').innerHTML = `
    <div style="font-size:.8rem;color:var(--gris);padding:.4rem .2rem;font-style:italic">
      Este sandwich no trae ingredientes por defecto — agrega los que quieras en "Extras" 👇
    </div>`;
}

// ── CARRITO ───────────────────────────────────────────────────
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
                <button class="cart-qty-btn" onclick="changeCartQty(${item.id},-1)">−</button>
                <span class="cart-qty-num">${item.qty}</span>
                <button class="cart-qty-btn" onclick="changeCartQty(${item.id},1)">+</button>
              </div>
              <button class="cart-remove-btn" onclick="removeCartItem(${item.id})">🗑</button>
            </div>
          </div>
        </div>
      </div>`;
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
  document.getElementById('cart-badge').textContent = cart.reduce((acc,i) => acc + i.qty, 0);
}

function updateCartTotals() {
  const subtotal = cart.reduce((acc,i) => acc + i.unitPrice * i.qty, 0);
  const delivery = selectedDelivery === 'pickup' ? 0 : DELIVERY_COST;
  document.getElementById('cart-subtotal-val').textContent = clp(subtotal);
  document.getElementById('cart-delivery-val').textContent = delivery > 0 ? clp(delivery) : 'Gratis';
  document.getElementById('cart-total-val').textContent    = clp(subtotal + delivery);
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
  document.getElementById('address-section').style.display = type === 'delivery' ? 'block' : 'none';
  updateCartTotals();
  renderPaySummary();
}

function selectPayMethod(method) {
  selectedPayMethod = method;
  document.querySelectorAll('.pay-method').forEach(el => el.classList.remove('selected'));
  document.getElementById('pm-' + method).classList.add('selected');
  ['transfer','card','cash','mercadopago','baes'].forEach(m => {
    const el = document.getElementById('pay-detail-' + m);
    if (el) el.style.display = m === method ? 'block' : 'none';
  });
}

function renderPaySummary() {
  const subtotal = cart.reduce((acc,i) => acc + i.unitPrice * i.qty, 0);
  const delivery = selectedDelivery === 'pickup' ? 0 : DELIVERY_COST;
  const rows     = cart.map(item => `
    <div class="pay-sum-item">
      <span class="pay-sum-name">${item.qty}× ${item.name}</span>
      <span>${clp(item.unitPrice * item.qty)}</span>
    </div>`).join('');
  document.getElementById('pay-summary').innerHTML = rows + `
    <div class="pay-sum-item">
      <span class="pay-sum-name">Envío</span>
      <span>${delivery > 0 ? clp(delivery) : 'Gratis'}</span>
    </div>`;
  document.getElementById('pay-total-display').textContent = clp(subtotal + delivery);
}

// ── PEDIDOS ───────────────────────────────────────────────────
function saveOrderToStorage(orderNum, orderData) {
  try {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    orders.unshift({ ...orderData, num: orderNum, status:'pending', createdAt: new Date().toISOString() });
    if (orders.length > 50) orders.splice(50);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch(e) { console.error('Error guardando pedido', e); }
}

function showOrderReadyBanner(num) {
  const prev = document.getElementById('order-ready-banner');
  if (prev) prev.remove();
  const banner = document.createElement('div');
  banner.id = 'order-ready-banner';
  banner.innerHTML = `
    <div class="orb-inner">
      <div class="orb-icon">🔔</div>
      <div class="orb-text">
        <strong>¡Tu pedido ${num} está listo!</strong>
        <span>${selectedDelivery === 'pickup' ? '¡Pasa a retirarlo al local! 🏪' : '¡Ya va en camino! 🛵'}</span>
      </div>
      <button class="orb-close" onclick="this.closest('#order-ready-banner').remove()">✕</button>
    </div>`;
  document.body.appendChild(banner);
  setTimeout(() => { if (banner.parentNode) banner.remove(); }, 30000);
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  showToast('🔔 ¡Tu pedido está listo!');
}


// ── BAES · Edenred ────────────────────────────────────────────
function formatBaesCode(input) {
  // Formatea como grupos de 4: XXXX XXXX XXXX XXXX
  let val = input.value.replace(/\D/g, '').slice(0, 16);
  input.value = val.replace(/(\d{4})(?=\d)/g, '$1 ');
}

// ── CONFIRMAR PEDIDO ──────────────────────────────────────────
function confirmOrder() {
  // Validar código BAES si fue el método elegido
  if (selectedPayMethod === 'baes') {
    const baesVal = (document.getElementById('baes-code')?.value || '').replace(/\s/g,'');
    if (baesVal.length < 16) {
      showToast('⚠️ Ingresa tu código BAES completo (16 dígitos).');
      return;
    }
  }
  document.getElementById('payment-overlay').style.display = 'none';

  const orderNum  = '#' + String(Math.floor(Math.random() * 9000) + 1000);
  currentOrderNum = orderNum;

  const subtotal = cart.reduce((acc,i) => acc + i.unitPrice * i.qty, 0);
  const delivery = selectedDelivery === 'pickup' ? 0 : DELIVERY_COST;
  const total    = subtotal + delivery;

  saveOrderToStorage(orderNum, {
    items: cart.map(i => ({
      name:i.name, emoji:i.emoji, qty:i.qty, pan:i.pan,
      extras:i.extras.map(e => e.name), sauces:i.sauces.map(s => s.name),
      removedBaseIngs:i.removedBaseIngs||[], unitPrice:i.unitPrice,
    })),
    delivery:selectedDelivery, payMethod:selectedPayMethod,
    subtotal, deliveryCost:delivery, total,
  });

  const shiftState = getShiftState();
  const extraMin   = (shiftState?.active) ? (shiftState.extraMinutes || 20) : 0;
  document.getElementById('eta-time').textContent = selectedDelivery === 'pickup'
    ? `${15+extraMin}–${20+extraMin} min`
    : `${30+extraMin}–${45+extraMin} min`;

  const payLabels      = { transfer:'Transferencia bancaria', card:'Tarjeta débito/crédito', cash:'Efectivo', mercadopago:'Mercado Pago', baes:'BAES · Edenred (JUNAEB)' };
  const deliveryLabels = { delivery:'🛵 Delivery (30–45 min)', pickup:'🏪 Retiro en local (15–20 min)' };

  document.getElementById('confirm-order-num').textContent = orderNum;
  document.getElementById('confirm-details').innerHTML = `
    <div class="confirm-detail-row"><span class="confirm-detail-label">Entrega</span><span class="confirm-detail-val">${deliveryLabels[selectedDelivery]}</span></div>
    <div class="confirm-detail-row"><span class="confirm-detail-label">Pago</span><span class="confirm-detail-val">${payLabels[selectedPayMethod]}</span></div>
    <div class="confirm-detail-row"><span class="confirm-detail-label">Items</span><span class="confirm-detail-val">${cart.reduce((a,i)=>a+i.qty,0)} productos</span></div>
    <div class="confirm-detail-row"><span class="confirm-detail-label">Total</span><span class="confirm-detail-val">${clp(total)}</span></div>`;

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
  window.scrollTo({ top:0, behavior:'smooth' });
  showToast('¡Gracias por tu pedido! 🎉');
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── HORARIO ───────────────────────────────────────────────────
function isWithinHours() {
  const now = new Date();
  const h   = now.getHours() + now.getMinutes() / 60;
  return h >= OPEN_HOUR && h < CLOSE_HOUR;
}

function updateScheduleBadge() {
  const dot  = document.getElementById('hero-schedule-dot');
  const text = document.getElementById('hero-schedule-text');
  if (!dot || !text) return;
  const open = isWithinHours();
  dot.style.background = open ? '#A67A44' : '#593B2A';
  text.textContent = open
    ? '● Abierto ahora · Lun–Vie 07:00–19:00'
    : '● Cerrado · Abrimos Lun–Vie 07:00–19:00';
  text.style.color = open ? '#A67A44' : '#593B2A';
}

function getShiftState() {
  try {
    const raw = localStorage.getItem(SHIFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.expiresAt && Date.now() > data.expiresAt) {
      localStorage.removeItem(SHIFT_KEY);
      return null;
    }
    return data;
  } catch { return null; }
}

function checkShiftChange() {
  const shift  = getShiftState();
  const banner = document.getElementById('shift-banner');
  if (!banner) return;
  if (shift?.active) {
    const msg = document.getElementById('shift-banner-msg');
    if (msg) msg.textContent = `Estamos organizando el turno. Los tiempos de espera pueden ser de hasta ${shift.extraMinutes || 20} min adicionales. ¡Gracias por tu paciencia!`;
    banner.style.display = 'block';
  } else {
    banner.style.display = 'none';
  }
}

// ── STORAGE LISTENER (único) ──────────────────────────────────
window.addEventListener('storage', e => {
  switch (e.key) {
    case INV_KEY:
      if (document.getElementById('modal').classList.contains('open')) {
        renderExtras();
        renderSauces();
      }
      break;
    case MENU_INV_KEY:
      applyMenuAvailability();
      break;
    case SHIFT_KEY:
      checkShiftChange();
      updateScheduleBadge();
      break;
    case ORDER_READY_KEY:
      if (e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.num === currentOrderNum) showOrderReadyBanner(data.num);
        } catch {}
      }
      break;
  }
});

// ── SCROLL ANIMATIONS ─────────────────────────────────────────
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.style.animationPlayState = 'running'; obs.unobserve(e.target); }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));

// ── FORMATEO TARJETA ──────────────────────────────────────────
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

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyMenuAvailability();
  checkShiftChange();
  updateScheduleBadge();
});
setInterval(() => { updateScheduleBadge(); checkShiftChange(); }, 60000);