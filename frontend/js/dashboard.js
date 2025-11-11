// Fichier: frontend/js/dashboard.js

const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    loadUserProfile();
    loadUserPromos();
    loadExclusivePromos();
});

function checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
}

async function loadUserProfile() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Erreur lors du chargement du profil');
        }
        
        const user = await response.json();
        
        document.getElementById('userInfo').innerHTML = `
            <p><strong>📧 Email:</strong> ${user.email}</p>
            <p><strong>👤 Nom:</strong> ${user.name || 'Non renseigné'}</p>
            <p><strong>⭐ Statut:</strong> ${user.is_premium ? 'Premium' : 'Standard'}</p>
            <p><strong>📅 Membre depuis:</strong> ${new Date(user.created_at).toLocaleDateString('fr-FR')}</p>
        `;
        
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('userInfo').innerHTML = '<p>Erreur lors du chargement du profil</p>';
    }
}

async function loadUserPromos() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('userPromosContainer');
    
    try {
        const response = await fetch(`${API_URL}/users/my-promos`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Erreur lors du chargement');
        
        const promos = await response.json();
        
        if (promos.length === 0) {
            container.innerHTML = '<p class="info-text">Vous n\'avez pas encore ajouté de code promo. Cliquez sur "Ajouter un code" pour commencer !</p>';
            return;
        }
        
        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #f3f4f6; text-align: left;">
                        <th style="padding: 12px; border-bottom: 2px solid #e5e7eb;">Code</th>
                        <th style="padding: 12px; border-bottom: 2px solid #e5e7eb;">Influenceur</th>
                        <th style="padding: 12px; border-bottom: 2px solid #e5e7eb;">Marque</th>
                        <th style="padding: 12px; border-bottom: 2px solid #e5e7eb;">Réduction</th>
                        <th style="padding: 12px; border-bottom: 2px solid #e5e7eb;">Expire le</th>
                        <th style="padding: 12px; border-bottom: 2px solid #e5e7eb;">Statut</th>
                    </tr>
                </thead>
                <tbody>
                    ${promos.map(promo => `
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 12px;"><strong>${promo.code}</strong></td>
                            <td style="padding: 12px;">${promo.influencer_name || 'N/A'}</td>
                            <td style="padding: 12px;">${promo.brand_name || 'N/A'}</td>
                            <td style="padding: 12px;">${promo.discount_value}</td>
                            <td style="padding: 12px;">${new Date(promo.expiry_date).toLocaleDateString('fr-FR')}</td>
                            <td style="padding: 12px;">
                                ${promo.verified ? 
                                    '<span style="color: #10b981;">✓ Vérifié</span>' : 
                                    '<span style="color: #f59e0b;">⏳ En attente</span>'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
    } catch (error) {
        console.error('Erreur:', error);
        container.innerHTML = '<p class="info-text">Erreur lors du chargement de vos codes promos</p>';
    }
}

async function loadExclusivePromos() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('exclusivePromosContainer');
    
    try {
        const response = await fetch(`${API_URL}/promos/exclusives`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Erreur lors du chargement');
        
        const promos = await response.json();
        
        if (promos.length === 0) {
            container.innerHTML = '<p class="info-text">Aucune promo exclusive disponible pour le moment. Revenez bientôt ! 🎁</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="promos-grid">
                ${promos.map(promo => createPromoCard(promo)).join('')}
            </div>
        `;
        
        // Ajouter les événements de copie
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const code = e.target.dataset.code;
                copyToClipboard(code, e.target);
            });
        });
        
    } catch (error) {
        console.error('Erreur:', error);
        container.innerHTML = '<p class="info-text">Erreur lors du chargement des promos exclusives</p>';
    }
}

function createPromoCard(promo) {
    const expiryDate = new Date(promo.expiry_date).toLocaleDateString('fr-FR');
    
    return `
        <div class="promo-card exclusive">
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
