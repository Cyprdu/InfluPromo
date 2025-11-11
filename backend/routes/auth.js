// Fichier: backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const db = require('../database');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Fonction pour générer un token JWT
const generateToken = (userId, email) => {
    return jwt.sign(
        { userId, email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

// Inscription
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, name } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const [existing] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insérer l'utilisateur
        const [result] = await db.query(
            'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
            [email, hashedPassword, name]
        );

        const token = generateToken(result.insertId, email);

        res.status(201).json({
            message: 'Compte créé avec succès!',
            token,
            user: {
                id: result.insertId,
                email,
                name
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }
});

// Connexion
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Trouver l'utilisateur
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        const user = users[0];

        // Vérifier le mot de passe
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        const token = generateToken(user.id, user.email);

        res.json({
            message: 'Connexion réussie!',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                is_premium: user.is_premium
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la connexion' });
    }
});

// Connexion Google
router.post('/google', async (req, res) => {
    try {
        const { token } = req.body;

        // Vérifier le token Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const googleId = payload['sub'];
        const email = payload['email'];
        const name = payload['name'];

        // Vérifier si l'utilisateur existe
        const [existing] = await db.query(
            'SELECT * FROM users WHERE google_id = ? OR email = ?',
            [googleId, email]
        );

        let userId;

        if (existing.length > 0) {
            // Utilisateur existant
            userId = existing[0].id;
            
            // Mettre à jour google_id si nécessaire
            if (!existing[0].google_id) {
                await db.query(
                    'UPDATE users SET google_id = ? WHERE id = ?',
                    [googleId, userId]
                );
            }
        } else {
            // Nouvel utilisateur
            const [result] = await db.query(
                'INSERT INTO users (email, name, google_id) VALUES (?, ?, ?)',
                [email, name, googleId]
            );
            userId = result.insertId;
        }

        const jwtToken = generateToken(userId, email);

        res.json({
            message: 'Connexion Google réussie!',
            token: jwtToken,
            user: {
                id: userId,
                email,
                name,
                is_premium: existing.length > 0 ? existing[0].is_premium : false
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la connexion Google' });
    }
});

module.exports = router;
