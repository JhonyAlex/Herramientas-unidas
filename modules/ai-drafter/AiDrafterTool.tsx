import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { StorageService } from '../../services/storageService.ts';
import { generateDraft } from './geminiService.ts';
import { HistoryItem } from '../../types.ts';

// Tipos específicos del módulo
interface DraftHistory extends HistoryItem {
  prompt: string;
  result: string;
}

const STORAGE_KEY = 'tool_ai_drafter_history';

const AiDrafterTool: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [tone, setTone] = useState('Profesional');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<DraftHistory[]>([]);

  // Cargar historial al montar
  useEffect(() => {
    setHistory(StorageService.getAll<DraftHistory>(STORAGE_KEY));
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const generatedText = await generateDraft({ prompt, context, tone });
      setResult(generatedText);

      // Guardar en historial
      const newItem: DraftHistory = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        prompt,
        result: generatedText
      };
      
      const updatedHistory = StorageService.add(STORAGE_KEY, newItem);
      setHistory(updatedHistory);
    } catch (error) {
      alert("Error al generar el texto. Verifica tu conexión o API Key.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (item: DraftHistory) => {
    setPrompt(item.prompt);
    setResult(item.result);
  };

  const clearHistory = () => {
    if(confirm('¿Borrar todo el historial de esta herramienta?')) {
        StorageService.clear(STORAGE_KEY);
        setHistory([]);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Panel Izquierdo: Configuración */}
      <div className="lg:col-span-1 space-y-6">
        <Card title="Configuración de Generación">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Instrucción Principal</label>
              <textarea
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent min-h-[100px]"
                placeholder="Ej: Redacta un correo para cancelar la reunión de mañana..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contexto Adicional (Opcional)</label>
              <textarea
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent min-h-[60px] text-sm"
                placeholder="Ej: El cliente es muy formal, mencionar que reprogramaremos."
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tono</label>
              <select
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option value="Profesional">Profesional Corporativo</option>
                <option value="Amable">Amable y Cercano</option>
                <option value="Directo">Directo y Conciso</option>
                <option value="Técnico">Técnico Detallado</option>
              </select>
            </div>

            <Button 
              className="w-full" 
              onClick={handleGenerate} 
              isLoading={isLoading}
              disabled={!prompt}
            >
              {isLoading ? 'Generando...' : 'Generar Borrador'}
            </Button>
          </div>
        </Card>

        <Card title="Historial Reciente" action={<button onClick={clearHistory} className="text-xs text-red-500 hover:underline">Borrar</button>}>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {history.length === 0 && <p className="text-sm text-slate-400 italic">Sin historial aún.</p>}
            {history.map((item) => (
              <div 
                key={item.id} 
                onClick={() => loadFromHistory(item)}
                className="p-3 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <p className="text-sm font-medium text-slate-700 line-clamp-2">{item.prompt}</p>
                <span className="text-xs text-slate-400 mt-1 block">
                  {new Date(item.timestamp).toLocaleDateString()} - {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Panel Derecho: Resultado */}
      <div className="lg:col-span-2 flex flex-col h-full">
        <Card title="Resultado Generado" className="flex-1 flex flex-col h-full">
            {result ? (
                <div className="h-full flex flex-col">
                    <div className="flex-1 p-4 bg-slate-50 rounded-lg border border-slate-200 overflow-auto whitespace-pre-wrap text-slate-800 leading-relaxed font-mono text-sm">
                        {result}
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <Button 
                            variant="secondary" 
                            onClick={() => navigator.clipboard.writeText(result)}
                        >
                            Copiar al Portapapeles
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-400 flex-col gap-3">
                    <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    <p>Configura los parámetros y genera un borrador.</p>
                </div>
            )}
        </Card>
      </div>
    </div>
  );
};

export default AiDrafterTool;