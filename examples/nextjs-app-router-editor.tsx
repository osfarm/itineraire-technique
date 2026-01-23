/**
 * Exemple d'utilisation de l'éditeur avec Next.js App Router
 * Fichier: app/editor/page.tsx
 */

'use client';

import { useItineraire, useItineraireDependencies } from '@osfarm/itineraire-technique/react';
import { TikaRenderer } from '@osfarm/itineraire-technique/react';
import { useState } from 'react';
import type { ItineraireData, Step, Intervention } from '@osfarm/itineraire-technique/react';

export default function EditorPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // Vérifier que les dépendances sont chargées
  const { loaded: depsLoaded, error: depsError } = useItineraireDependencies();

  // Données initiales
  const initialData: ItineraireData = {
    title: "Nouvelle rotation",
    options: {
      view: "horizontal",
      show_transcript: true,
      title_top_interventions: "Cultures principales",
      title_bottom_interventions: "Couverts et CIVE",
      title_steps: "Rotation",
      region: "France",
      show_climate_diagram: false
    },
    steps: []
  };

  const {
    data,
    loading,
    error,
    addStep,
    updateStep,
    deleteStep,
    addIntervention,
    deleteIntervention,
    exportToJson,
    importFromJson
  } = useItineraire(initialData);

  // Sauvegarder vers une API
  const handleSave = async () => {
    if (!data) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/itineraire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Erreur de sauvegarde');

      setSaveMessage('Sauvegarde réussie !');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Exporter en JSON
  const handleExport = () => {
    const json = exportToJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `itineraire-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Importer depuis JSON
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          try {
            importFromJson(content);
            setSaveMessage('Import réussi !');
            setTimeout(() => setSaveMessage(null), 3000);
          } catch (err) {
            setSaveMessage(`Erreur d'import: ${err instanceof Error ? err.message : 'Fichier invalide'}`);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Ajouter une nouvelle étape
  const handleAddStep = () => {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 3);

    const newStep: Step = {
      id: crypto.randomUUID(),
      name: `Nouvelle culture ${data?.steps.length ? data.steps.length + 1 : 1}`,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      description: '',
      interventions: []
    };

    addStep(newStep);
  };

  // Ajouter une intervention à une étape
  const handleAddIntervention = (stepId: string) => {
    const newIntervention: Intervention = {
      id: crypto.randomUUID(),
      day: '0',
      name: 'Nouvelle intervention',
      type: 'intervention_top',
      description: ''
    };

    addIntervention(stepId, newIntervention);
  };

  if (!depsLoaded) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement des dépendances...</span>
        </div>
      </div>
    );
  }

  if (depsError) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          Erreur de chargement: {depsError.message}
          <br />
          <small>Assurez-vous que les scripts sont bien chargés dans _document.tsx</small>
        </div>
      </div>
    );
  }

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
        <div className="alert alert-danger">
          Erreur: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* En-tête avec boutons d'action */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <h1>Éditeur d'Itinéraire Technique</h1>
            
            <div className="btn-group" role="group">
              <button 
                className="btn btn-primary" 
                onClick={handleSave}
                disabled={isSaving}
              >
                <i className="fa fa-save"></i> 
                {isSaving ? ' Sauvegarde...' : ' Sauvegarder'}
              </button>
              <button 
                className="btn btn-outline-secondary" 
                onClick={handleExport}
              >
                <i className="fa fa-download"></i> Exporter JSON
              </button>
              <button 
                className="btn btn-outline-secondary" 
                onClick={handleImport}
              >
                <i className="fa fa-upload"></i> Importer JSON
              </button>
            </div>
          </div>

          {saveMessage && (
            <div className={`alert mt-3 ${saveMessage.includes('Erreur') ? 'alert-danger' : 'alert-success'}`}>
              {saveMessage}
            </div>
          )}
        </div>
      </div>

      {/* Zone d'édition */}
      <div className="row">
        <div className="col-lg-3">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Étapes</h5>
              <button 
                className="btn btn-sm btn-success" 
                onClick={handleAddStep}
              >
                <i className="fa fa-plus"></i>
              </button>
            </div>
            <div className="card-body">
              {data?.steps.length === 0 ? (
                <p className="text-muted text-center">Aucune étape</p>
              ) : (
                <div className="list-group">
                  {data?.steps.map((step) => (
                    <div key={step.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong>{step.name}</strong>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleAddIntervention(step.id)}
                            title="Ajouter intervention"
                          >
                            <i className="fa fa-plus"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => deleteStep(step.id)}
                            title="Supprimer"
                          >
                            <i className="fa fa-trash"></i>
                          </button>
                        </div>
                      </div>
                      <small className="text-muted">
                        {new Date(step.startDate).toLocaleDateString()} - 
                        {new Date(step.endDate).toLocaleDateString()}
                      </small>
                      {step.interventions && step.interventions.length > 0 && (
                        <div className="mt-2">
                          <small>{step.interventions.length} intervention(s)</small>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-9">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Aperçu</h5>
            </div>
            <div className="card-body">
              {data && data.steps.length > 0 ? (
                <TikaRenderer data={data} width="100%" height="auto" />
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="fa fa-info-circle fa-3x mb-3"></i>
                  <p>Ajoutez des étapes pour voir l'aperçu</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
