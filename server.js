// Backend Node.js avec authentification Midway pour API Amazon
const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const app = express();

app.use(express.json());
app.use(express.static('public')); // Pour servir les fichiers statiques

// Variables globales pour la gestion du token
let midwayToken = null;
let tokenExpiry = null;

// Reproduire VBAMidway pour l'authentification
async function getMidwayToken() {
    try {
        // 1. Vérifier si le cookie existe dans .midway/cookie
        const cookiePath = path.join(process.env.USERPROFILE, '.midway', 'cookie');
        
        if (fs.existsSync(cookiePath)) {
            const cookieContent = fs.readFileSync(cookiePath, 'utf8');
            const tokenMatch = cookieContent.match(/session_token=([^;]+)/);
            
            if (tokenMatch && tokenMatch[1]) {
                const token = tokenMatch[1];
                // Vérifier si le token n'est pas expiré (validité approximative 8h)
                const now = new Date();
                if (!tokenExpiry || now < tokenExpiry) {
                    midwayToken = token;
                    tokenExpiry = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8h
                    return token;
                }
            }
        }

        // 2. Si non, lancer mwinit.exe pour l'authentification
        return new Promise((resolve, reject) => {
            exec('mwinit.exe', (error, stdout, stderr) => {
                if (error) {
                    console.log('mwinit.exe non trouvé, utilisation du token par défaut');
                    resolve('DEFAULT_TOKEN');
                    return;
                }
                
                // 3. Récupérer le nouveau token après authentification
                setTimeout(() => {
                    if (fs.existsSync(cookiePath)) {
                        const cookieContent = fs.readFileSync(cookiePath, 'utf8');
                        const tokenMatch = cookieContent.match(/session_token=([^;]+)/);
                        
                        if (tokenMatch && tokenMatch[1]) {
                            midwayToken = tokenMatch[1];
                            tokenExpiry = new Date(Date.now() + 8 * 60 * 60 * 1000);
                            resolve(midwayToken);
                        } else {
                            reject(new Error('Token non trouvé après authentification'));
                        }
                    } else {
                        reject(new Error('Fichier cookie non créé après authentification'));
                    }
                }, 2000);
            });
        });
        
    } catch (error) {
        console.error('Erreur authentification Midway:', error);
        return 'DEFAULT_TOKEN';
    }
}

// Endpoint pour l'authentification Midway
app.get('/api/auth', async (req, res) => {
    try {
        const token = await getMidwayToken();
        res.json({ 
            success: true, 
            token: token ? 'Token obtenu' : 'Échec',
            expiry: tokenExpiry 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint pour les locations
app.post('/api/locations', async (req, res) => {
    try {
        console.log('🔄 Request locations reçue...');

        // Mode de test avec données simulées si pas d'authentification Midway
        const testMode = true; // Change à false quand Midway fonctionne

        if (testMode) {
            console.log('⚠️ Mode test activé - données simulées');
            // Données de test pour valider l'interface
            const mockLocations = [
                { vrid: '1134MQQS', location: 'Q-28', status: 'On Site', timestamp: new Date().toISOString() },
                { vrid: '113RCS06', location: 'Q-35', status: 'In Transit', timestamp: new Date().toISOString() },
                { vrid: 'TEST001', location: 'B-25', status: 'On Site', timestamp: new Date().toISOString() },
                { vrid: 'TEST002', location: 'Q-30', status: 'In Transit', timestamp: new Date().toISOString() }
            ];

            res.json({ 
                success: true, 
                locations: mockLocations,
                totalCount: mockLocations.length,
                retrievedAt: new Date().toISOString(),
                mode: 'test'
            });
            return;
        }

        // Mode production avec authentification Midway
        console.log('🔐 Récupération du token Midway...');
        const token = await getMidwayToken();
        
        if (!token || token === 'DEFAULT_TOKEN') {
            console.log('❌ Token Midway non disponible');
            return res.status(401).json({ 
                success: false, 
                error: 'Token Midway non disponible. Veuillez vous authentifier avec mwinit.exe' 
            });
        }

        console.log('✅ Token Midway obtenu, appel API Amazon...');

        // Faire la requête à l'API Amazon
        const response = await fetch('https://jwmjkz3dsd.execute-api.eu-west-1.amazonaws.com/call/getYardStateWithPendingMoves', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'YMSWebApp/1.0'
            },
            body: JSON.stringify({
                requester: { 
                    system: 'YMSWebApp',
                    timestamp: new Date().toISOString()
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API Amazon erreur: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📡 Données reçues de l\'API Amazon:', data);
        
        // Transformer les données pour correspondre au format attendu
        const locations = data.yardState ? data.yardState.map(item => ({
            vrid: item.loadId || item.vrid,
            location: item.location || item.yardLocation,
            status: item.status,
            timestamp: item.lastUpdate
        })) : [];

        res.json({ 
            success: true, 
            locations: locations,
            totalCount: locations.length,
            retrievedAt: new Date().toISOString(),
            mode: 'production'
        });

    } catch (error) {
        console.error('❌ Erreur API locations:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint pour vérifier le statut du serveur
app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        tokenAvailable: !!midwayToken,
        tokenExpiry: tokenExpiry,
        serverTime: new Date().toISOString()
    });
});

app.listen(3000, () => {
    console.log('🚀 Serveur démarré sur http://localhost:3000');
    console.log('📡 Endpoints disponibles:');
    console.log('   GET  /api/auth - Authentification Midway');
    console.log('   POST /api/locations - Récupération des emplacements');
    console.log('   GET  /api/status - Statut du serveur');
});
