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

// Colores de capas para la vista previa del sandwich
const LAYER_COLORS = {
  '🥬':'#5a9e5a', '🍅':'#c0392b', '🧅':'#9b59b6', '🥩':'#7b3a18',
  '🥚':'#e8a000', '🥑':'#5d8a3c', '🧀':'#e8c840', '🍗':'#c8782a',
  '🐷':'#d4826a', '🐟':'#5a8ac0', '🥒':'#7ab87a', '🌽':'#e8c040',
  '🍄':'#9b7040', '🧄':'#d4c070', '🥓':'#c84820',
};

// ── STATE ─────────────────────────────────────────────────────
let currentSandwich = null;
let selectedExtras  = new Set();
let selectedSauces  = new Set();
let selectedPan     = 'Marraqueta';
let qty             = 1;
let cartCount       = 0;

// ── MODAL ─────────────────────────────────────────────────────
function openModal(name, desc, baseIngs, basePrice, bg) {
  currentSandwich = { name, desc, baseIngs, basePrice, bg };
  selectedExtras  = new Set();
  selectedSauces  = new Set();
  selectedPan     = 'Marraqueta';
  qty             = 1;

  document.getElementById('modal-name').textContent = name;
  document.getElementById('modal-desc').textContent = desc;
  document.getElementById('qty-num').textContent    = '1';

  // Reset selección de pan
  document.querySelectorAll('.pan-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector('[data-pan="Marraqueta"]').classList.add('selected');

  renderBaseIngs(baseIngs);
  renderExtras();
  renderSauces();
  updatePreview();
  updateTotal();

  document.getElementById('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  document.body.style.overflow = '';
}

// Cerrar al hacer clic en el fondo
document.getElementById('modal').addEventListener('click', e => {
  if (e.target === document.getElementById('modal')) closeModal();
});

// ── RENDER: INGREDIENTES BASE ─────────────────────────────────
function renderBaseIngs(ings) {
  const el = document.getElementById('base-ings');
  el.innerHTML = ings.map(ing => `
    <div class="ing-option base-ing">
      <div class="ing-left">
        <span class="ing-emoji">${ing.split(' ')[0]}</span>
        <span class="ing-name">${ing.split(' ').slice(1).join(' ')}</span>
      </div>
      <span style="font-size:.7rem;color:var(--gris)">incluido</span>
    </div>
  `).join('');
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
        <span class="ing-price">+$${e.price.toLocaleString('es-CL')}</span>
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
        <span class="ing-price">${s.price > 0 ? '+$' + s.price : 'gratis'}</span>
        <div class="ing-check">✓</div>
      </div>
    </div>
  `).join('');
}

// ── TOGGLE EXTRAS / SALSAS ────────────────────────────────────
function toggleExtra(id) {
  selectedExtras.has(id) ? selectedExtras.delete(id) : selectedExtras.add(id);
  renderExtras();
  updatePreview();
  updateTotal();
}

function toggleSauce(id) {
  selectedSauces.has(id) ? selectedSauces.delete(id) : selectedSauces.add(id);
  renderSauces();
  updateTotal();
}

// ── SELECCIÓN DE PAN ──────────────────────────────────────────
function selectPan(btn) {
  document.querySelectorAll('.pan-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedPan = btn.dataset.pan;
  updateTotal();
}

// ── VISTA PREVIA (capas del sandwich) ────────────────────────
function updatePreview() {
  if (!currentSandwich) return;

  const container = document.getElementById('preview-layers');
  const panStyle  = 'background:#b87d40;color:#fff;';
  const layers    = [];

  // Pan superior
  layers.push(`<div class="preview-layer adding" style="${panStyle}border-radius:50px 50px 6px 6px;">🍞 ${selectedPan} (arriba)</div>`);

  // Ingredientes incluidos en la base
  currentSandwich.baseIngs.forEach(ing => {
    const emoji = ing.split(' ')[0];
    const name  = ing.split(' ').slice(1).join(' ');
    const bg    = LAYER_COLORS[emoji] || '#888';
    layers.push(`<div class="preview-layer adding" style="background:${bg};color:#fff;">${emoji} ${name}</div>`);
  });

  // Extras seleccionados por el usuario
  selectedExtras.forEach(id => {
    const ex = EXTRAS.find(e => e.id === id);
    if (!ex) return;
    const bg = LAYER_COLORS[ex.emoji] || '#a67a44';
    layers.push(`<div class="preview-layer adding" style="background:${bg};color:#fff;">${ex.emoji} ${ex.name}</div>`);
  });

  // Pan inferior
  layers.push(`<div class="preview-layer adding" style="${panStyle}border-radius:6px 6px 50px 50px;">🍞 ${selectedPan} (abajo)</div>`);

  container.innerHTML = layers.join('');
}

// ── CÁLCULO DE TOTAL ──────────────────────────────────────────
function updateTotal() {
  if (!currentSandwich) return;

  let total = currentSandwich.basePrice;
  if (selectedPan === 'Brioche') total += 300;

  selectedExtras.forEach(id => {
    const ex = EXTRAS.find(e => e.id === id);
    if (ex) total += ex.price;
  });
  selectedSauces.forEach(id => {
    const s = SAUCES.find(s => s.id === id);
    if (s) total += s.price;
  });

  total *= qty;
  document.getElementById('modal-total').textContent = '$' + total.toLocaleString('es-CL');
}

// ── CONTROL DE CANTIDAD ───────────────────────────────────────
function changeQty(d) {
  qty = Math.max(1, qty + d);
  document.getElementById('qty-num').textContent = qty;
  updateTotal();
}

// ── AGREGAR AL CARRITO ────────────────────────────────────────
function addToCart() {
  cartCount += qty;
  document.getElementById('cart-badge').textContent = cartCount;
  closeModal();
  showToast(`🥪 ${qty}× ${currentSandwich.name} agregado`);
}

// ── TOAST DE CONFIRMACIÓN ─────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── ANIMACIONES AL HACER SCROLL ───────────────────────────────
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.animationPlayState = 'running';
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));
