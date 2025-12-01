import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Card } from '../../components/ui/Card.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { StorageService } from '../../services/storageService.ts';
import { PigmeaStats } from './types.ts';
import { processCsvData, generateReportText } from './logic.ts';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const STORAGE_KEY = 'pigmea_ot_history_v2';

const PigmeaTool: React.FC = () => {
  const [history, setHistory] = useState<PigmeaStats[]>([]);
  const [currentStats, setCurrentStats] = useState<PigmeaStats | null>(null);
  const [generatedReport, setGeneratedReport] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  
  // Referencia para el input de importación de backup
  const backupInputRef = useRef<HTMLInputElement>(null);

  // --- Carga Inicial ---
  useEffect(() => {
    const data = StorageService.getAll<PigmeaStats>(STORAGE_KEY);
    // Ordenar por fecha descendente
    data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setHistory(data);
  }, []);

  // --- Handlers ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    e.preventDefault();
    let file: File | undefined;

    if ('dataTransfer' in e) {
        file = e.dataTransfer.files[0];
    } else {
        file = (e.target as HTMLInputElement).files?.[0];
    }

    if (!file) return;
    setFileName(file.name);
    setIsProcessing(true);

    try {
      const stats = await processCsvData(file);
      setCurrentStats(stats);
      setGeneratedReport(generateReportText(stats));
    } catch (error) {
      alert("Error procesando el CSV. Asegúrate de que es el formato correcto de Primavera.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToHistory = () => {
    if (!currentStats) return;
    
    // Si ya existe un registro para hoy, lo reemplazamos (filter out old)
    const newHistory = StorageService.add(STORAGE_KEY, currentStats);
    // Filtrar duplicados por fecha, manteniendo el más reciente
    const uniqueHistory = newHistory.filter((v, i, a) => a.findIndex(t => t.date === v.date) === i);
    
    // Guardar la versión limpia
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueHistory));
    
    // Reordenar para visualización
    uniqueHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setHistory(uniqueHistory);
    alert('Datos guardados correctamente en el historial.');
  };

  const deleteHistoryItem = (id: string) => {
    if(confirm('¿Borrar este registro?')) {
        const updated = StorageService.remove<PigmeaStats>(STORAGE_KEY, id);
        updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setHistory(updated);
    }
  };

  // --- CSV Export (Reporte) ---
  const exportCsv = () => {
    if (history.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Fecha,Pendientes,Atrasados,En Espera,En Curso,Terminadas,Calidad Miguel (Faltantes)\n";
    history.forEach(row => {
        const missing = row.miguelMissingIds ? row.miguelMissingIds.join(" ") : "";
        csvContent += `${row.date},${row.pendientes},${row.atrasados},${row.espera},${row.enCurso},${row.terminadas},"${missing}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "historial_pigmea.csv");
    document.body.appendChild(link);
    link.click();
  };

  // --- Backup System (JSON) ---
  const handleExportBackup = () => {
    if (history.length === 0) {
        alert("No hay datos para respaldar.");
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "pigmea_backup_" + new Date().toISOString().slice(0,10) + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportBackupTrigger = () => {
    backupInputRef.current?.click();
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const jsonString = event.target?.result as string;
            const parsedData = JSON.parse(jsonString);
            
            // Validación básica simple
            if (!Array.isArray(parsedData)) {
                throw new Error("Formato inválido: No es un array");
            }

            if (confirm(`Se han encontrado ${parsedData.length} registros en el backup. ¿Deseas reemplazar tu historial actual con estos datos?`)) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
                parsedData.sort((a: PigmeaStats, b: PigmeaStats) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setHistory(parsedData);
                alert("Backup restaurado con éxito.");
            }
        } catch (error) {
            console.error(error);
            alert("Error al importar: El archivo no es un backup válido de Pigmea.");
        } finally {
            // Limpiar input para permitir re-subir el mismo archivo si falla
            if (backupInputRef.current) backupInputRef.current.value = '';
        }
    };
    reader.readAsText(file);
  };

  // --- Chart Data Prep ---
  // Tomamos los últimos 30 días y los ordenamos cronológicamente (oldest -> newest) para la gráfica
  const chartData = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-30);
  const labels = chartData.map(d => {
     const date = new Date(d.date);
     return `${date.getDate()}/${date.getMonth() + 1}`;
  });

  const backlogChartData = {
    labels,
    datasets: [
      {
        label: 'Pendientes Totales',
        data: chartData.map(d => d.pendientes),
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F6',
        tension: 0.3,
      },
      {
        label: 'Atrasados Críticos',
        data: chartData.map(d => d.atrasados),
        borderColor: '#EF4444',
        backgroundColor: '#EF4444',
        borderDash: [5, 5],
        tension: 0.3,
      },
    ],
  };

  const flowChartData = {
    labels,
    datasets: [
      {
        label: 'Trabajos Terminados',
        data: chartData.map(d => d.terminadas),
        backgroundColor: '#10B981',
        borderRadius: 4,
      },
      {
        label: 'Nuevas Solicitudes (Entrada)',
        data: chartData.map(d => d.nuevos),
        backgroundColor: '#9CA3AF',
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="space-y-8">
      {/* Input oculto para backup */}
      <input 
        type="file" 
        ref={backupInputRef} 
        onChange={handleImportBackupFile} 
        accept=".json" 
        className="hidden" 
      />

      {/* HEADER ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800">Dashboard Mantenimiento</h2>
        <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleImportBackupTrigger}>
               📥 Importar Backup
            </Button>
            <Button variant="secondary" onClick={handleExportBackup} disabled={history.length === 0}>
               📤 Exportar Backup
            </Button>
            <div className="w-px bg-slate-300 mx-2 h-8 hidden md:block"></div>
            <Button variant="outline" onClick={exportCsv} disabled={history.length === 0}>
                Reporte CSV
            </Button>
            <Button variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => { if(confirm('¡ATENCIÓN! Esto borrará todos los datos locales. ¿Estás seguro?')) { StorageService.clear(STORAGE_KEY); setHistory([]); } }}>
                Borrar Todo
            </Button>
        </div>
      </div>

      {/* KPI & GRAPHS */}
      {history.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          <Card title="Tendencia de Backlog">
             <div className="h-64">
                <Line data={backlogChartData} options={{ responsive: true, maintainAspectRatio: false }} />
             </div>
          </Card>
          <Card title="Flujo de Trabajo (Velocidad)">
             <div className="h-64">
                <Bar data={flowChartData} options={{ responsive: true, maintainAspectRatio: false }} />
             </div>
          </Card>
        </div>
      )}

      {/* OPERATIONAL AREA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Upload Zone */}
        <div className="md:col-span-1">
            <Card title="Cargar CSV Diario" className="h-full">
                <div 
                    className="h-48 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer hover:border-green-500 hover:bg-green-50 relative group"
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-green-500', 'bg-green-50'); }}
                    onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-green-500', 'bg-green-50'); }}
                    onDrop={(e) => { e.currentTarget.classList.remove('border-green-500', 'bg-green-50'); handleFileUpload(e); }}
                >
                    <input 
                        type="file" 
                        accept=".csv" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={handleFileUpload}
                    />
                    <div className="space-y-3 pointer-events-none">
                        <span className="text-4xl">📂</span>
                        <p className="text-sm text-slate-600 font-medium">{fileName || "Arrastra CSV aquí"}</p>
                        <p className="text-xs text-slate-400">Formato Primavera (.csv)</p>
                    </div>
                </div>
            </Card>
        </div>

        {/* Report Output */}
        <div className="md:col-span-2 flex flex-col h-full">
            <Card title="Generador de Reporte" className="flex-1 flex flex-col">
                <textarea 
                    className="w-full h-40 p-4 bg-slate-900 text-green-400 font-mono text-sm rounded-lg resize-none focus:outline-none mb-4"
                    readOnly
                    placeholder="El reporte generado aparecerá aquí..."
                    value={generatedReport}
                />
                <div className="flex gap-4">
                    <Button 
                        disabled={!generatedReport} 
                        onClick={() => navigator.clipboard.writeText(generatedReport)}
                        className="flex-1"
                    >
                        Copiar Texto
                    </Button>
                    <Button 
                        disabled={!currentStats} 
                        variant="primary"
                        onClick={saveToHistory}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                        Guardar en Dashboard
                    </Button>
                </div>
            </Card>
        </div>
      </div>

      {/* HISTORY TABLE */}
      <Card title="Historial de Registros">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                    <tr>
                        <th className="px-6 py-3">Fecha</th>
                        <th className="px-6 py-3 text-center">Pendientes</th>
                        <th className="px-6 py-3 text-center">Atrasados</th>
                        <th className="px-6 py-3 text-center">Terminadas</th>
                        <th className="px-6 py-3 text-center">Calidad</th>
                        <th className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {history.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-4 text-center text-slate-400">No hay datos.</td></tr>
                    ) : (
                        history.map(row => (
                            <tr key={row.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">{row.date}</td>
                                <td className="px-6 py-4 text-center">{row.pendientes}</td>
                                <td className="px-6 py-4 text-center text-red-600 font-semibold">{row.atrasados}</td>
                                <td className="px-6 py-4 text-center text-green-600 font-semibold">{row.terminadas}</td>
                                <td className="px-6 py-4 text-center">
                                    {row.miguelOk ? 
                                        <span className="text-green-600 font-bold">OK</span> : 
                                        <span className="text-red-500 font-bold">Revisar</span>
                                    }
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => deleteHistoryItem(row.id)} className="text-red-400 hover:text-red-600">
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </Card>
    </div>
  );
};

export default PigmeaTool;