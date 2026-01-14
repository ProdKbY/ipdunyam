// js/firebase.js (GitHub Pages uyumlu - SADECE init + export)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDN5LuEvNbPvfHxtOY713oP7x2V5wTB42I",
  authDomain: "ipdunyam.firebaseapp.com",
  projectId: "ipdunyam",
  storageBucket: "ipdunyam.firebasestorage.app",
  messagingSenderId: "824527303340",
  appId: "1:824527303340:web:4d09f91d202eb69cbee509"
};

const app = initializeApp(firebaseConfig);

// diğer dosyalar (auth.js vb.) bunu import edecek
export const auth = getAuth(app);
