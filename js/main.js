// ==============================
// İP DÜNYAM - main.js (SON HAL)
// ==============================

// 🔹 Sepeti localStorage'dan al (SADECE 1 KEZ TANIMLANIR)
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ==============================
// SEPET SAYACI
// ==============================
function updateCartCount() {
  const countEl = document.getElementById("cart-count");
  if (countEl) {
    countEl.textContent = cart.length;
  }
}

// ==============================
// SEPETE EKLE
// ==============================
function addToCart(name, price) {
  cart.push({ name, price });
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  alert("Ürün sepete eklendi 🧺");
}

// ==============================
// SEPET SAYFASI (cart.html)
// ==============================
function renderCart() {
  const cartContainer = document.getElementById("cart-items");
  const emptyText = document.getElementById("empty-cart");
  const checkoutBtn = document.getElementById("checkout-btn");

  if (!cartContainer) return;

  cartContainer.innerHTML = "";

  if (cart.length === 0) {
    if (emptyText) emptyText.style.display = "block";
    if (checkoutBtn) checkoutBtn.style.display = "none";
    return;
  }

  if (emptyText) emptyText.style.display = "none";
  if (checkoutBtn) checkoutBtn.style.display = "inline-block";

  cart.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <p><strong>${item.name}</strong><br>${item.price} TL</p>
      <button class="remove-btn" data-index="${index}">Kaldır</button>
    `;
    cartContainer.appendChild(div);
  });

  // Kaldır butonları
  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const index = e.target.getAttribute("data-index");
      cart.splice(index, 1);
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
      updateCartCount();
    });
  });
}

// ==============================
// PROFİL LINKİ (LOGIN KONTROL)
// ==============================
function updateProfileLink() {
  const profileLink = document.getElementById("profile-link");
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!profileLink) return;

  if (isLoggedIn === "true" && user) {
    profileLink.href = "profile.html";
    profileLink.textContent = `👤 ${user.fullname.split(" ")[0]}`;
  } else {
    profileLink.href = "login.html";
    profileLink.textContent = "👤 Giriş Yap";
  }
}

// ==============================
// MOBİL NAV (HAMBURGER)
// ==============================
function initMobileNav() {
  const btn = document.getElementById("navToggle");
  const nav = document.getElementById("mainNav");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    nav.classList.toggle("open");
  });
}

// ==============================
// SAYFA YÜKLENİNCE
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  renderCart();
  updateProfileLink();
  initMobileNav();
});
// ============================
// Mobile Nav Toggle
// ============================
(() => {
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");

  // Eğer sayfada yoksa çık
  if (!navToggle || !mainNav) return;

  // Başlangıç: aria
  navToggle.setAttribute("aria-expanded", "false");

  // Tıklayınca aç/kapat
  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Menüden bir linke tıklanınca kapat (mobil)
  mainNav.addEventListener("click", (e) => {
    if (e.target.tagName === "A" && window.innerWidth <= 768) {
      mainNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
})();
// ============================
// Mobile Nav Toggle (Hamburger)
// ============================
(() => {
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");

  if (!navToggle || !mainNav) return;

  navToggle.setAttribute("aria-expanded", "false");

  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Mobilde bir linke tıklayınca menüyü kapat
  mainNav.addEventListener("click", (e) => {
    if (e.target.tagName === "A" && window.innerWidth <= 768) {
      mainNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
})();
