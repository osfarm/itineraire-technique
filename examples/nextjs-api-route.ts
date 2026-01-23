/**
 * Exemple d'API route pour sauvegarder/charger des itinéraires
 * Fichier: app/api/itineraire/route.ts (Next.js App Router)
 * ou pages/api/itineraire.ts (Next.js Pages Router)
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Dossier de stockage des itinéraires
const ITINERAIRES_DIR = path.join(process.cwd(), 'data', 'itineraires');

// Créer le dossier s'il n'existe pas
async function ensureDir() {
  try {
    await fs.access(ITINERAIRES_DIR);
  } catch {
    await fs.mkdir(ITINERAIRES_DIR, { recursive: true });
  }
}

// GET - Récupérer un itinéraire
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
  }

  try {
    await ensureDir();
    const filePath = path.join(ITINERAIRES_DIR, `${id}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json(
      { error: 'Itinéraire non trouvé' },
      { status: 404 }
    );
  }
}

// POST - Sauvegarder un itinéraire
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validation basique
    if (!data.title || !data.options || !data.steps) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }

    await ensureDir();

    // Générer un ID si nécessaire
    const id = data.id || `itk-${Date.now()}`;
    const filePath = path.join(ITINERAIRES_DIR, `${id}.json`);

    // Sauvegarder
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Erreur de sauvegarde:', error);
    return NextResponse.json(
      { error: 'Erreur de sauvegarde' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un itinéraire
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
  }

  try {
    const filePath = path.join(ITINERAIRES_DIR, `${id}.json`);
    await fs.unlink(filePath);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur de suppression' },
      { status: 500 }
    );
  }
}

// Liste de tous les itinéraires (pour Pages Router)
// Fichier: pages/api/itineraires/list.ts
export async function listItineraires() {
  await ensureDir();
  const files = await fs.readdir(ITINERAIRES_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  const itineraires = await Promise.all(
    jsonFiles.map(async (file) => {
      const content = await fs.readFile(
        path.join(ITINERAIRES_DIR, file),
        'utf-8'
      );
      const data = JSON.parse(content);
      return {
        id: file.replace('.json', ''),
        title: data.title,
        stepsCount: data.steps?.length || 0,
        updatedAt: (await fs.stat(path.join(ITINERAIRES_DIR, file))).mtime
      };
    })
  );

  return itineraires;
}
