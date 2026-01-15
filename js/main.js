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

function slugifyTR(text){
  return String(text || "")
    .toLowerCase()
    .replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ş/g,"s").replace(/ı/g,"i").replace(/ö/g,"o").replace(/ç/g,"c")
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/(^-|-$)+/g,"");
}

function normalizeCartItem(item){
  if(!item) return null;

  // If old broken entries exist, ignore them
  if(typeof item === "string") return null;

  const name = item.name || item.title || item.productName;
  const price = Number(item.price);
  const qty = Number(item.qty ?? item.quantity ?? 1);

  if(!name || !Number.isFinite(price) || !Number.isFinite(qty)) return null;

  const id = item.id || slugifyTR(name);
  const image = item.image || item.img || "images/placeholder.jpg";

  return { id, name, price, qty: Math.max(1, Math.round(qty)), image };
}

function getCleanCart(){
  const cart = getCart();
  const clean = cart.map(normalizeCartItem).filter(Boolean);
  if(clean.length !== cart.length) saveCart(clean);
  return clean;
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}



function addToCart(nameOrProduct, price, image) {
  let product;

  // Support old inline onclick="addToCart('Ürün', 250)"
  if (typeof nameOrProduct === "string") {
    const name = nameOrProduct;
    const p = Number(price);
    if (!Number.isFinite(p)) {
      alert("Ürün fiyatı okunamadı.");
      return;
    }
    product = {
      id: slugifyTR(name),
      name,
      price: p,
      image: image || "images/placeholder.jpg"
    };
  } else {
    product = nameOrProduct || {};
    // Ensure required fields
    product = {
      id: product.id || slugifyTR(product.name || product.title || "urun"),
      name: product.name || product.title || "Ürün",
      price: Number(product.price || 0),
      image: product.image || "images/placeholder.jpg"
    };
    if (!Number.isFinite(product.price) || product.price <= 0) {
      alert("Ürün fiyatı okunamadı.");
      return;
    }
  }

  const cart = getCleanCart();
  const existing = cart.find(i => i.id === product.id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  saveCart(cart);
  updateCartCount();
  alert("Ürün sepete eklendi");
}

/* =========================
   AUTH (Login / Register)
========================= */







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
  // Try common nav containers
  const nav =
    document.getElementById("mainNav") ||
    document.querySelector(".main-nav") ||
    document.querySelector("nav.nav") ||
    document.querySelector("nav");

  if (!toggle || !nav) return;

  const closeMenu = () => {
    nav.classList.remove("open");
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  const toggleMenu = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const willOpen = !nav.classList.contains("open");
    nav.classList.toggle("open", willOpen);
    document.body.classList.toggle("menu-open", willOpen);
    toggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
  };

  toggle.setAttribute("aria-expanded", "false");
  toggle.addEventListener("click", toggleMenu);
  toggle.addEventListener("touchstart", toggleMenu, { passive: false });

  // Close menu after clicking any link inside nav
  nav.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    closeMenu();
  });

  // Close menu when tapping outside
  document.addEventListener("click", (e) => {
    if (!document.body.classList.contains("menu-open")) return;
    if (nav.contains(e.target) || e.target === toggle) return;
    closeMenu();
  });

  // Close on resize to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) closeMenu();
  });
}

/* =========================
   INIT
========================= */
function formatTRY(amount){
  try{
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount);
  }catch{
    return amount + " ₺";
  }
}

function updateCartCount(){
  const cart = getCleanCart();
  const count = cart.reduce((sum,i)=>sum + (Number(i.qty)||0), 0);
  const el = document.getElementById("cart-count");
  if(el) el.textContent = String(count);
  updateCartFloatCount();
}

function changeQty(id, delta){
  const cart = getCleanCart();
  const item = cart.find(i => i.id === id);
  if(!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(cart);
  renderCart();
  updateCartCount();
}

function removeFromCart(id){
  const cart = getCleanCart().filter(i => i.id !== id);
  saveCart(cart);
  renderCart();
  updateCartCount();
}

function renderCart(){
  const container = document.getElementById("cart-items");
  if(!container) return; // not on cart page

  const emptyEl = document.getElementById("empty-cart");
  const checkoutBtn = document.getElementById("checkout-btn");
  const summary = document.getElementById("cart-summary");
  const subtotalEl = document.getElementById("subtotal");
  const totalEl = document.getElementById("total");

  const cart = getCleanCart();

  if(cart.length === 0){
    container.innerHTML = "";
    if(emptyEl) emptyEl.style.display = "block";
    if(checkoutBtn) checkoutBtn.style.display = "none";
    if(summary) summary.style.display = "none";
    return;
  }

  if(emptyEl) emptyEl.style.display = "none";
  if(checkoutBtn) checkoutBtn.style.display = "inline-block";
  if(summary) summary.style.display = "block";

  let subtotal = 0;

  container.innerHTML = cart.map(item => {
    const line = item.price * item.qty;
    subtotal += line;

    return `
      <div class="cart-item">
        <img class="cart-img" src="${item.image}" alt="${item.name}">
        <div class="cart-info">
          <div class="cart-name">${item.name}</div>
          <div class="cart-price">${formatTRY(item.price)}</div>

          <div class="cart-actions">
            <button class="qty-btn" type="button" onclick="changeQty('${item.id}', -1)">−</button>
            <span class="qty">${item.qty}</span>
            <button class="qty-btn" type="button" onclick="changeQty('${item.id}', 1)">+</button>

            <button class="remove-btn" type="button" onclick="removeFromCart('${item.id}')">Sil</button>
          </div>
        </div>

        <div class="cart-line-total">${formatTRY(line)}</div>
      </div>
    `;
  }).join("");

  const total = subtotal; // şimdilik kargo/indirim yok
  if(subtotalEl) subtotalEl.textContent = formatTRY(subtotal);
  if(totalEl) totalEl.textContent = formatTRY(total);
}

document.addEventListener("DOMContentLoaded", () => {
  ensureCartFloat();
  updateCartCount();
  updateProfileLinkUI();
  initMobileNav();
  renderCart();
});


/* =========================
   Mobile Cart Bubble
========================= */
function ensureCartFloat(){
  // Create once
  if(document.getElementById("cart-float")) return;

  const a = document.createElement("a");
  a.id = "cart-float";
  a.className = "cart-float";
  a.href = "cart.html";
  a.setAttribute("aria-label","Sepete Git");

  a.innerHTML = `
    <span aria-hidden="true">🛒</span>
    <span class="badge" id="cart-float-count">0</span>
  `;

  document.body.appendChild(a);

  // Mark nav cart item so we can hide it on mobile
  const navCartCount = document.getElementById("cart-count");
  if(navCartCount){
    const li = navCartCount.closest("li");
    if(li) li.classList.add("nav-cart-item");
  }
}

function updateCartFloatCount(){
  const el = document.getElementById("cart-float-count");
  if(!el) return;
  // We show total quantity
  const cart = getCart();
  const totalQty = cart.reduce((sum, it) => sum + (Number(it.qty)||1), 0);
  el.textContent = String(totalQty);
}
