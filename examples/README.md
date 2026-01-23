# Exemples d'utilisation

Ce dossier contient des exemples d'intégration du visualisateur d'itinéraires techniques TIKA dans différents contextes.

## Fichiers disponibles

### Next.js

- **`nextjs-app-router-viewer.tsx`** - Exemple de page de visualisation avec Next.js App Router (13+)
  - Affichage d'un itinéraire technique
  - Gestion du chargement des données
  - Événements de clic et survol

- **`nextjs-app-router-editor.tsx`** - Exemple d'éditeur complet avec Next.js App Router
  - Interface complète d'édition
  - Ajout/modification/suppression d'étapes
  - Gestion des interventions
  - Sauvegarde et export

- **`nextjs-_document.tsx`** - Configuration du document Next.js
  - Chargement des dépendances CDN
  - Configuration des scripts et styles
  - Compatible Pages Router

- **`nextjs-api-route.ts`** - Exemple d'API Routes
  - Sauvegarde et chargement d'itinéraires
  - CRUD complet
  - Gestion des fichiers JSON

## Utilisation

### 1. Copier les exemples

Copiez les fichiers dans votre projet Next.js :

```bash
# Pour le visualiseur
cp examples/nextjs-app-router-viewer.tsx app/itineraire/page.tsx

# Pour l'éditeur
cp examples/nextjs-app-router-editor.tsx app/editor/page.tsx

# Pour la configuration
cp examples/nextjs-_document.tsx pages/_document.tsx  # Pages Router
# ou adaptez pour app/layout.tsx (App Router)

# Pour l'API
cp examples/nextjs-api-route.ts app/api/itineraire/route.ts  # App Router
# ou pages/api/itineraire.ts (Pages Router)
```

### 2. Installer les dépendances

```bash
npm install @osfarm/itineraire-technique
npm run setup:react
```

### 3. Adapter à votre projet

Les exemples sont commentés et peuvent être adaptés à vos besoins spécifiques :

- Personnalisez les styles
- Ajoutez votre logique métier
- Intégrez avec votre base de données
- Ajoutez l'authentification

## Structure d'un projet Next.js complet

```
my-app/
├── app/                          # App Router (Next.js 13+)
│   ├── layout.tsx                # Layout principal avec scripts CDN
│   ├── itineraire/
│   │   └── page.tsx              # Page de visualisation
│   ├── editor/
│   │   └── page.tsx              # Page d'édition
│   └── api/
│       └── itineraire/
│           └── route.ts          # API Routes
├── public/                       # Fichiers statiques
│   ├── js/
│   │   ├── chart-render.js
│   │   └── editor-*.js
│   ├── css/
│   │   ├── styles-rendering.css
│   │   └── styles-editor.css
│   └── test/
│       └── test.json
├── package.json
└── tsconfig.json
```

## Frameworks alternatifs

Bien que ces exemples soient pour Next.js, les composants React sont compatibles avec :

- **Create React App** - Ajoutez les scripts CDN dans `public/index.html`
- **Vite** - Ajoutez les scripts CDN dans `index.html`
- **Remix** - Ajoutez les scripts dans `root.tsx`
- **Gatsby** - Utilisez `gatsby-ssr.js` pour ajouter les scripts

## Support TypeScript

Tous les exemples sont fournis en TypeScript avec les types complets. Si vous utilisez JavaScript, supprimez simplement les annotations de type.

## Personnalisation

### Thème et styles

Vous pouvez personnaliser les styles en :

1. Surchargeant les classes CSS existantes
2. Modifiant les fichiers SCSS sources
3. Utilisant la prop `className` des composants

### Événements

Les composants exposent des callbacks pour interagir avec eux :

```tsx
<TikaRenderer
  data={data}
  onItemClick={(id, event) => {
    // Votre logique
  }}
  onItemHover={(id, event) => {
    // Votre logique
  }}
/>
```

## Besoin d'aide ?

- Consultez la [documentation React](../react/README.md)
- Consultez le [Quick Start](../react/QUICKSTART.md)
- Ouvrez une [issue sur GitHub](https://github.com/osfarm/itineraire-technique/issues)
