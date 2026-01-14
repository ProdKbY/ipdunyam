// js/auth.js (GitHub Pages uyumlu)
import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// input helper
const $ = (id) => document.getElementById(id);

function showMsg(text, type = "error") {
  const box = $("msg");
  if (!box) return;
  box.textContent = text;
  box.style.display = "block";
  box.style.padding = "10px";
  box.style.borderRadius = "10px";
  box.style.margin = "10px 0";
  box.style.fontSize = "14px";
  box.style.background = type === "ok" ? "#e8fff0" : "#ffecec";
  box.style.color = type === "ok" ? "#0f6d2a" : "#9b1c1c";
}

$("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = $("loginEmail")?.value.trim() || "";
  const password = $("loginPassword")?.value || "";

  if (!email || !password) {
    showMsg("E-posta ve şifre gerekli.");
    return;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    // Doğrulama zorunlu olsun istiyorsan:
    if (!cred.user.emailVerified) {
      await sendEmailVerification(cred.user);
      showMsg("E-postan doğrulanmamış. Doğrulama mailini tekrar gönderdim (Spam/Tanıtımlar kontrol et).");
      return;
    }

    showMsg("Giriş başarılı ✅", "ok");
    window.location.href = "index.html";
  } catch (err) {
    console.error("AUTH ERROR:", err.code, err.message);

    const map = {
      "auth/invalid-credential": "E-posta veya şifre hatalı.",
      "auth/user-disabled": "Bu hesap devre dışı bırakılmış.",
      "auth/too-many-requests": "Çok fazla deneme yapıldı. Biraz sonra tekrar dene.",
      "auth/network-request-failed": "Bağlantı sorunu var. İnternetini kontrol et."
    };

    showMsg(map[err.code] || `${err.code}`);
  }
});

// Opsiyonel: Şifremi unuttum butonu eklemek istersen
// HTML'ye: <button type="button" id="resetBtn">Şifremi Unuttum</button>
$("resetBtn")?.addEventListener("click", async () => {
  const email = $("loginEmail")?.value.trim() || "";
  if (!email) return showMsg("Şifre sıfırlamak için önce e-postanı yaz.");

  try {
    await sendPasswordResetEmail(auth, email);
    showMsg("Şifre sıfırlama e-postası gönderildi (Spam/Tanıtımlar kontrol et).", "ok");
  } catch (err) {
    console.error("RESET ERROR:", err.code, err.message);
    showMsg(err.code);
  }
});
