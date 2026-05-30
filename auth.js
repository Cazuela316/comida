/* ═══════════════════════════════════════════════════════
   auth.js — Sistema de autenticación prototipo FE
   Cifrado: SHA-256 via Web Crypto API
   Sesión: expira a los 15 min de inactividad
═══════════════════════════════════════════════════════ */

const AUTH_KEY      = 'fe_users';
const SESSION_KEY   = 'fe_session';
const TIMEOUT_MS    = 15 * 60 * 1000; // 15 minutos

let sessionTimer    = null;
let countdownTimer  = null;
let sessionExpireAt = null;

/* ── Cifrado SHA-256 ─────────────────────────────────── */
async function sha256(text) {
  const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ── Usuarios en localStorage ────────────────────────── */
function getUsers() {
  return JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
}
function saveUsers(users) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(users));
}

/* ── SESIÓN  ──────────────────────────────────────────── */
function saveSession(user) {
  const expire = Date.now() + TIMEOUT_MS;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email, name: user.name, expire }));
  sessionExpireAt = expire;
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionExpireAt = null;
}
function getSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (s && s.expire > Date.now()) return s;
    clearSession();
    return null;
  } catch { return null; }
}

/* ── RESET TIMER DE INACTIVIDAD ──────────────────────── */
function resetInactivityTimer() {
  clearTimeout(sessionTimer);
  if (!getSession()) return;
  sessionExpireAt = Date.now() + TIMEOUT_MS;
  saveSession(getSession()); // actualiza expire
  sessionTimer = setTimeout(() => {
    handleLogout(true); // expiró
  }, TIMEOUT_MS);
}

/* Lee actividad del usuario */
['mousemove','keydown','click','scroll','touchstart'].forEach(ev => {
  document.addEventListener(ev, () => { if (getSession()) resetInactivityTimer(); }, { passive: true });
});

/* ── Countdown en modal ──────────────────────────────── */
function startCountdown() {
  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    const el = document.getElementById('session-countdown');
    if (!el || !sessionExpireAt) return;
    const remaining = Math.max(0, sessionExpireAt - Date.now());
    const m = Math.floor(remaining / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    if (remaining < 60000) el.style.color = '#c0392b';
    else el.style.color = '';
  }, 1000);
}

/* ── UI helpers ──────────────────────────────────────── */
function openAuthModal(e) {
  if (e) e.preventDefault();
  const modal = document.getElementById('auth-modal');
  modal.style.display = 'flex';
  const session = getSession();
  if (session) {
    showLoggedForm(session);
  } else {
    switchAuthTab('login');
  }
}
function closeAuthModal() {
  document.getElementById('auth-modal').style.display = 'none';
}
function switchAuthTab(tab) {
  document.getElementById('auth-form-login').style.display    = tab === 'login'    ? 'flex' : 'none';
  document.getElementById('auth-form-register').style.display = tab === 'register' ? 'flex' : 'none';
  document.getElementById('auth-form-logged').style.display   = 'none';
  document.getElementById('tab-login').classList.toggle('active',    tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.querySelector('.auth-tabs').style.display = 'flex';
  clearErrors();
}
function showLoggedForm(session) {
  document.getElementById('auth-form-login').style.display    = 'none';
  document.getElementById('auth-form-register').style.display = 'none';
  document.getElementById('auth-form-logged').style.display   = 'flex';
  document.querySelector('.auth-tabs').style.display          = 'none';
  const initials = (session.name || session.email).slice(0,2).toUpperCase();
  document.getElementById('auth-avatar').textContent       = initials;
  document.getElementById('auth-logged-name').textContent  = session.name || 'Usuario';
  document.getElementById('auth-logged-email').textContent = session.email;
  startCountdown();
}
function clearErrors() {
  ['login-error','register-error'].forEach(id => {
    const el = document.getElementById(id);
    el.textContent = '';
    el.classList.remove('visible');
  });
}
function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add('visible');
}

/* ── Toggle contraseña visible ───────────────────────── */
function togglePass(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (inp.type === 'password') { inp.type = 'text';     btn.textContent = '🙈'; }
  else                         { inp.type = 'password'; btn.textContent = '👁';  }
}

/* ── INDICADOR DE FORTALEZA CONTRASEÑA ──────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const passInput = document.getElementById('reg-pass');
  if (passInput) {
    passInput.addEventListener('input', () => {
      const val = passInput.value;
      const el  = document.getElementById('pass-strength');
      if (!val) { el.textContent = ''; return; }
      let score = 0;
      if (val.length >= 6)  score++;
      if (val.length >= 10) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;
      const levels = [
        { label: '● Muy débil',  color: '#e74c3c' },
        { label: '●● Débil',     color: '#e67e22' },
        { label: '●●● Regular',  color: '#f1c40f' },
        { label: '●●●● Buena',   color: '#2ecc71' },
        { label: '●●●●● Fuerte', color: '#27ae60' },
      ];
      const lvl = levels[Math.min(score, 4)];
      el.textContent    = lvl.label;
      el.style.color    = lvl.color;
    });
  }

  // Verificar sesión al cargar
  const session = getSession();
  if (session) {
    updateNavAuth(session);
    resetInactivityTimer();
  }
});

/* ── ACTUALIZAR NAV ──────────────────────────────────── */
function updateNavAuth(session) {
  const btn = document.getElementById('nav-auth-btn');
  if (!btn) return;
  if (session) {
    const initials = (session.name || session.email).slice(0,2).toUpperCase();
    btn.textContent = `👤 ${session.name || initials}`;
    btn.classList.add('logged-in');
  } else {
    btn.textContent = '👤 Iniciar sesión';
    btn.classList.remove('logged-in');
  }
}

/* ── INICIAR SESIÓN ───────────────────────────────────────────── */
async function handleLogin() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pass  = document.getElementById('login-pass').value;
  clearErrors();

  if (!email || !pass) return showError('login-error', '⚠️ Completa todos los campos.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError('login-error', '⚠️ Correo inválido.');

  const users = getUsers();
  if (!users[email]) return showError('login-error', '❌ No existe una cuenta con ese correo.');

  const hash = await sha256(pass);
  if (users[email].hash !== hash) return showError('login-error', '❌ Contraseña incorrecta.');

  const session = { email, name: users[email].name };
  saveSession(session);
  resetInactivityTimer();
  updateNavAuth(session);
  showLoggedForm(session);
  showToast(`¡Bienvenido de vuelta, ${session.name}! 👋`);
}

/* ── CREAR CUENTA  ────────────────────────────────────────── */
async function handleRegister() {
  const name   = document.getElementById('reg-name').value.trim();
  const email  = document.getElementById('reg-email').value.trim().toLowerCase();
  const pass   = document.getElementById('reg-pass').value;
  const pass2  = document.getElementById('reg-pass2').value;
  clearErrors();

  if (!name || !email || !pass || !pass2) return showError('register-error', '⚠️ Completa todos los campos.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError('register-error', '⚠️ Correo inválido.');
  if (pass.length < 6)  return showError('register-error', '⚠️ La contraseña debe tener al menos 6 caracteres.');
  if (pass !== pass2)   return showError('register-error', '❌ Las contraseñas no coinciden.');

  const users = getUsers();
  if (users[email]) return showError('register-error', '❌ Ya existe una cuenta con ese correo.');

  const hash = await sha256(pass);
  users[email] = { name, hash, createdAt: new Date().toISOString() };
  saveUsers(users);

  const session = { email, name };
  saveSession(session);
  resetInactivityTimer();
  updateNavAuth(session);
  showLoggedForm(session);
  showToast(`¡Cuenta creada! Bienvenido, ${name} 🎉`);
}

/* ── Logout ──────────────────────────────────────────── */
function handleLogout(expired = false) {
  clearTimeout(sessionTimer);
  clearInterval(countdownTimer);
  clearSession();
  updateNavAuth(null);
  closeAuthModal();
  if (expired) {
    setTimeout(() => showToast('⏱ Sesión expirada por inactividad.'), 200);
  } else {
    showToast('Sesión cerrada. ¡Vuelva pronto! 👋');
  }
}
