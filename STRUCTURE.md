# Structure du projet - Composants React

Cette documentation décrit la nouvelle structure ajoutée pour le support React/Next.js.

## 📁 Arborescence

```
itineraire-technique/
├── react/                          # 🆕 Composants React/Next.js
│   ├── index.ts                    # Point d'entrée principal
│   ├── types.ts                    # Types TypeScript complets
│   ├── hooks.ts                    # Hooks React personnalisés
│   ├── TikaRenderer.jsx           # Composant de visualisation
│   ├── TikaEditor.jsx             # Composant d'édition
│   ├── README.md                   # Documentation complète
│   └── QUICKSTART.md              # Guide de démarrage rapide
│
├── examples/                       # 🆕 Exemples d'intégration
│   ├── nextjs-app-router-viewer.tsx
│   ├── nextjs-app-router-editor.tsx
│   ├── nextjs-_document.tsx
│   ├── nextjs-api-route.ts
│   └── README.md
│
├── scripts/                        # 🆕 Scripts utilitaires
│   ├── setup-react.sh             # Setup pour Linux/Mac
│   └── setup-react.ps1            # Setup pour Windows
│
├── js/                             # Scripts JavaScript existants
│   ├── chart-render.js            # Moteur de rendu principal
│   ├── editor-attributes.js
│   ├── editor-crops.js
│   ├── editor-export.js
│   ├── editor-interventions.js
│   └── editor-wiki-editor.js
│
├── css/                            # Styles CSS
│   ├── styles-rendering.css
│   └── styles-editor.css
│
├── test/                           # Fichiers de test JSON
│   ├── test.json
│   ├── test.after.json
│   └── itk-templates/
│
├── package.json                    # 🔄 Mis à jour avec exports React
├── tsconfig.json                   # 🆕 Configuration TypeScript
├── CHANGELOG.md                    # 🆕 Historique des versions
└── README.md                       # 🔄 Mis à jour avec section React
```

## 🎯 Points d'entrée

### Pour JavaScript/HTML classique

```html
<script src="/js/chart-render.js"></script>
<link href="/css/styles-rendering.css" rel="stylesheet">
```

### Pour React/Next.js

```tsx
// Composants
import { TikaRenderer, TikaEditor } from '@osfarm/itineraire-technique/react';

// Hooks
import { useItineraire, useItineraireDependencies } from '@osfarm/itineraire-technique/react';

// Types TypeScript
import type { ItineraireData, Step, Intervention } from '@osfarm/itineraire-technique/react';
```

## 📦 Exports NPM

Le `package.json` expose maintenant plusieurs exports :

```json
{
  "exports": {
    ".": "./js/chart-render.js",                    // Export par défaut
    "./react": "./react/index.ts",                   // Composants React
    "./react/TikaRenderer": "./react/TikaRenderer.jsx",
    "./react/TikaEditor": "./react/TikaEditor.jsx",
    "./css/*": "./css/*",                            // Styles
    "./js/*": "./js/*"                               // Scripts
  }
}
```

## 🔧 Dépendances

### Runtime (CDN)

Les composants React s'appuient sur :
- **ECharts** 6.0.0+ - Graphiques
- **jQuery** 3.7.1+ - DOM et événements
- **jQuery UI** 1.14.1+ - Interactions (pour éditeur)
- **Underscore.js** 1.13.7+ - Utilitaires
- **Bootstrap** 5.3.8+ - Interface (pour éditeur)
- **Font Awesome** 4.7.0+ - Icônes

### Peer Dependencies (npm)

```json
{
  "peerDependencies": {
    "react": ">=16.8.0",
    "react-dom": ">=16.8.0"
  }
}
```

## 🚀 Workflow de développement

### 1. Développement CSS

```bash
npm run dev:scss        # Compile SCSS une fois
npm run watch:scss      # Mode watch pour développement
npm run build:scss      # Build production (minifié)
```

### 2. Test local

```bash
# Ouvrir les fichiers HTML dans le navigateur
open visualisateur.html
open editor.html
```

### 3. Test avec React

```bash
# Dans un projet React/Next.js
npm install ../path/to/itineraire-technique
npm run setup:react
```

### 4. Publication

```bash
npm version patch|minor|major
npm run build
npm publish
```

## 🧩 Architecture des composants

### TikaRenderer

Wrapper React autour de `RotationRenderer` (JS vanilla).

**Responsabilités :**
- Créer un conteneur DOM unique
- Initialiser `RotationRenderer`
- Gérer le cycle de vie React
- Exposer des événements React-friendly
- Nettoyer les ressources

### TikaEditor

Wrapper React pour l'interface d'édition.

**Responsabilités :**
- Gérer l'état global `window.rotation_data`
- Appeler les fonctions d'édition vanilla JS
- Fournir une interface React
- Gérer la sauvegarde/export
- Auto-save optionnel

### useItineraire Hook

Gestion d'état React pour les données d'itinéraire.

**Fonctionnalités :**
- CRUD complet sur les steps
- CRUD complet sur les interventions
- Export/import JSON
- Validation des données
- Callbacks de mise à jour

### useItineraireDependencies Hook

Vérification du chargement des dépendances.

**Utilité :**
- Éviter les erreurs de chargement
- Afficher un loader pendant le chargement
- Gérer les erreurs gracieusement

## 🎨 Personnalisation

### Styles

Les styles peuvent être personnalisés via :

1. **Surcharge CSS** - Classes CSS personnalisées
2. **Variables CSS** - Modifier les variables dans SCSS
3. **Prop className** - Ajouter des classes aux composants

### Thème ECharts

Personnalisez le rendu des graphiques via les options ECharts dans `chart-render.js`.

### Bootstrap

L'éditeur utilise Bootstrap 5. Vous pouvez :
- Utiliser un thème Bootstrap personnalisé
- Surcharger les variables Bootstrap
- Désactiver Bootstrap et utiliser vos styles

## 🧪 Tests

Actuellement, le projet n'a pas de tests automatisés. Les tests sont manuels via :

1. Fichiers HTML de démo
2. Fichiers JSON de test dans `test/`
3. Validation manuelle dans le navigateur

**Améliorations futures possibles :**
- Tests unitaires avec Jest
- Tests de composants React avec Testing Library
- Tests E2E avec Playwright/Cypress
- Tests de régression visuelle

## 📝 Contribution

Pour contribuer :

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Poussez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

MIT - Voir [LICENSE](../LICENSE)
