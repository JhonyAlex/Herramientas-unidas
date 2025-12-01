import { ReactNode } from 'react';

// Categorías para organizar las herramientas
export enum ToolCategory {
  PRODUCTIVITY = 'Productividad',
  ANALYSIS = 'Análisis',
  AI = 'Inteligencia Artificial',
  UTILITIES = 'Utilidades',
}

// Definición de la estructura de una herramienta en el registro
export interface ToolRegistryItem {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  path: string;
  icon: string; // Emoji o nombre de icono
  component: ReactNode;
}

// Interfaz genérica para items guardados en historial
export interface HistoryItem {
  id: string;
  timestamp: number;
  [key: string]: any;
}