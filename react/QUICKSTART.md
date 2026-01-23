# Quick Start - React/Next.js

Guide rapide pour intégrer `@osfarm/itineraire-technique` dans votre projet React ou Next.js.

## Installation (5 minutes)

### Étape 1 : Installer le package

```bash
npm install @osfarm/itineraire-technique
# ou
yarn add @osfarm/itineraire-technique
# ou
pnpm add @osfarm/itineraire-technique
```

### Étape 2 : Copier les fichiers statiques

```bash
npm run setup:react
```

Ce script copie automatiquement les fichiers JS, CSS et de test dans votre dossier `public/`.

### Étape 3 : Ajouter les dépendances CDN

**Pour Next.js App Router** : Créez ou modifiez `app/layout.tsx` :

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <script src="https://cdn.jsdelivr.net/npm/echarts@6.0.0/dist/echarts.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/underscore@1.13.7/underscore-umd-min.js"></script>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css" rel="stylesheet" />
        
        <script src="/js/chart-render.js"></script>
        <link href="/css/styles-rendering.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Pour Next.js Pages Router** : Créez ou modifiez `pages/_document.tsx` (voir [exemple complet](../examples/nextjs-_document.tsx))

## Utilisation - Visualiseur Simple

Créez un composant pour afficher un itinéraire :

```tsx
'use client'; // Pour Next.js App Router uniquement

import { TikaRenderer } from '@osfarm/itineraire-technique/react';
import { useEffect, useState } from 'react';

export default function MyItineraire() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Charger les données de test
    fetch('/test/test.json')
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return <div>Chargement...</div>;

  return (
    <div className="container">
      <h1>{data.title}</h1>
      <TikaRenderer data={data} />
    </div>
  );
}
```

## Utilisation - Éditeur Simple

```tsx
'use client';

import { useItineraire } from '@osfarm/itineraire-technique/react';
import { TikaRenderer } from '@osfarm/itineraire-technique/react';

export default function MyEditor() {
  const { data, addStep, exportToJson } = useItineraire({
    title: "Ma rotation",
    options: { view: "horizontal", show_transcript: true },
    steps: []
  });

  const handleAddCrop = () => {
    addStep({
      id: crypto.randomUUID(),
      name: 'Nouvelle culture',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 90*24*60*60*1000).toISOString(),
      color: '#4CAF50',
      interventions: []
    });
  };

  return (
    <div className="container">
      <button className="btn btn-primary" onClick={handleAddCrop}>
        Ajouter une culture
      </button>
      <button className="btn btn-secondary" onClick={() => console.log(exportToJson())}>
        Exporter JSON
      </button>
      
      {data && <TikaRenderer data={data} />}
    </div>
  );
}
```

## TypeScript Support

Types inclus ! Importez-les directement :

```tsx
import type { ItineraireData, Step, Intervention } from '@osfarm/itineraire-technique/react';

const myRotation: ItineraireData = {
  title: "Ma rotation bio",
  options: {
    view: "horizontal",
    show_transcript: true
  },
  steps: []
};
```

## Exemples Complets

Consultez le dossier [`examples/`](../examples/) pour :
- ✅ Visualiseur Next.js App Router
- ✅ Éditeur Next.js App Router  
- ✅ Configuration `_document.tsx`
- ✅ API Routes pour sauvegarder/charger des données

## Troubleshooting

### "RotationRenderer is not defined"

➡️ Vérifiez que `/js/chart-render.js` est bien chargé dans votre HTML/layout
➡️ Utilisez le hook `useItineraireDependencies` pour vérifier le chargement

### Les styles ne s'appliquent pas

➡️ Assurez-vous d'avoir chargé `/css/styles-rendering.css`
➡️ Vérifiez que Bootstrap CSS est aussi chargé

### Erreur "use client" manquant

➡️ Ajoutez `'use client';` en haut de vos composants qui utilisent des hooks React

## Documentation Complète

📚 [Documentation React complète](README.md)

## Besoin d'aide ?

- 🐛 [Signaler un bug](https://github.com/osfarm/itineraire-technique/issues)
- 💬 [Questions et discussions](https://github.com/osfarm/itineraire-technique/discussions)
- 📖 [Documentation Triple Performance](https://wiki.tripleperformance.fr/)
