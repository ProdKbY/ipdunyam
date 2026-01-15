// js/auth.js (GitHub Pages uyumlu)
// Bu dosya sadece login.html / register.html / verify.html gibi auth sayfalarında yüklenmelidir.

import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const $ = (id) => document.getElementById(id);


function syncLocalUser(user){
  try{
    if(!user){
      localStorage.removeItem("currentUser");
      localStorage.removeItem("isLoggedIn");
      return;
    }
    const safeName = user.displayName || (user.email ? user.email.split("@")[0] : "Kullanıcı");
    localStorage.setItem("currentUser", JSON.stringify({ name: safeName, email: user.email || "" }));
    localStorage.setItem("isLoggedIn", "true");
  }catch(e){
    console.warn("syncLocalUser error", e);
  }
}


function showMsg(text, type = "error") {
  const box = $("msg");
  if (!box) {
    alert(text);
    return;
  }
  box.textContent = text;
  box.style.display = "block";
  box.setAttribute("role", "status");
  box.style.padding = "10px";
  box.style.borderRadius = "12px";
  box.style.margin = "12px 0";
  box.style.fontSize = "14px";
  box.style.border = "1px solid rgba(0,0,0,.06)";
  box.style.background = type === "ok" ? "#e8fff0" : "#ffecec";
  box.style.color = type === "ok" ? "#0f6d2a" : "#9b1c1c";
}

function requiresTurnstile() {
  return !!document.querySelector(".cf-turnstile");
}

function hasTurnstileToken() {
  return typeof window.__tsToken === "string" && window.__tsToken.length > 0;
}

/* -------------------------
   Şifre göster / gizle
   - login.html:  #loginPassword, #pwToggle
   - register.html: #regPassword, #pwToggle
--------------------------*/
(function initPasswordToggle() {
  const btn = $("pwToggle");
  if (!btn) return;

  // Sayfaya göre hangi password input'u var?
  const pw =
    $("loginPassword") ||
    $("regPassword") ||
    document.querySelector('input[type="password"]');

  if (!pw) return;

  btn.addEventListener("click", () => {
    const isPw = pw.type === "password";
    pw.type = isPw ? "text" : "password";
    btn.textContent = isPw ? "Gizle" : "Göster";
    pw.focus();
  });
})();

/* -------------------------
   LOGIN
   Form: #loginForm
   Inputs: #loginEmail, #loginPassword
--------------------------*/
$("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (requiresTurnstile() && !hasTurnstileToken()) {
    showMsg("Lütfen 'Ben robot değilim' doğrulamasını yap.");
    return;
  }

  const email = ($("loginEmail")?.value || "").trim().toLowerCase();
  const password = ($("loginPassword")?.value || "");

  if (!email || !password) {
    showMsg("E-posta ve şifre gerekli.");
    return;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    // Doğrulama zorunlu: doğrulanmadıysa maili tekrar yolla ve çık
    if (!cred.user.emailVerified) {
      await sendEmailVerification(cred.user);
      await signOut(auth);
      showMsg("Mail adresin doğrulanmamış. Doğrulama mailini tekrar gönderdim (Spam/Tanıtımlar kontrol et).");
      window.location.href = "verify.html";
      return;
    }

    syncLocalUser(cred.user);
    showMsg("Giriş başarılı ✅", "ok");
    window.location.href = "profile.html";
  } catch (err) {
    console.error("LOGIN ERROR:", err.code, err.message);

    const map = {
      "auth/invalid-credential": "E-posta veya şifre hatalı. Şifreni unuttuysan sıfırlayabilirsin.",
      "auth/user-disabled": "Bu hesap devre dışı bırakılmış.",
      "auth/too-many-requests": "Çok fazla deneme yapıldı. Biraz sonra tekrar dene.",
      "auth/network-request-failed": "Bağlantı sorunu var. İnternetini kontrol et."
    };
    showMsg(map[err.code] || (err.message || err.code));
  }
});

/* -------------------------
   REGISTER
   Form: #registerForm
   Inputs: #regName, #regEmail, #regPassword
--------------------------*/
$("registerForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (requiresTurnstile() && !hasTurnstileToken()) {
    showMsg("Lütfen 'Ben robot değilim' doğrulamasını yap.");
    return;
  }

  const name = ($("regName")?.value || "").trim();
  const email = ($("regEmail")?.value || "").trim().toLowerCase();
  const password = ($("regPassword")?.value || "");

  if (!name || !email || !password) {
    showMsg("Ad Soyad, E-posta ve Şifre gerekli.");
    return;
  }
  if (password.length < 6) {
    showMsg("Şifre en az 6 karakter olmalı.");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // profil ismi
    await updateProfile(cred.user, { displayName: name });

    // doğrulama maili
    await sendEmailVerification(cred.user);

    // doğrulanana kadar çıkış
    await signOut(auth);

    showMsg("Doğrulama maili gönderildi. Mailini doğruladıktan sonra giriş yapabilirsin. (Spam/Tanıtımlar kontrol et).", "ok");
    window.location.href = "verify.html";
  } catch (err) {
    console.error("REGISTER ERROR:", err.code, err.message);

    const map = {
      "auth/email-already-in-use": "Bu e-posta zaten kayıtlı. Giriş yapmayı dene.",
      "auth/invalid-email": "E-posta formatı geçersiz.",
      "auth/weak-password": "Şifre zayıf. En az 6 karakter olmalı.",
      "auth/network-request-failed": "Bağlantı sorunu var. İnternetini kontrol et."
    };
    showMsg(map[err.code] || (err.message || err.code));
  }
});

/* -------------------------
   PASSWORD RESET (opsiyonel)
   Button: #resetBtn
--------------------------*/
$("resetBtn")?.addEventListener("click", async () => {
  const email = ($("loginEmail")?.value || "").trim().toLowerCase();
  if (!email) return showMsg("Şifre sıfırlamak için önce e-postanı yaz.");

  try {
    await sendPasswordResetEmail(auth, email);
    showMsg("Şifre sıfırlama e-postası gönderildi (Spam/Tanıtımlar kontrol et).", "ok");
  } catch (err) {
    console.error("RESET ERROR:", err.code, err.message);
    showMsg(err.message || err.code);
  }
});
