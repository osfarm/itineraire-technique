/**
 * TikaRenderer - Composant React pour visualiser un itinéraire technique
 * 
 * @example
 * import TikaRenderer from '@osfarm/itineraire-technique/react/TikaRenderer';
 * 
 * function MyComponent() {
 *   const data = { ... }; // Données JSON de l'itinéraire
 *   return <TikaRenderer data={data} />;
 * }
 */

import React, { useEffect, useRef } from 'react';

const TikaRenderer = ({ 
  data, 
  width = '100%', 
  height = 'auto',
  className = '',
  onItemClick = null,
  onItemHover = null 
}) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const divId = useRef(`itk-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // Vérifier que les dépendances sont chargées
    if (typeof window === 'undefined') return;
    
    if (!window.RotationRenderer) {
      console.error('RotationRenderer not loaded. Make sure chart-render.js is included.');
      return;
    }

    if (!window.echarts) {
      console.error('ECharts not loaded. Make sure ECharts is included.');
      return;
    }

    if (!window.$) {
      console.error('jQuery not loaded. Make sure jQuery is included.');
      return;
    }

    // Créer le conteneur si nécessaire
    if (containerRef.current && !containerRef.current.querySelector('.mainITKContainer')) {
      // Initialiser le renderer
      try {
        rendererRef.current = new window.RotationRenderer(divId.current, data);
        rendererRef.current.render();

        // Attacher les événements personnalisés si fournis
        if (onItemClick) {
          containerRef.current.addEventListener('click', (e) => {
            const item = e.target.closest('.rotation_item');
            if (item) {
              const itemId = item.dataset.id || item.id;
              onItemClick(itemId, e);
            }
          });
        }

        if (onItemHover) {
          containerRef.current.addEventListener('mouseover', (e) => {
            const item = e.target.closest('.rotation_item');
            if (item) {
              const itemId = item.dataset.id || item.id;
              onItemHover(itemId, e);
            }
          });
        }
      } catch (error) {
        console.error('Error initializing RotationRenderer:', error);
      }
    }

    // Cleanup
    return () => {
      if (rendererRef.current && rendererRef.current.chart) {
        try {
          rendererRef.current.chart.dispose();
        } catch (error) {
          console.error('Error disposing chart:', error);
        }
      }
    };
  }, [data, onItemClick, onItemHover]);

  // Réagir aux changements de données
  useEffect(() => {
    if (rendererRef.current && data) {
      try {
        // Recréer le renderer avec les nouvelles données
        if (rendererRef.current.chart) {
          rendererRef.current.chart.dispose();
        }
        rendererRef.current = new window.RotationRenderer(divId.current, data);
        rendererRef.current.render();
      } catch (error) {
        console.error('Error updating chart data:', error);
      }
    }
  }, [data]);

  return (
    <div 
      ref={containerRef}
      id={divId.current}
      className={`itineraire-renderer ${className}`}
      style={{ width, height }}
    />
  );
};

export default TikaRenderer;
