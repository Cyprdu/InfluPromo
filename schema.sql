-- Fichier: schema.sql

-- Table des utilisateurs
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255), -- NULL si connexion Google
    name VARCHAR(100),
    google_id VARCHAR(255) UNIQUE,
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des influenceurs
CREATE TABLE influencers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des marques
CREATE TABLE brands (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    logo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des codes promos
CREATE TABLE promo_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    discount_value VARCHAR(50),
    influencer_id INT,
    brand_id INT,
    user_id INT, -- Utilisateur qui a ajouté le code
    expiry_date DATE NOT NULL,
    is_exclusive BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (influencer_id) REFERENCES influencers(id),
    FOREIGN KEY (brand_id) REFERENCES brands(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table des favoris (optionnel)
CREATE TABLE favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    promo_code_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id),
    UNIQUE KEY unique_favorite (user_id, promo_code_id)
);

-- Index pour optimiser les recherches
CREATE INDEX idx_expiry_date ON promo_codes(expiry_date);
CREATE INDEX idx_influencer ON promo_codes(influencer_id);
CREATE INDEX idx_brand ON promo_codes(brand_id);
