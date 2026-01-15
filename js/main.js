// js/main.js
(() => {
  const CART_KEY = "cart";

  // ---------- Helpers ----------
  function safeParseJSON(str, fallback) {
    try { return JSON.parse(str) ?? fallback; } catch { return fallback; }
  }
function getLoggedUserName() {
  // Senin projede login farklı anahtarlarla tutulmuş olabilir diye
  // birkaç olası localStorage key’ini tarıyoruz.
  const keysToTry = ["user", "currentUser", "authUser", "loggedUser", "profile"];

  for (const k of keysToTry) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;

    // JSON olabilir
    try {
      const obj = JSON.parse(raw);
      const name =
        obj?.name ||
        obj?.displayName ||
        obj?.fullName ||
        obj?.username ||
        obj?.email;

      if (name && String(name).trim()) return String(name).trim();
    } catch {
      // düz string olabilir
      if (raw && raw.trim()) return raw.trim();
    }
  }

  // Bazı projelerde direkt userName tutulur
  const direct =
    localStorage.getItem("userName") ||
    localStorage.getItem("username") ||
    localStorage.getItem("displayName");

  return direct && direct.trim() ? direct.trim() : null;
}

function updateAuthUI() {
  const profileLink = document.getElementById("profile-link");
  if (!profileLink) return;

  const name = getLoggedUserName();

  if (name) {
    profileLink.textContent = name.length > 18 ? name.slice(0, 18) + "…" : name;
    profileLink.href = "profile.html"; // sende profil sayfası farklıysa değiştir
    profileLink.classList.add("is-logged-in");
  } else {
    profileLink.textContent = "Giriş Yap";
    profileLink.href = "login.html";
    profileLink.classList.remove("is-logged-in");
  }
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
  };

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ---------- Boot ----------
  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    updateCartCountUI();
    renderCartPage();
    renderCheckoutSummaryPage();
    updateAuthUI(); 
    function digitsOnly(str) {
      initCheckoutWhatsApp();

  return String(str || "").replace(/\D/g, "");
}

// !!! BURAYI KENDİ NUMARANA GÖRE DÜZENLE !!!
// Örnek: "905xxxxxxxxx" (başında + yok, boşluk yok)
const WHATSAPP_NUMBER = "905416632158";

function initCheckoutWhatsApp() {
  const form = document.getElementById("checkout-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault(); // <<< sayfanın yenilenmesini engeller (yazılar silinmez)

    const cart = getCart();
    if (!cart || cart.length === 0) {
      alert("Sepetiniz boş.");
      return;
    }

    const fullname = document.getElementById("fullname")?.value?.trim() || "";
    const phone = document.getElementById("phone")?.value?.trim() || "";
    const address = document.getElementById("address")?.value?.trim() || "";
    const shipping = document.getElementById("shipping")?.value || "";
    const payment = document.getElementById("payment")?.value || "";
    const note = document.getElementById("note")?.value?.trim() || "";

    if (!fullname || !phone || !address) {
      alert("Lütfen Ad Soyad, Telefon ve Adres alanlarını doldurun.");
      return;
    }

    const totals = calcTotals(cart);

    const lines = [];
    lines.push("🧶 *İP DÜNYAM SİPARİŞ*");
    lines.push("");
    lines.push(`👤 Ad Soyad: ${fullname}`);
    lines.push(`📞 Telefon: ${phone}`);
    lines.push(`📍 Adres: ${address}`);
    lines.push(`🚚 Kargo: ${shipping}`);
    lines.push(`💳 Ödeme: ${payment}`);
    if (note) lines.push(`📝 Not: ${note}`);
    lines.push("");
    lines.push("🛒 *Ürünler:*");

    cart.forEach((it) => {
      lines.push(`- ${it.title} x${it.qty} = ${formatTL(Number(it.price) * Number(it.qty))}`);
    });

    lines.push("");
    lines.push(`Ara Toplam: ${formatTL(totals.subtotal)}`);
    lines.push(`Kargo: ${formatTL(totals.shipping)}`);
    lines.push(`Genel Toplam: ${formatTL(totals.total)}`);

    const msg = lines.join("\n");

    const phoneDigits = digitsOnly(WHATSAPP_NUMBER);
    if (!phoneDigits || phoneDigits.length < 10 || phoneDigits.includes("X")) {
      alert("WhatsApp numarası ayarlı değil. js/main.js içindeki WHATSAPP_NUMBER kısmını düzelt.");
      return;
    }

    const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(msg)}`;

    // Popup engeline takılmaması için en sağlam yöntem:
    window.location.href = url;
  });
}

  });
})();
