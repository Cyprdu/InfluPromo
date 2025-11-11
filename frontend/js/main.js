// Fichier: frontend/js/main.js

const API_URL = 'http://localhost:3000/api';

// Vérifier l'authentification au chargement
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadPromos();
    loadFilters();
    setupEventListeners();
});

// Vérifier si l'utilisateur est connecté
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    const addPromoBtn = document.getElementById('addPromoBtn');
    const exclusivesLink = document.getElementById('exclusivesLink');
    
    if (token && user.email) {
        loginBtn.style.display = 'none';
        userMenu.style.display = 'flex';
        addPromoBtn.style.display = 'block';
        exclusivesLink.style.display = 'block';
        userName.textContent = user.name || user.email;
    } else {
        loginBtn.style.display = 'block';
        userMenu.style.display = 'none';
        addPromoBtn.style.display = 'none';
        exclusivesLink.style.display = 'none';
    }
}

// Charger les codes promos
async function loadPromos(filters = {}) {
    const container = document.getElementById('promosContainer');
    container.innerHTML = '<div class="loading">Chargement des codes promos...</div>';
    
    try {
        const params = new URLSearchParams(filters);
        const response = await fetch(`${API_URL}/promos?${params}`);
        
        if (!response.ok) throw new Error('Erreur lors du chargement');
        
        const promos = await response.json();
        
        if (promos.length === 0) {
            container.innerHTML = '<p class="loading">Aucun code promo trouvé 😢</p>';
            return;
        }
        
        container.innerHTML = promos.map(promo => createPromoCard(promo)).join('');
        
        // Ajouter les événements de copie
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const code = e.target.dataset.code;
                copyToClipboard(code, e.target);
            });
        });
    } catch (error) {
        console.error('Erreur:', error);
        container.innerHTML = '<p class="loading">Erreur lors du chargement des codes promos</p>';
    }
}

// Créer une carte de code promo
function createPromoCard(promo) {
    const expiryDate = new Date(promo.expiry_date).toLocaleDateString('fr-FR');
    const exclusiveClass = promo.is_exclusive ? 'exclusive' : '';
    
    return `
        <div class="promo-card ${exclusiveClass}">
            <div class="promo-header">
                <div class="promo-influencer">👤 ${promo.influencer_name || 'Influenceur'}</div>
                <div class="promo-brand">🏷️ ${promo.brand_name || 'Marque'}</div>
            </div>
            <div class="promo-code">
                <div class="code-value">${promo.code}</div>
                <div class="discount-value">${promo.discount_value}</div>
            </div>
            <div class="promo-description">
                ${promo.description}
            </div>
            <div class="promo-footer">
                <div class="promo-expiry">📅 Expire le ${expiryDate}</div>
                <button class="copy-btn" data-code="${promo.code}">Copier</button>
            </div>
        </div>
    `;
}

// Copier dans le presse-papier
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = '✓ Copié !';
        button.style.backgroundColor = '#10b981';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = '';
        }, 2000);
    }).catch(err => {
        console.error('Erreur de copie:', err);
        alert('Impossible de copier le code');
    });
}

// Charger les filtres
async function loadFilters() {
    try {
        const response = await fetch(`${API_URL}/promos/filters`);
        const filters = await response.json();
        
        const influencerFilter = document.getElementById('influencerFilter');
        const brandFilter = document.getElementById('brandFilter');
        
        filters.influencers.forEach(inf => {
            const option = document.createElement('option');
            option.value = inf;
            option.textContent = inf;
            influencerFilter.appendChild(option);
        });
        
        filters.brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            brandFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Erreur chargement filtres:', error);
    }
}

// Configuration des événements
function setupEventListeners() {
    // Bouton de connexion
    document.getElementById('loginBtn')?.addEventListener('click', () => {
        window.location.href = 'login.html';
    });
    
    // Bouton de déconnexion
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });
    
    // Bouton ajouter promo
    document.getElementById('addPromoBtn')?.addEventListener('click', () => {
        document.getElementById('addPromoModal').style.display = 'block';
    });
    
    // Fermer modal
    document.querySelector('.close')?.addEventListener('click', () => {
        document.getElementById('addPromoModal').style.display = 'none';
    });
    
    // Formulaire ajout promo
    document.getElementById('addPromoForm')?.addEventListener('submit', handleAddPromo);
    
    // Recherche
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // Filtres
    document.getElementById('influencerFilter')?.addEventListener('change', handleSearch);
    document.getElementById('brandFilter')?.addEventListener('change', handleSearch);
    document.getElementById('resetFilters')?.addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('influencerFilter').value = '';
        document.getElementById('brandFilter').value = '';
        loadPromos();
    });
    
    // Lien exclusivités
    document.getElementById('exclusivesLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'dashboard.html';
    });
}

// Gérer la recherche
function handleSearch() {
    const search = document.getElementById('searchInput').value;
    const influencer = document.getElementById('influencerFilter').value;
    const brand = document.getElementById('brandFilter').value;
    
    const filters = {};
    if (search) filters.search = search;
    if (influencer) filters.influencer = influencer;
    if (brand) filters.brand = brand;
    
    loadPromos(filters);
}

// Gérer l'ajout de promo
async function handleAddPromo(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vous devez être connecté pour ajouter un code promo');
        return;
    }
    
    const promoData = {
        code: document.getElementById('promoCode').value,
        description: document.getElementById('promoDescription').value,
        discount_value: document.getElementById('promoDiscount').value,
        influencer_name: document.getElementById('promoInfluencer').value,
        brand_name: document.getElementById('promoBrand').value,
        expiry_date: document.getElementById('promoExpiry').value
    };
    
    try {
        const response = await fetch(`${API_URL}/promos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(promoData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de l\'ajout');
        }
        
        alert('Code promo ajouté avec succès ! Il sera visible après vérification.');
        document.getElementById('addPromoModal').style.display = 'none';
        document.getElementById('addPromoForm').reset();
        
    } catch (error) {
        console.error('Erreur:', error);
        alert(error.message);
    }
}
