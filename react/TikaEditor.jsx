/**
 * TikaEditor - Composant React pour éditer un itinéraire technique
 * 
 * @example
 * import TikaEditor from '@osfarm/itineraire-technique/react/TikaEditor';
 * 
 * function MyComponent() {
 *   const [data, setData] = useState(initialData);
 *   
 *   const handleSave = (newData) => {
 *     console.log('Data saved:', newData);
 *     setData(newData);
 *   };
 *   
 *   return <TikaEditor initialData={data} onSave={handleSave} />;
 * }
 */

import React, { useEffect, useRef, useState } from 'react';

const TikaEditor = ({ 
  initialData = null,
  onSave = null,
  onExport = null,
  className = '',
  showWikiButtons = false,
  enableAutoSave = false,
  autoSaveInterval = 5000
}) => {
  const containerRef = useRef(null);
  const editorInitialized = useRef(false);
  const autoSaveTimer = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentData, setCurrentData] = useState(initialData);

  // Fonction pour récupérer les données actuelles de l'éditeur
  const getCurrentData = () => {
    if (typeof window === 'undefined' || !window.rotation_data) return null;
    return JSON.parse(JSON.stringify(window.rotation_data));
  };

  // Fonction pour sauvegarder
  const handleSave = () => {
    const data = getCurrentData();
    if (data && onSave) {
      onSave(data);
      setCurrentData(data);
    }
  };

  // Fonction pour exporter
  const handleExport = () => {
    const data = getCurrentData();
    if (data && onExport) {
      onExport(data);
    } else if (data && window.exportToJsonFile) {
      // Utiliser la fonction d'export native si pas de callback personnalisé
      window.exportToJsonFile(data);
    }
  };

  // Auto-save
  useEffect(() => {
    if (enableAutoSave && onSave) {
      autoSaveTimer.current = setInterval(() => {
        handleSave();
      }, autoSaveInterval);

      return () => {
        if (autoSaveTimer.current) {
          clearInterval(autoSaveTimer.current);
        }
      };
    }
  }, [enableAutoSave, autoSaveInterval, onSave]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Vérifier les dépendances
    const checkDependencies = () => {
      const missing = [];
      if (!window.$) missing.push('jQuery');
      if (!window.echarts) missing.push('ECharts');
      if (!window._) missing.push('Underscore');
      if (!window.RotationRenderer) missing.push('chart-render.js');
      
      // Vérifier les fonctions de l'éditeur
      if (!window.refreshAttributesTable) missing.push('editor-attributes.js');
      if (!window.refreshStepsButtonList) missing.push('editor-crops.js');
      if (!window.exportToJsonFile) missing.push('editor-export.js');
      if (!window.refreshInterventionsList) missing.push('editor-interventions.js');
      
      return missing;
    };

    const missingDeps = checkDependencies();
    if (missingDeps.length > 0) {
      console.error('Missing dependencies for TikaEditor:', missingDeps.join(', '));
      setIsLoading(false);
      return;
    }

    // Initialiser l'éditeur seulement une fois
    if (!editorInitialized.current && containerRef.current) {
      editorInitialized.current = true;

      // Initialiser la structure globale de données si nécessaire
      if (!window.rotation_data) {
        window.rotation_data = initialData || {
          title: "Nouvel itinéraire",
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
      } else if (initialData) {
        window.rotation_data = initialData;
      }

      // Appeler les fonctions d'initialisation de l'éditeur
      try {
        if (window.refreshAttributesTable) window.refreshAttributesTable();
        if (window.refreshStepsButtonList) window.refreshStepsButtonList();
        if (window.refreshInterventionsList) window.refreshInterventionsList();
        
        // Rendre le graphique initial
        if (window.renderChart) {
          window.renderChart();
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing editor:', error);
        setIsLoading(false);
      }
    }

    // Exposer les fonctions de save/export via window pour que le HTML interne puisse les appeler
    window.reactEditorSave = handleSave;
    window.reactEditorExport = handleExport;

  }, [initialData]);

  // Mettre à jour les données si initialData change
  useEffect(() => {
    if (initialData && window.rotation_data) {
      window.rotation_data = initialData;
      if (window.refreshAttributesTable) window.refreshAttributesTable();
      if (window.refreshStepsButtonList) window.refreshStepsButtonList();
      if (window.refreshInterventionsList) window.refreshInterventionsList();
      if (window.renderChart) window.renderChart();
    }
  }, [initialData]);

  if (isLoading) {
    return (
      <div className={`itineraire-editor-loading ${className}`}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`itineraire-editor ${className}`}>
      {/* Boutons de contrôle React */}
      <div className="react-editor-controls mb-3">
        <div className="btn-group" role="group">
          {onSave && (
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleSave}
            >
              <i className="fa fa-save"></i> Enregistrer
            </button>
          )}
          {onExport && (
            <button 
              type="button" 
              className="btn btn-outline-primary"
              onClick={handleExport}
            >
              <i className="fa fa-download"></i> Exporter JSON
            </button>
          )}
        </div>
      </div>

      {/* Le contenu HTML de l'éditeur sera injecté ici via un portail ou iframe */}
      {/* Pour l'instant, on délègue au HTML existant */}
      <div id="editor-content-container">
        {/* L'éditeur HTML existant sera chargé ici */}
        <iframe
          src="/editor.html"
          style={{ width: '100%', height: '800px', border: 'none' }}
          title="Éditeur d'itinéraire technique"
        />
      </div>
    </div>
  );
};

export default TikaEditor;
