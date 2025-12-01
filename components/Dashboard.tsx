import * as React from 'react';
import { Link } from 'react-router-dom';
import { AVAILABLE_TOOLS } from '../constants';
import { Card } from './ui/Card';
import { ToolCategory } from '../types';

const Dashboard: React.FC = () => {
  // Agrupar herramientas por categoría
  const groupedTools = AVAILABLE_TOOLS.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<ToolCategory, typeof AVAILABLE_TOOLS>);

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Bienvenido a tu Workspace</h1>
        <p className="text-slate-500 mt-2">Selecciona una herramienta para comenzar a trabajar.</p>
      </div>

      {Object.entries(groupedTools).map(([category, tools]) => (
        <section key={category}>
          <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-accent rounded-full inline-block"></span>
            {category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <Link key={tool.id} to={tool.path} className="block group h-full">
                <Card className="h-full hover:shadow-md hover:border-blue-300 transition-all duration-200 group-hover:-translate-y-1">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {tool.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {AVAILABLE_TOOLS.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-400">No hay herramientas configuradas en <code>constants.tsx</code></p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;