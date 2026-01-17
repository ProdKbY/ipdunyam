// js/main.js
(() => {
  const CART_KEY = "cart";

  // ---------- Helpers ----------
  function safeParseJSON(str, fallback) {
    try { return JSON.parse(str) ?? fallback; } catch { return fallback; }
  }

  function formatTL(value) {
    const n = Number(value || 0);
    return `${n.toFixed(2).replace(".", ",")} TL`;
  }

  function normalizeCartItem(raw) {
    const item = raw && typeof raw === "object" ? raw : {};
    const id = item.id ?? item.sku ?? item.code ?? item.title ?? item.name ?? item.productName ?? randomId();
    const title = (item.title ?? item.name ?? item.productName ?? "Ürün").toString();
    const image = (item.image ?? item.img ?? item.photo ?? "images/placeholder.jpg").toString();

    let price = item.price ?? item.unitPrice ?? item.fiyat ?? 0;
    if (typeof price === "string") {
      price = price.replace("TL", "").replace("₺", "").replaceAll(".", "").replace(",", ".").trim();
    }
    price = Number(price) || 0;

    let qty = item.qty ?? item.quantity ?? item.adet ?? 1;
    qty = Number(qty) || 1;
    if (qty < 1) qty = 1;

    return { id, title, image, price, qty };
  }

  function randomId() {
    return "id_" + Math.random().toString(16).slice(2);
  }

  function getCart() {
    const arr = safeParseJSON(localStorage.getItem(CART_KEY), []);
    if (!Array.isArray(arr)) return [];
    return arr.map(normalizeCartItem);
  }

  function setCart(arr) {
    localStorage.setItem(CART_KEY, JSON.stringify(arr));
    updateCartCountUI();
  }

  function calcTotals(cart) {
    const subtotal = cart.reduce((s, it) => s + (Number(it.price) * Number(it.qty)), 0);
    const shipping = subtotal > 0 ? 0 : 0; // istersen kargo kuralını buraya ekleriz
    const total = subtotal + shipping;
    return { subtotal, shipping, total };
  }

  function updateCartCountUI() {
    const cart = getCart();
    const count = cart.reduce((s, it) => s + (Number(it.qty) || 0), 0);

    // eski yapı: id="cart-count"
    const el = document.getElementById("cart-count");
    if (el) el.textContent = String(count);

    // yeni/alternatif: data-cart-count
    document.querySelectorAll("[data-cart-count]").forEach(n => n.textContent = String(count));
  }

  // ---------- Toast / Notification ----------
  // "Sepete eklendi" bildirimi kaybolmasın diye tek bir yerden yönetiyoruz.
  function showToast(message) {
    try {
      if (!document || !document.body) return;

      const old = document.getElementById("toast");
      if (old) old.remove();

      const t = document.createElement("div");
      t.id = "toast";
      t.textContent = String(message || "");

      // CSS bozulsa bile görünmesi için inline style
      t.style.position = "fixed";
      t.style.left = "50%";
      t.style.bottom = "24px";
      t.style.transform = "translateX(-50%)";
      t.style.padding = "10px 14px";
      t.style.borderRadius = "12px";
      t.style.background = "rgba(0,0,0,0.85)";
      t.style.color = "#fff";
      t.style.fontSize = "14px";
      t.style.zIndex = "9999";
      t.style.maxWidth = "90%";
      t.style.textAlign = "center";

      document.body.appendChild(t);

      setTimeout(() => {
        t.style.opacity = "0";
        t.style.transition = "opacity 250ms ease";
        setTimeout(() => t.remove(), 260);
      }, 1400);
    } catch {
      // sessiz geç
    }
  }

  // ---------- Auth UI (Navbar) ----------
  function getCurrentUserSafe() {
    const keys = ["currentUser", "user", "firebaseUser"];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      try {
        const obj = JSON.parse(raw);
        if (obj && typeof obj === "object") return obj;
      } catch {
        return { name: raw };
      }
    }
    return null;
  }

  function updateAuthUI() {
    const profileLink = document.getElementById("profile-link");
    if (!profileLink) return;

    const user = getCurrentUserSafe();
    if (!user) {
      profileLink.textContent = "Giriş Yap";
      profileLink.href = "login.html";
      return;
    }

    const name =
      user.name ||
      user.displayName ||
      user.fullName ||
      user.username ||
      (user.email ? String(user.email).split("@")[0] : null) ||
      "Hesabım";

    profileLink.textContent = name;
    profileLink.href = "profile.html";
  }

  // ---------- Nav / Burger ----------
  function initNav() {
    const btn = document.getElementById("navToggle");
    const nav = document.getElementById("mainNav");
    if (!btn || !nav) return;

    btn.addEventListener("click", () => {
      nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", nav.classList.contains("open") ? "true" : "false");
    });

    nav.addEventListener("click", (e) => {
      if (e.target && e.target.closest("a")) {
        nav.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // ---------- Cart Page ----------
  function renderCartPage() {
    const listEl = document.getElementById("cart-items");
    if (!listEl) return;

    const emptyEl = document.getElementById("empty-cart");
    const summaryEl = document.getElementById("cart-summary");
    const checkoutBtn = document.getElementById("checkout-btn");

    const cart = getCart();

    if (cart.length === 0) {
      if (emptyEl) emptyEl.style.display = "block";
      if (summaryEl) summaryEl.style.display = "none";
      if (checkoutBtn) checkoutBtn.style.display = "none";
      listEl.innerHTML = "";
      // totals
      const sub = document.getElementById("subtotal");
      const total = document.getElementById("total");
      if (sub) sub.textContent = formatTL(0);
      if (total) total.textContent = formatTL(0);
      return;
    }

    if (emptyEl) emptyEl.style.display = "none";
    if (summaryEl) summaryEl.style.display = "block";
    if (checkoutBtn) checkoutBtn.style.display = "inline-flex";

    listEl.innerHTML = cart.map(it => {
      const line = Number(it.price) * Number(it.qty);
      return `
        <div class="cart-item" data-id="${escapeHtml(String(it.id))}">
          <img class="cart-img" src="${escapeHtml(it.image)}" alt="">
          <div class="cart-info">
            <div class="cart-name">${escapeHtml(it.title)}</div>
            <div class="cart-price">${formatTL(it.price)} <span class="muted">/ adet</span></div>

            <div class="cart-actions">
              <button class="qty-btn" type="button" data-action="dec">−</button>
              <span class="qty">${it.qty}</span>
              <button class="qty-btn" type="button" data-action="inc">+</button>

              <button class="remove-btn" type="button" data-action="remove">Sil</button>
            </div>
          </div>

          <div class="cart-line-total">${formatTL(line)}</div>
        </div>
      `;
    }).join("");

    const totals = calcTotals(cart);
    const subEl = document.getElementById("subtotal");
    const totalEl = document.getElementById("total");
    if (subEl) subEl.textContent = formatTL(totals.subtotal);
    if (totalEl) totalEl.textContent = formatTL(totals.total);

    // delegation
    listEl.onclick = (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;

      const itemEl = btn.closest(".cart-item");
      if (!itemEl) return;
      const id = itemEl.getAttribute("data-id");
      const action = btn.getAttribute("data-action");

      let cartNow = getCart();
      const idx = cartNow.findIndex(x => String(x.id) === String(id));
      if (idx < 0) return;

      if (action === "inc") cartNow[idx].qty += 1;
      if (action === "dec") cartNow[idx].qty = Math.max(1, cartNow[idx].qty - 1);
      if (action === "remove") cartNow = cartNow.filter(x => String(x.id) !== String(id));

      setCart(cartNow);
      renderCartPage();
      renderCheckoutSummaryPage(); // aynı anda açık olmasa da zararsız
    };
  }

  // ---------- Checkout Summary ----------
  function renderCheckoutSummaryPage() {
    const itemsEl = document.getElementById("checkout-items");
    const subEl = document.getElementById("subtotal");
    const shipEl = document.getElementById("shipping-fee");
    const grandEl = document.getElementById("grand-total");
    if (!itemsEl || !subEl || !shipEl || !grandEl) return;

    const noteEl = document.getElementById("stock-note");
    const cart = getCart();

    if (cart.length === 0) {
      itemsEl.innerHTML = "";
      subEl.textContent = formatTL(0);
      shipEl.textContent = formatTL(0);
      grandEl.textContent = formatTL(0);
      if (noteEl) noteEl.style.display = "block";
      return;
    }

    if (noteEl) noteEl.style.display = "none";

    itemsEl.innerHTML = cart.map(it => {
      const line = Number(it.price) * Number(it.qty);
      return `
        <div class="summary-item">
          <span>${escapeHtml(it.title)} <span class="muted">x${it.qty}</span></span>
          <span>${formatTL(line)}</span>
        </div>
      `;
    }).join("");

    const totals = calcTotals(cart);
    subEl.textContent = formatTL(totals.subtotal);
    shipEl.textContent = formatTL(totals.shipping);
    grandEl.textContent = formatTL(totals.total);
  }

  // ---------- Public API: addToCart ----------
  // Eski kullanım: addToCart("Ürün Adı", 250)
  // Yeni kullanım: addToCart({id,title,price,image})
  window.addToCart = function(a, b, c) {
    let product;

    if (typeof a === "object" && a) {
      product = a;
    } else {
      product = {
        title: a,
        price: b,
        image: c || "images/placeholder.jpg",
        qty: 1
      };
    }

    const p = normalizeCartItem({ ...product, qty: 1 });
    const cart = getCart();

    // Aynı ürün: title bazlı birleştir (eski sayfalar id vermiyor)
    const idx = cart.findIndex(x => (x.id && p.id && String(x.id) === String(p.id)) || String(x.title) === String(p.title));
    if (idx >= 0) cart[idx].qty += 1;
    else cart.push(p);

    setCart(cart);
    showToast("Sepete eklendi ✅");
  };

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ---------- Fallback: Mobile add-to-cart click handler ----------
  // Bazı mobil tarayıcılarda inline onclick engellenebiliyor veya tıklama yutulabiliyor.
  // Bu yüzden .add-to-cart butonlarına ayrıca dinleyici ekliyoruz.
  function initAddToCartFallback() {
    const buttons = Array.from(document.querySelectorAll(".add-to-cart"));
    if (buttons.length === 0) return;

    const handler = (ev) => {
      const btn = ev.currentTarget;
      if (!btn) return;

      // Olası form submit / link davranışlarını engelle
      ev.preventDefault();
      ev.stopPropagation();

      const card = btn.closest(".product-card") || btn.parentElement;
      const title = card?.querySelector("h3, h2, .title")?.textContent?.trim() || btn.dataset.name || "Ürün";

      // Öncelik: data-price (sayı), yoksa karttaki .price metninden rakam çek
      let price = Number(btn.dataset.price);
      if (!Number.isFinite(price) || price <= 0) {
        const priceText = card?.querySelector(".price")?.textContent || "";
        const digits = String(priceText).replace(/[^0-9]/g, "");
        price = Number(digits || 0);
      }

      // Görsel (opsiyonel)
      const image = card?.querySelector("img")?.getAttribute("src") || "images/placeholder.jpg";

      // addToCart global API
      if (typeof window.addToCart === "function") {
        window.addToCart({ title, price, image });
      }
    };

    buttons.forEach((btn) => {
      // Buton bir form içindeyse submit olmasın
      if (!btn.getAttribute("type")) btn.setAttribute("type", "button");

      // Click + touchend ikisini de dinle (mobilde garanti)
      btn.addEventListener("click", handler, { passive: false });
      btn.addEventListener("touchend", handler, { passive: false });
    });
  }

  // ---------- Boot ----------
  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    updateAuthUI();

    // başka sekmede login/logout olursa navbar güncellensin
    window.addEventListener("storage", (e) => {
      if (["currentUser", "user", "firebaseUser"].includes(e.key)) updateAuthUI();
    });

    updateCartCountUI();
    initAddToCartFallback();
    renderCartPage();
    renderCheckoutSummaryPage();
  });
})();
