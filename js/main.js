/*************************************************
 * İP DÜNYAM - MAIN.JS
 * Tek dosya / tek state / GitHub Pages uyumlu
 *************************************************/

/* =========================
   CART (Sepet)
========================= */
const CART_KEY = "cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + (item.qty || 1), 0);

  const countEl = document.getElementById("cart-count");
  if (countEl) countEl.textContent = total;

  const floatEl = document.getElementById("cart-count-float");
  if (floatEl) floatEl.textContent = total;
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  saveCart(cart);
  alert("Ürün sepete eklendi");
}

/* =========================
   AUTH (Login / Register)
========================= */

const CURRENT_USER_KEY = "currentUser";

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
  } catch {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}
const USERS_KEY = "users";

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  window.location.href = "index.html";
}

/* =========================
   UI (Navbar / Header)
========================= */
function updateProfileLinkUI() {
  const profileLink = document.getElementById("profile-link");
  if (!profileLink) return;

  const user = getCurrentUser();
  if (user) {
    profileLink.textContent = user.name
      ? `👤 ${user.name}`
      : "👤 Profil";
    profileLink.href = "profile.html";
  } else {
    profileLink.textContent = "Giriş Yap";
    profileLink.href = "login.html";
  }
}

/* =========================
   MOBILE MENU
========================= */
function initMobileNav() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("mainNav");

  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });
}



/* =========================
   FLOATING CART (Mobilde sağda baloncuk)
========================= */
function createFloatingCart() {
  // Zaten varsa tekrar ekleme
  if (document.querySelector(".floating-cart")) return;

  const a = document.createElement("a");
  a.href = "cart.html";
  a.className = "floating-cart";
  a.setAttribute("aria-label", "Sepete git");

  a.innerHTML = `
    <span class="floating-cart-icon">🛒</span>
    <span id="cart-count-float" class="floating-cart-count">0</span>
  `;

  document.body.appendChild(a);
}
/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  updateProfileLinkUI();
  initMobileNav();
  createFloatingCart();
  updateCartCount();
});
