import { HistoryItem } from '../../types';

export interface CsvRow {
  "Estado": string;
  "Fecha (Europe/Madrid +01:00)": string;
  "Fecha de Fin de SLA (Europe/Madrid +01:00)": string;
  "Observaciones": string;
  "Orden de Trabajo": string;
  [key: string]: string;
}

export interface PigmeaStats extends HistoryItem {
  date: string; // YYYY-MM-DD
  pendientes: number;
  atrasados: number;
  espera: number;
  enCurso: number;
  terminadas: number;
  nuevos: number;
  rangoAtrasados: string; // Texto descriptivo
  miguelOk: boolean;
  miguelMissingIds: string[];
  prevDayName: string; // "ayer" o "viernes"
}