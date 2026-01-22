# 🚢 BVA1 Inbound Dock

**Suivi intelligent et optimisé des opérations d'inbound dock - Équipe en temps réel**

Système de gestion logistique moderne développé pour l'équipe Inbound Dock de BVA1. Application web avancée pour la gestion des opérations logistiques avec Vue.js et AG-Grid, incluant 5 modules spécialisés.

> 🔐 **Outil Personnel - Accès Restreint**  
> Pour demander l'accès, veuillez contacter : **kahlh**

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

## 🌐 Accès en Ligne

**Le site est accessible en ligne via GitHub Pages** 🎉

→ [Lancer BVA1 Inbound Dock](https://votreusername.github.io/FluxInboundDock/)

⚠️ Identifiez-vous avec le mot de passe fourni par l'équipe.

## 🔐 Authentification

À la première visite, vous serez invité à entrer le mot de passe d'accès. L'application propose une option "Se souvenir de moi" qui valide votre session pendant 24 heures.

## 🤝 Équipe Inbound Dock

**Outil développé pour :** Équipe Inbound Dock BVA1  
**Point de contact :** kahlh  
**Type :** Outil interne - Accès restreint

## 🤝 Contribution

Pour toute modification ou amélioration :

1. Contactez **kahlh**
2. Décrivez votre demande/amélioration
3. Proposez les changements
4. Testez en local avant de pusher

## 📄 Licence

Ce projet est propriétaire et réservé à l'équipe BVA1 Inbound Dock.


---

Développé avec ❤️ pour la gestion efficace des données.