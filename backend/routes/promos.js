// Fichier: backend/routes/promos.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

// Récupérer tous les codes promos valides
router.get('/', async (req, res) => {
    try {
        const { influencer, brand, search } = req.query;
        
        let query = `
            SELECT 
                p.*,
                i.name as influencer_name,
                i.image_url as influencer_image,
                b.name as brand_name,
                b.logo_url as brand_logo
            FROM promo_codes p
            LEFT JOIN influencers i ON p.influencer_id = i.id
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE p.expiry_date >= CURDATE()
            AND p.verified = TRUE
        `;
        
        const params = [];

        if (influencer) {
            query += ' AND i.name = ?';
            params.push(influencer);
        }

        if (brand) {
            query += ' AND b.name = ?';
            params.push(brand);
        }

        if (search) {
            query += ' AND (p.code LIKE ? OR p.description LIKE ? OR i.name LIKE ? OR b.name LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY p.created_at DESC';

        const [promos] = await db.query(query, params);
        
        res.json(promos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la récupération des promos' });
    }
});

// Récupérer les promos exclusives (nécessite authentification)
router.get('/exclusives', authMiddleware, async (req, res) => {
    try {
        const [promos] = await db.query(`
            SELECT 
                p.*,
                i.name as influencer_name,
                i.image_url as influencer_image,
                b.name as brand_name,
                b.logo_url as brand_logo
            FROM promo_codes p
            LEFT JOIN influencers i ON p.influencer_id = i.id
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE p.expiry_date >= CURDATE()
            AND p.is_exclusive = TRUE
            AND p.verified = TRUE
            ORDER BY p.created_at DESC
        `);
        
        res.json(promos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la récupération des promos exclusives' });
    }
});

// Ajouter un code promo (nécessite authentification)
router.post('/', authMiddleware, [
    body('code').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('discount_value').trim().notEmpty(),
    body('expiry_date').isDate(),
    body('influencer_name').trim().notEmpty(),
    body('brand_name').trim().notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { code, description, discount_value, expiry_date, influencer_name, brand_name } = req.body;
        const userId = req.userId;

        // Créer ou récupérer l'influenceur
        let [influencers] = await db.query(
            'SELECT id FROM influencers WHERE name = ?',
            [influencer_name]
        );

        let influencerId;
        if (influencers.length === 0) {
            const [result] = await db.query(
                'INSERT INTO influencers (name) VALUES (?)',
                [influencer_name]
            );
            influencerId = result.insertId;
        } else {
            influencerId = influencers[0].id;
        }

        // Créer ou récupérer la marque
        let [brands] = await db.query(
            'SELECT id FROM brands WHERE name = ?',
            [brand_name]
        );

        let brandId;
        if (brands.length === 0) {
            const [result] = await db.query(
                'INSERT INTO brands (name) VALUES (?)',
                [brand_name]
            );
            brandId = result.insertId;
        } else {
            brandId = brands[0].id;
        }

        // Insérer le code promo
        const [result] = await db.query(
            `INSERT INTO promo_codes 
            (code, description, discount_value, influencer_id, brand_id, user_id, expiry_date, verified) 
            VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)`,
            [code, description, discount_value, influencerId, brandId, userId, expiry_date]
        );

        res.status(201).json({
            message: 'Code promo ajouté avec succès! Il sera visible après vérification.',
            promoId: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de l\'ajout du code promo' });
    }
});

// Récupérer les filtres disponibles
router.get('/filters', async (req, res) => {
    try {
        const [influencers] = await db.query(`
            SELECT DISTINCT i.name 
            FROM influencers i
            INNER JOIN promo_codes p ON i.id = p.influencer_id
            WHERE p.expiry_date >= CURDATE()
            ORDER BY i.name
        `);

        const [brands] = await db.query(`
            SELECT DISTINCT b.name 
            FROM brands b
            INNER JOIN promo_codes p ON b.id = p.brand_id
            WHERE p.expiry_date >= CURDATE()
            ORDER BY b.name
        `);

        res.json({
            influencers: influencers.map(i => i.name),
            brands: brands.map(b => b.name)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la récupération des filtres' });
    }
});

module.exports = router;
