// Fichier: frontend/js/auth.js

const API_URL = 'http://localhost:3000/api';

// ⭐ Remplace cette valeur par TON vrai Client ID Google
const GOOGLE_CLIENT_ID = '583447642445-81qvl3jdare0ng201bg5tn5p7t9jvnqe.apps.googleusercontent.com';

let isRegisterMode = false;

document.addEventListener('DOMContentLoaded', () => {
    // Charger l'API Google Sign-In
    loadGoogleSignIn();
    setupAuthListeners();
});

function loadGoogleSignIn() {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn
        });

        google.accounts.id.renderButton(
            document.getElementById('googleSignInBtn'),
            { 
                theme: 'outline', 
                size: 'large',
                text: 'signin_with',
                width: 350
            }
        );
    };
}

function setupAuthListeners() {
    // Switch entre login et register
    document.getElementById('switchBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthMode();
    });

    // Formulaire de connexion
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);

    // Formulaire d'inscription
    document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
}

function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTitle = document.getElementById('authTitle');
    const switchText = document.getElementById('switchText');

    if (isRegisterMode) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        authTitle.textContent = 'Inscription';
        switchText.innerHTML = 'Déjà un compte ? <a href="#" id="switchBtn">Se connecter</a>';
    } else {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        authTitle.textContent = 'Connexion';
        switchText.innerHTML = 'Pas encore de compte ? <a href="#" id="switchBtn">S\'inscrire</a>';
    }

    // Réattacher l'événement au nouveau bouton
    document.getElementById('switchBtn').addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthMode();
    });
}

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erreur de connexion');
        }

        // Sauvegarder le token et les infos utilisateur
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirection vers le dashboard
        window.location.href = '/dashboard.html';

    } catch (error) {
        alert(error.message);
        console.error('Erreur de connexion:', error);
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (password !== confirmPassword) {
        alert('Les mots de passe ne correspondent pas !');
        return;
    }

    if (password.length < 6) {
        alert('Le mot de passe doit contenir au moins 6 caractères');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de l\'inscription');
        }

        // Sauvegarder le token et les infos utilisateur
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirection vers le dashboard
        window.location.href = '/dashboard.html';

    } catch (error) {
        alert(error.message);
        console.error('Erreur d\'inscription:', error);
    }
}

async function handleGoogleSignIn(response) {
    try {
        const res = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: response.credential })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Erreur de connexion Google');
        }

        // Sauvegarder le token et les infos utilisateur
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirection vers le dashboard
        window.location.href = '/dashboard.html';

    } catch (error) {
        alert(error.message);
        console.error('Erreur Google Sign-In:', error);
    }
}

// Fonction pour vérifier si l'utilisateur est connecté
function isAuthenticated() {
    return localStorage.getItem('token') !== null;
}

// Fonction pour déconnecter l'utilisateur
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Fonction pour obtenir le token
function getToken() {
    return localStorage.getItem('token');
}

// Fonction pour obtenir l'utilisateur
function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Exporter les fonctions pour les autres fichiers
window.auth = {
    isAuthenticated,
    logout,
    getToken,
    getUser
};
