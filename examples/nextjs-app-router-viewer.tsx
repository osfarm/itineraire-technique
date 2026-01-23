/**
 * Exemple d'utilisation avec Next.js App Router
 * Fichier: app/itineraire/page.tsx
 */

'use client';

import { TikaRenderer } from '@osfarm/itineraire-technique/react';
import { useEffect, useState } from 'react';
import type { ItineraireData } from '@osfarm/itineraire-technique/react';

export default function ItinerairePage() {
  const [data, setData] = useState<ItineraireData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Charger les données depuis votre API ou fichier JSON
    fetch('/test/test.json')
      .then(response => {
        if (!response.ok) throw new Error('Erreur de chargement');
        return response.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleItemClick = (itemId: string, event: Event) => {
    console.log('Élément cliqué:', itemId);
    // Vous pouvez ajouter votre logique ici (modal, navigation, etc.)
  };

  const handleItemHover = (itemId: string, event: Event) => {
    console.log('Survol:', itemId);
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          Erreur: {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-5">
        <div className="alert alert-info" role="alert">
          Aucune donnée à afficher
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-5">
      <div className="row">
        <div className="col-12">
          <h1 className="mb-4">{data.title}</h1>
          <TikaRenderer
            data={data}
            width="100%"
            height="auto"
            onItemClick={handleItemClick}
            onItemHover={handleItemHover}
            className="shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}
