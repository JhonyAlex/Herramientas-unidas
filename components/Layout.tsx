import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AVAILABLE_TOOLS } from '../constants.tsx';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  // Encontrar la herramienta activa si no estamos en home
  const activeTool = AVAILABLE_TOOLS.find(t => t.path === location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight hover:text-blue-300 transition-colors">
              <span className="text-2xl">🛠️</span>
              Internal Hub
            </Link>
            {!isHome && activeTool && (
                <>
                    <span className="text-slate-500">/</span>
                    <span className="text-slate-300 flex items-center gap-2 text-sm bg-slate-800 px-3 py-1 rounded-full">
                        <span>{activeTool.icon}</span>
                        {activeTool.name}
                    </span>
                </>
            )}
          </div>
          
          <nav className="flex items-center gap-4">
            <a href="#" className="text-slate-400 hover:text-white text-sm">Documentación</a>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold border-2 border-slate-700">
                ME
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Internal Tools Hub. Arquitectura Modular.
        </div>
      </footer>
    </div>
  );
};

export default Layout;