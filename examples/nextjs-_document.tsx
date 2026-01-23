/**
 * Exemple de _document.tsx pour Next.js Pages Router
 * Fichier: pages/_document.tsx
 */

import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        {/* ECharts - Bibliothèque de graphiques */}
        <script src="https://cdn.jsdelivr.net/npm/echarts@6.0.0/dist/echarts.js"></script>
        
        {/* jQuery et jQuery UI */}
        <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/jquery-ui@1.14.1/dist/jquery-ui.min.js"></script>
        <link 
          rel="stylesheet" 
          href="https://cdn.jsdelivr.net/npm/jquery-ui@1.14.1/themes/base/jquery-ui.css" 
        />
        
        {/* Underscore.js */}
        <script src="https://cdn.jsdelivr.net/npm/underscore@1.13.7/underscore-umd-min.js"></script>
        
        {/* Bootstrap */}
        <script 
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"
          integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI"
          crossOrigin="anonymous"
        ></script>
        <link 
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" 
          rel="stylesheet"
          integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB"
          crossOrigin="anonymous"
        />
        
        {/* Font Awesome */}
        <link 
          href="https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css" 
          rel="stylesheet" 
        />
        
        {/* 
          Scripts TIKA - À copier dans le dossier public/
          Voir instructions dans react/README.md 
        */}
        <script src="/chart-render.js"></script>
        <script src="/editor-attributes.js"></script>
        <script src="/editor-interventions.js"></script>
        <script src="/editor-crops.js"></script>
        <script src="/editor-export.js"></script>
        <script src="/editor-wiki-editor.js"></script>
        
        {/* Styles TIKA - À copier dans le dossier public/ */}
        <link href="/styles-rendering.css" rel="stylesheet" />
        <link href="/styles-editor.css" rel="stylesheet" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
