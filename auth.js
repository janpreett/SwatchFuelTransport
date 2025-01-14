import { auth } from './firebaseConfig.js';
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

const loginForm = document.getElementById('login-form');
const authSection = document.getElementById('auth-section');
const expensesSection = document.getElementById('expenses-section');
const logoutButton = document.getElementById('logout-button');
const errorMessage = document.getElementById('error-message');
const header = document.querySelector('header');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        authSection.classList.add('hidden');
        expensesSection.classList.remove('hidden');
        header.classList.remove('hidden');
        errorMessage.classList.add('hidden');
    } catch (error) {
        errorMessage.textContent = "Invalid email or password. Please try again.";
        errorMessage.style.color = 'red';
        errorMessage.classList.remove('hidden');
        console.error("Error signing in: ", error);
    }
});

logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        authSection.classList.remove('hidden');
        expensesSection.classList.add('hidden');
        header.classList.add('hidden');
        loginForm.reset();
        errorMessage.textContent = '';
    } catch (error) {
        console.error("Error signing out: ", error);
    }
});
