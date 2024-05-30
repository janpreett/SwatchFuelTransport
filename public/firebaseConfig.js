import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBRotal2959mzh8ucIlSoJ3pyA6PhNLRkk",
    authDomain: "swatch-fuel-transport.firebaseapp.com",
    projectId: "swatch-fuel-transport",
    storageBucket: "swatch-fuel-transport.appspot.com",
    messagingSenderId: "1080145933811",
    appId: "1:1080145933811:web:2f8a730c6180926634ce86",
    measurementId: "G-EWCNTZ5450"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };