# Utilisation avec React et Next.js

Ce package peut être utilisé dans des applications React et Next.js. Voici comment l'intégrer.

## Installation

```bash
npm install @osfarm/itineraire-technique
```

## Dépendances à inclure

Les composants React dépendent de plusieurs bibliothèques externes qui doivent être chargées. Vous avez deux options :

### Option 1 : Via CDN (recommandé pour Next.js)

Dans votre `_document.tsx` ou `_app.tsx` (Next.js) ou dans votre `index.html` (React) :

```tsx
// pages/_document.tsx (Next.js)
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        {/* ECharts */}
        <script src="https://cdn.jsdelivr.net/npm/echarts@6.0.0/dist/echarts.js"></script>
        
        {/* jQuery */}
        <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/jquery-ui@1.14.1/dist/jquery-ui.min.js"></script>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jquery-ui@1.14.1/themes/base/jquery-ui.css" />
        
        {/* Underscore */}
        <script src="https://cdn.jsdelivr.net/npm/underscore@1.13.7/underscore-umd-min.js"></script>
        
        {/* Bootstrap (pour l'éditeur) */}
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" />
        
        {/* Font Awesome */}
        <link href="https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css" rel="stylesheet" />
        
        {/* Scripts TIKA */}
        <script src="/chart-render.js"></script>
        <script src="/editor-attributes.js"></script>
        <script src="/editor-interventions.js"></script>
        <script src="/editor-crops.js"></script>
        <script src="/editor-export.js"></script>
        <script src="/editor-wiki-editor.js"></script>
        
        {/* Styles TIKA */}
        <link href="/styles-rendering.css" rel="stylesheet" />
        <link href="/styles-editor.css" rel="stylesheet" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
```

### Option 2 : Via NPM

```bash
npm install echarts jquery jquery-ui underscore bootstrap
```

Puis importez-les dans votre application.

## Copier les fichiers statiques

Copiez les fichiers JS et CSS depuis `node_modules/@osfarm/itineraire-technique/` vers votre dossier `public/` :

```bash
# Créer les dossiers
mkdir -p public/js public/css

# Copier les fichiers JS
cp node_modules/@osfarm/itineraire-technique/js/*.js public/

# Copier les fichiers CSS
cp node_modules/@osfarm/itineraire-technique/css/*.css public/
```

## Utilisation du composant de visualisation

```tsx
'use client'; // Pour Next.js App Router

import { TikaRenderer } from '@osfarm/itineraire-technique/react';
import { useEffect, useState } from 'react';

export default function ItinerairePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger vos données depuis une API ou un fichier
    fetch('/api/itineraire')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Chargement...</div>;
  if (!data) return <div>Aucune donnée</div>;

  return (
    <div className="container">
      <h1>Itinéraire Technique</h1>
      <TikaRenderer 
        data={data}
        width="100%"
        height="600px"
        onItemClick={(itemId, event) => {
          console.log('Item clicked:', itemId);
        }}
      />
    </div>
  );
}
```

## Utilisation du composant éditeur

```tsx
'use client';

import { TikaEditor } from '@osfarm/itineraire-technique/react';
import { useState } from 'react';

export default function EditorPage() {
  const [data, setData] = useState({
    title: "Ma rotation",
    options: {
      view: "horizontal",
      show_transcript: true,
      title_top_interventions: "Cultures principales",
      title_bottom_interventions: "Couverts",
      title_steps: "Rotation",
      region: "France"
    },
    steps: []
  });

  const handleSave = (newData) => {
    console.log('Données sauvegardées:', newData);
    setData(newData);
    
    // Envoyer à votre API
    fetch('/api/itineraire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData)
    });
  };

  const handleExport = (data) => {
    // Télécharger le JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'itineraire.json';
    a.click();
  };

  return (
    <div className="container">
      <h1>Éditeur d'Itinéraire Technique</h1>
      <TikaEditor
        initialData={data}
        onSave={handleSave}
        onExport={handleExport}
        enableAutoSave={true}
        autoSaveInterval={10000}
      />
    </div>
  );
}
```

## Utilisation avec le hook personnalisé

```tsx
'use client';

import { useItineraire } from '@osfarm/itineraire-technique/react';
import { TikaRenderer } from '@osfarm/itineraire-technique/react';

export default function MyComponent() {
  const {
    data,
    loading,
    error,
    addStep,
    updateStep,
    deleteStep,
    exportToJson
  } = useItineraire(initialData);

  const handleAddStep = () => {
    const newStep = {
      id: crypto.randomUUID(),
      name: 'Nouvelle culture',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      color: '#4CAF50',
      interventions: []
    };
    addStep(newStep);
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;
  if (!data) return <div>Aucune donnée</div>;

  return (
    <div>
      <button onClick={handleAddStep}>Ajouter une étape</button>
      <button onClick={() => console.log(exportToJson())}>Exporter JSON</button>
      <TikaRenderer data={data} />
    </div>
  );
}
```

## TypeScript

Les types TypeScript sont inclus. Importez-les depuis le package :

```tsx
import type { 
  ItineraireData, 
  Step, 
  Intervention 
} from '@osfarm/itineraire-technique/react';

const myData: ItineraireData = {
  title: "Ma rotation",
  options: {
    view: "horizontal",
    show_transcript: true
  },
  steps: []
};
```

## Configuration Next.js

Si vous utilisez Next.js 13+ avec App Router, assurez-vous que vos composants sont marqués avec `'use client'` car ils utilisent des hooks React et accèdent au DOM.

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permettre les scripts externes
  experimental: {
    externalDir: true
  }
}

module.exports = nextConfig
```

## Exemples complets

Consultez le dossier `examples/` pour des exemples complets d'intégration avec :
- Next.js App Router
- Next.js Pages Router
- Create React App
- Vite + React

## Troubleshooting

### "RotationRenderer is not defined"

Assurez-vous que `chart-render.js` est chargé avant le rendu de votre composant. Utilisez `useItineraireDependencies` pour vérifier :

```tsx
import { useItineraireDependencies } from '@osfarm/itineraire-technique/react';

function MyComponent() {
  const { loaded, error } = useItineraireDependencies();
  
  if (!loaded) return <div>Chargement des dépendances...</div>;
  if (error) return <div>Erreur: {error.message}</div>;
  
  return <TikaRenderer data={data} />;
}
```

### Problèmes de styles

Assurez-vous que les fichiers CSS sont bien importés :
- `styles-rendering.css` pour le visualiseur
- `styles-editor.css` pour l'éditeur
- Bootstrap pour l'interface de l'éditeur
