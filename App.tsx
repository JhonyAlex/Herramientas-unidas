import * as React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import { AVAILABLE_TOOLS } from './constants';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          {/* Ruta Principal: Dashboard */}
          <Route path="/" element={<Dashboard />} />

          {/* Rutas Dinámicas: Basadas en el registro de herramientas */}
          {AVAILABLE_TOOLS.map((tool) => (
            <Route 
              key={tool.id} 
              path={tool.path} 
              element={tool.component} 
            />
          ))}

          {/* Fallback para 404 */}
          <Route path="*" element={
            <div className="text-center py-20">
              <h1 className="text-4xl font-bold text-slate-300">404</h1>
              <p className="text-slate-500 mt-2">Herramienta no encontrada.</p>
              <a href="#/" className="text-blue-500 hover:underline mt-4 block">Volver al inicio</a>
            </div>
          } />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;