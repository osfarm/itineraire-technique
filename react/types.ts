/**
 * Types TypeScript pour les données d'itinéraire technique TIKA
 */

export interface ClimateData {
  /** Températures moyennes mensuelles (12 valeurs, en °C) */
  temperatures: number[];
  /** Précipitations moyennes mensuelles (12 valeurs, en mm) */
  precipitations: number[];
}

export interface ItineraireOptions {
  /** Type de vue: 'horizontal', 'vertical', ou 'donut' */
  view?: 'horizontal' | 'vertical' | 'donut';
  /** Afficher la transcription textuelle */
  show_transcript?: boolean;
  /** Titre pour les interventions supérieures */
  title_top_interventions?: string;
  /** Titre pour les interventions inférieures */
  title_bottom_interventions?: string;
  /** Titre pour les étapes */
  title_steps?: string;
  /** Région géographique */
  region?: string;
  /** Afficher le diagramme climatique */
  show_climate_diagram?: boolean;
  /** Données climatiques */
  climate_data?: ClimateData;
}

export interface Intervention {
  /** Identifiant unique de l'intervention */
  id: string;
  /** Jour relatif au début de l'étape (peut être négatif pour avant) */
  day: string | number;
  /** Nom de l'intervention */
  name: string;
  /** Type d'intervention: 'intervention_top' ou 'intervention_bottom' */
  type: 'intervention_top' | 'intervention_bottom';
  /** Description détaillée de l'intervention */
  description?: string;
  /** Icône associée (nom FontAwesome ou URL) */
  icon?: string;
  /** Couleur de l'intervention (hex) */
  color?: string;
}

export interface Step {
  /** Identifiant unique de l'étape */
  id: string;
  /** Nom de la culture/étape */
  name: string;
  /** Date de début (ISO 8601 string ou Date) */
  startDate: string | Date;
  /** Date de fin (ISO 8601 string ou Date) */
  endDate: string | Date;
  /** Couleur de l'étape (hex) */
  color?: string;
  /** Description de l'étape */
  description?: string;
  /** Liste des interventions */
  interventions?: Intervention[];
  /** Durée calculée en mois */
  duration?: number;
  /** Attributs personnalisés */
  attributes?: Record<string, string | number>;
}

export interface ItineraireData {
  /** Titre de la rotation */
  title: string;
  /** Options de configuration */
  options: ItineraireOptions;
  /** Liste des étapes de la rotation */
  steps: Step[];
}

export interface TimelineData extends Array<ItineraireData> {}

export type RotationData = ItineraireData | TimelineData;

/**
 * Props pour le composant TikaRenderer
 */
export interface TikaRendererProps {
  /** Données de l'itinéraire à afficher */
  data: RotationData;
  /** Largeur du conteneur */
  width?: string | number;
  /** Hauteur du conteneur */
  height?: string | number;
  /** Classes CSS additionnelles */
  className?: string;
  /** Callback lors du clic sur un élément */
  onItemClick?: (itemId: string, event: Event) => void;
  /** Callback lors du survol d'un élément */
  onItemHover?: (itemId: string, event: Event) => void;
}

/**
 * Props pour le composant TikaEditor
 */
export interface TikaEditorProps {
  /** Données initiales de l'itinéraire */
  initialData?: ItineraireData;
  /** Callback lors de la sauvegarde */
  onSave?: (data: ItineraireData) => void;
  /** Callback lors de l'export */
  onExport?: (data: ItineraireData) => void;
  /** Classes CSS additionnelles */
  className?: string;
  /** Afficher les boutons Wiki (si intégration avec Wiki) */
  showWikiButtons?: boolean;
  /** Activer la sauvegarde automatique */
  enableAutoSave?: boolean;
  /** Intervalle de sauvegarde automatique (ms) */
  autoSaveInterval?: number;
}

/**
 * Interface de la classe RotationRenderer (pour référence)
 */
export interface IRotationRenderer {
  data: RotationData;
  chart: any; // Type echarts
  render(): void;
  renderChart(): void;
  buildHTML(): string;
  highlightItem(id: string): void;
}

/**
 * Déclarations globales pour l'intégration avec le code existant
 */
declare global {
  interface Window {
    RotationRenderer: new (divID: string, data: RotationData) => IRotationRenderer;
    echarts: any;
    $: any;
    _: any;
    rotation_data?: ItineraireData;
    refreshAttributesTable?: () => void;
    refreshStepsButtonList?: () => void;
    refreshInterventionsList?: () => void;
    renderChart?: () => void;
    exportToJsonFile?: (data: ItineraireData, fileName?: string) => void;
    reactEditorSave?: () => void;
    reactEditorExport?: () => void;
  }
}

export {};
