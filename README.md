# 🚢 Flux Inbound Dock

**Système de gestion logistique moderne avec interface web complète**

Une application web avancée pour la gestion des opérations logistiques avec Vue.js et AG-Grid, incluant 5 modules spécialisés.

## 🏗️ Architecture du Système

### 📋 Modules Principaux

1. **🚛 Flux_Dock_Inbound** - Gestion principale des VRID
2. **📊 Dashboard** - Tableau de bord opérationnel
3. **📥 AFT** - Import Advanced Freight Transport
4. **📄 FMC** - Import Freight Management Center
5. **🌐 Skynet** - Données en temps réel

## ✨ Fonctionnalités Complètes

### 🚛 Flux Dock Inbound
- ✅ Grille logistique complète avec toutes les colonnes métier
- 🔄 Statuts : IN PROGRESS, VRAC, PALETTIZED, DONE
- 📊 Colonnes : VRID, PALLETS, BT, UNITS, SBD, YMS Arrival Time, LOCATION, REMORQUES, etc.
- 🎨 Rendu coloré des statuts avec icônes
- 📱 Interface responsive avec détails de sélection

### 📊 Dashboard
- 📈 Résumé opérationnel en temps réel
- 🚨 Section VRID Prioritaires avec code couleur
- 🔢 Compteurs : PALLETS, BT, UNITS, Nb VRID
- 📊 Graphique de performance par tranche horaire
- ⚡ Actions rapides pour tous les imports

### 📥 AFT Import
- 🎯 Import de fichiers CSV AFT avec validation
- � Correspondance automatique des colonnes
- 📋 Aperçu des données avant import
- 📜 Historique complet des imports
- ⚠️ Gestion des erreurs et warnings

### � FMC Import  
- 📋 Templates prédéfinis (Standard, Étendu, Personnalisé)
- ✅ Validation avancée des données
- 📊 Statistiques FMC en temps réel
- ⚙️ Configuration avancée des imports
- 📈 Taux de réussite et métriques

### 🌐 Skynet Data
- 🟢 Connexion temps réel simulée
- ⚡ Métriques live : VRID actifs, débit/h, temps moyen
- 🚨 Système d'alertes avec priorités
- 📈 Graphique de performance en temps réel
- 🔍 Filtres dynamiques et contrôles avancés

## 🚀 Installation rapide

### 1. Ouvrir le projet dans VS Code
```powershell
cd "C:\Users\kahlh\Desktop\FluxInboundDock"
code .
```

### 2. Installer les dépendances
```powershell
npm install
```

### 3. Démarrer le serveur de développement
```powershell
npm run dev
```

L'application sera accessible sur http://localhost:3000

## 📦 Scripts disponibles

- `npm run dev` - Démarre le serveur de développement
- `npm run build` - Compile l'application pour la production
- `npm run preview` - Prévisualise la version de production
- `npm run serve` - Sert la version de production sur le port 3000

## 🏗️ Structure du projet

```
FluxInboundDock/
├── public/                 # Fichiers statiques
├── src/                   # Code source
│   ├── assets/           # CSS et ressources
│   │   └── style.css     # Styles globaux
│   ├── components/       # Composants Vue
│   │   └── DataGrid.vue  # Composant AG-Grid
│   ├── App.vue          # Composant principal
│   └── main.js          # Point d'entrée
├── index.html           # Template HTML principal
├── package.json         # Configuration npm
├── vite.config.js       # Configuration Vite
└── README.md           # Documentation
```

## 🛠️ Technologies utilisées

- **Vue.js 3** - Framework JavaScript réactif
- **AG-Grid** - Tableaux de données avancés
- **Vite** - Outil de build rapide
- **CSS3** - Styles modernes avec variables CSS

## 💡 Fonctionnalités du tableau

- **Édition en ligne** - Double-cliquez sur une cellule pour modifier
- **Tri et filtrage** - Cliquez sur les en-têtes de colonnes
- **Sélection de lignes** - Cliquez sur une ligne pour la sélectionner
- **Export CSV** - Bouton d'export dans la barre d'outils
- **Pagination automatique** - 10 éléments par page
- **Colonnes redimensionnables** - Glissez les bordures des colonnes
- **Panneau latéral** - Gestion des colonnes et filtres

## 🎨 Personnalisation

### Modifier les données d'exemple
Éditez le fichier `src/App.vue` dans la section `data()` :

```javascript
rowData: [
  {
    id: 1,
    product: 'Votre produit',
    category: 'Votre catégorie',
    price: 99.99,
    // ... autres propriétés
  }
]
```

### Ajouter des colonnes
Modifiez `columnDefs` dans `src/App.vue` :

```javascript
columnDefs: [
  { 
    field: 'nouveauChamp', 
    headerName: 'Nouveau Champ', 
    width: 150,
    editable: true 
  }
]
```

### Personnaliser les styles
Éditez `src/assets/style.css` pour modifier l'apparence.

## 🔧 Dépannage

### Problème : Les modules ne sont pas trouvés
```powershell
# Supprimer node_modules et réinstaller
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Problème : Port déjà utilisé
```powershell
# Utiliser un port différent
npm run dev -- --port 3001
```

### Problème : AG-Grid ne s'affiche pas
Vérifiez que les styles CSS sont bien importés dans `DataGrid.vue` :
```javascript
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
```

## 📚 Ressources utiles

- [Documentation Vue.js](https://vuejs.org/)
- [Documentation AG-Grid](https://www.ag-grid.com/vue-data-grid/)
- [Documentation Vite](https://vitejs.dev/)

## 🤝 Contribution

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour les détails.

---

Développé avec ❤️ pour la gestion efficace des données.