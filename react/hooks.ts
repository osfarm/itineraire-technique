/**
 * Hook React personnalisé pour gérer les données d'itinéraire technique
 */

import { useState, useCallback, useEffect } from 'react';
import type { ItineraireData, Step, Intervention } from './types';

export interface UseItineraireResult {
  data: ItineraireData | null;
  loading: boolean;
  error: Error | null;
  updateData: (newData: ItineraireData) => void;
  addStep: (step: Step) => void;
  updateStep: (stepId: string, updates: Partial<Step>) => void;
  deleteStep: (stepId: string) => void;
  addIntervention: (stepId: string, intervention: Intervention) => void;
  updateIntervention: (stepId: string, interventionId: string, updates: Partial<Intervention>) => void;
  deleteIntervention: (stepId: string, interventionId: string) => void;
  exportToJson: () => string;
  importFromJson: (jsonString: string) => void;
  reset: () => void;
}

/**
 * Hook pour gérer les données d'itinéraire technique
 * @param initialData Données initiales
 * @param onUpdate Callback appelé à chaque modification
 */
export const useItineraire = (
  initialData: ItineraireData | null = null,
  onUpdate?: (data: ItineraireData) => void
): UseItineraireResult => {
  const [data, setData] = useState<ItineraireData | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Appeler onUpdate quand les données changent
  useEffect(() => {
    if (data && onUpdate) {
      onUpdate(data);
    }
  }, [data, onUpdate]);

  const updateData = useCallback((newData: ItineraireData) => {
    setData(newData);
    setError(null);
  }, []);

  const addStep = useCallback((step: Step) => {
    setData((prevData) => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        steps: [...prevData.steps, step]
      };
    });
  }, []);

  const updateStep = useCallback((stepId: string, updates: Partial<Step>) => {
    setData((prevData) => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        steps: prevData.steps.map((step) =>
          step.id === stepId ? { ...step, ...updates } : step
        )
      };
    });
  }, []);

  const deleteStep = useCallback((stepId: string) => {
    setData((prevData) => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        steps: prevData.steps.filter((step) => step.id !== stepId)
      };
    });
  }, []);

  const addIntervention = useCallback((stepId: string, intervention: Intervention) => {
    setData((prevData) => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        steps: prevData.steps.map((step) =>
          step.id === stepId
            ? {
                ...step,
                interventions: [...(step.interventions || []), intervention]
              }
            : step
        )
      };
    });
  }, []);

  const updateIntervention = useCallback(
    (stepId: string, interventionId: string, updates: Partial<Intervention>) => {
      setData((prevData) => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          steps: prevData.steps.map((step) =>
            step.id === stepId
              ? {
                  ...step,
                  interventions: (step.interventions || []).map((intervention) =>
                    intervention.id === interventionId
                      ? { ...intervention, ...updates }
                      : intervention
                  )
                }
              : step
          )
        };
      });
    },
    []
  );

  const deleteIntervention = useCallback((stepId: string, interventionId: string) => {
    setData((prevData) => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        steps: prevData.steps.map((step) =>
          step.id === stepId
            ? {
                ...step,
                interventions: (step.interventions || []).filter(
                  (intervention) => intervention.id !== interventionId
                )
              }
            : step
        )
      };
    });
  }, []);

  const exportToJson = useCallback(() => {
    if (!data) return '{}';
    return JSON.stringify(data, null, 2);
  }, [data]);

  const importFromJson = useCallback((jsonString: string) => {
    try {
      setLoading(true);
      const parsed = JSON.parse(jsonString);
      setData(parsed);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Invalid JSON'));
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
  }, [initialData]);

  return {
    data,
    loading,
    error,
    updateData,
    addStep,
    updateStep,
    deleteStep,
    addIntervention,
    updateIntervention,
    deleteIntervention,
    exportToJson,
    importFromJson,
    reset
  };
};

/**
 * Hook pour charger les dépendances nécessaires (ECharts, jQuery, etc.)
 */
export const useItineraireDependencies = () => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkDependencies = () => {
      const hasEcharts = !!window.echarts;
      const hasJQuery = !!window.$;
      const hasUnderscore = !!window._;
      const hasRotationRenderer = !!window.RotationRenderer;

      return hasEcharts && hasJQuery && hasUnderscore && hasRotationRenderer;
    };

    if (checkDependencies()) {
      setLoaded(true);
    } else {
      // Attendre un peu que les scripts se chargent
      const timeout = setTimeout(() => {
        if (checkDependencies()) {
          setLoaded(true);
        } else {
          setError(new Error('Required dependencies not loaded'));
        }
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, []);

  return { loaded, error };
};
