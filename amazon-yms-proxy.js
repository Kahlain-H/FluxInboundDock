const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Route proxy pour Amazon YMS API
app.post('/api/yms/locations', async (req, res) => {
    try {
        console.log('🌐 Proxy: Requête reçue du frontend');
        console.log('📦 Payload:', req.body);
        
        const { vrids, token, facility } = req.body;
        
        if (!vrids || !Array.isArray(vrids)) {
            return res.status(400).json({ error: 'VRID array required' });
        }
        
        if (!token) {
            return res.status(400).json({ error: 'Authorization token required' });
        }
        
        console.log(`🎯 Recherche d'emplacements pour ${vrids.length} VRID`);
        
        // Appel à l'API Amazon YMS
        const apiUrl = 'https://na.api.amazonlogistics.com/yms/location-lookup';
        const requestBody = {
            vrids: vrids,
            includeLocationDetails: true,
            facility: facility || 'YOW1'
        };
        
        console.log('📡 Appel API Amazon YMS:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Version': '2.0',
                'X-Facility-Code': facility || 'YOW1',
                'X-Request-ID': `proxy-${Date.now()}`
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('📊 Statut API:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erreur API:', errorText);
            return res.status(response.status).json({
                error: `Amazon YMS API Error: ${response.status} ${response.statusText}`,
                details: errorText
            });
        }
        
        const apiData = await response.json();
        console.log('✅ Réponse API reçue:', apiData);
        
        // Extraire les emplacements
        let locations = [];
        if (apiData.locations && Array.isArray(apiData.locations)) {
            locations = apiData.locations;
        } else if (apiData.results && Array.isArray(apiData.results)) {
            locations = apiData.results;
        } else if (apiData.data && Array.isArray(apiData.data)) {
            locations = apiData.data;
        }
        
        console.log(`📍 ${locations.length} emplacements trouvés`);
        
        // Retourner les données au frontend
        res.json({
            success: true,
            locations: locations,
            totalCount: locations.length,
            requestedVrids: vrids.length,
            retrievedAt: new Date().toISOString(),
            rawResponse: apiData
        });
        
    } catch (error) {
        console.error('❌ Erreur proxy:', error);
        res.status(500).json({
            error: 'Proxy server error',
            message: error.message,
            details: error.stack
        });
    }
});

// Route de test
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Amazon YMS Proxy Server is running'
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Amazon YMS Proxy Server started on http://localhost:${PORT}`);
    console.log(`📡 Ready to proxy requests to Amazon YMS API`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});