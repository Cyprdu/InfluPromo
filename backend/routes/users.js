// Fichier: backend/routes/users.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../database');

// Récupérer le profil utilisateur
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, email, name, is_premium, created_at FROM users WHERE id = ?',
            [req.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
    }
});

// Récupérer les codes promos ajoutés par l'utilisateur
router.get('/my-promos', authMiddleware, async (req, res) => {
    try {
        const [promos] = await db.query(`
            SELECT 
                p.*,
                i.name as influencer_name,
                b.name as brand_name
            FROM promo_codes p
            LEFT JOIN influencers i ON p.influencer_id = i.id
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC
        `, [req.userId]);

        res.json(promos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la récupération des promos' });
    }
});

module.exports = router;
