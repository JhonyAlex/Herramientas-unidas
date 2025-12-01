import * as React from 'react';
import { ToolRegistryItem, ToolCategory } from './types.ts';
import AiDrafterTool from './modules/ai-drafter/AiDrafterTool.tsx';
import PigmeaTool from './modules/pigmea-maintenance/PigmeaTool.tsx';

// REGISTRO DE HERRAMIENTAS
// Aquí es donde se añaden nuevas herramientas para que aparezcan automáticamente en la app.
export const AVAILABLE_TOOLS: ToolRegistryItem[] = [
  {
    id: 'ai-drafter',
    name: 'Asistente de Redacción',
    description: 'Genera borradores de correos, reportes y documentos usando IA.',
    category: ToolCategory.AI,
    path: '/ai-drafter',
    icon: '✍️',
    component: <AiDrafterTool />
  },
  {
    id: 'pigmea-maintenance',
    name: 'Pigmea Mantenimiento',
    description: 'Dashboard de KPIs y generador de reportes diarios desde CSV.',
    category: ToolCategory.ANALYSIS,
    path: '/pigmea',
    icon: '🏭',
    component: <PigmeaTool />
  }
];