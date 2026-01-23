#!/bin/bash

# Script de setup pour copier les fichiers nécessaires dans un projet React/Next.js
# Usage: npm run setup:react

echo "🚀 Configuration de @osfarm/itineraire-technique pour React/Next.js"
echo ""

# Déterminer le répertoire de destination
if [ -d "public" ]; then
  PUBLIC_DIR="public"
elif [ -d "static" ]; then
  PUBLIC_DIR="static"
else
  echo "⚠️  Aucun dossier public/ ou static/ trouvé"
  echo "Création du dossier public/"
  mkdir -p public
  PUBLIC_DIR="public"
fi

echo "📂 Répertoire de destination: $PUBLIC_DIR/"
echo ""

# Copier les fichiers JS
echo "📦 Copie des fichiers JavaScript..."
if [ -d "node_modules/@osfarm/itineraire-technique/js" ]; then
  mkdir -p "$PUBLIC_DIR/js"
  cp node_modules/@osfarm/itineraire-technique/js/*.js "$PUBLIC_DIR/js/"
  echo "✅ Fichiers JS copiés dans $PUBLIC_DIR/js/"
else
  echo "❌ Dossier source introuvable. Assurez-vous d'avoir installé le package."
  exit 1
fi

# Copier les fichiers CSS
echo "🎨 Copie des fichiers CSS..."
mkdir -p "$PUBLIC_DIR/css"
cp node_modules/@osfarm/itineraire-technique/css/*.css "$PUBLIC_DIR/css/"
echo "✅ Fichiers CSS copiés dans $PUBLIC_DIR/css/"

# Copier les fichiers de test (optionnel)
echo "📝 Copie des fichiers de test..."
mkdir -p "$PUBLIC_DIR/test"
cp -r node_modules/@osfarm/itineraire-technique/test/* "$PUBLIC_DIR/test/"
echo "✅ Fichiers de test copiés dans $PUBLIC_DIR/test/"

# Copier les images (optionnel)
if [ -d "node_modules/@osfarm/itineraire-technique/images" ]; then
  echo "🖼️  Copie des images..."
  mkdir -p "$PUBLIC_DIR/images"
  cp -r node_modules/@osfarm/itineraire-technique/images/* "$PUBLIC_DIR/images/"
  echo "✅ Images copiées dans $PUBLIC_DIR/images/"
fi

echo ""
echo "✨ Configuration terminée !"
echo ""
echo "📚 Prochaines étapes:"
echo "1. Ajoutez les scripts CDN dans votre _document.tsx (Next.js) ou index.html"
echo "   Voir: node_modules/@osfarm/itineraire-technique/examples/nextjs-_document.tsx"
echo ""
echo "2. Importez les composants React:"
echo "   import { TikaRenderer } from '@osfarm/itineraire-technique/react';"
echo ""
echo "3. Consultez la documentation:"
echo "   node_modules/@osfarm/itineraire-technique/react/README.md"
echo ""
