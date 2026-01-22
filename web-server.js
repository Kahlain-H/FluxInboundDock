const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Servir les fichiers statiques depuis le dossier courant
app.use(express.static(__dirname));

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'flux-sections-excel-style.html'));
});

// Route pour l'application principale
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'flux-sections-excel-style.html'));
});

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FluxInboundDock Server démarré sur http://localhost:${PORT}`);
    console.log(`📡 Accessible depuis d'autres PC à http://[VOTRE_IP]:${PORT}`);
    console.log(`💡 Pour connaître votre IP: ipconfig (Windows) ou ifconfig (Mac/Linux)`);
});

// Gestion gracieuse de l'arrêt
process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur...');
    process.exit(0);
});