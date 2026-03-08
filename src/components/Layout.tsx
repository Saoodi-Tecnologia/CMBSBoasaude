import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, LogOut, CalendarDays } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
      localStorage.removeItem('isAuthenticated');
      navigate('/login');
    }
  };

  const tabs = [
    { name: 'Mapa', path: '/', icon: Calendar },
    { name: 'Mapa Mensal', path: '/monthly', icon: CalendarDays },
    { name: 'Cadastros', path: '/management', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-[50]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex h-full items-center">
              <div className="flex-shrink-0 flex items-center mr-4">
                <span className="text-lg md:text-xl font-bold text-brand-primary whitespace-nowrap">Mapa de Salas</span>
              </div>
              <nav className="flex space-x-2 md:space-x-8 h-full">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = location.pathname === tab.path;
                  return (
                    <Link
                      key={tab.name}
                      to={tab.path}
                      className={clsx(
                        isActive
                          ? 'border-brand-primary text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                        'inline-flex items-center px-2 md:px-1 pt-1 border-b-2 text-sm font-medium transition-all'
                      )}
                    >
                      <Icon className="w-5 h-5 md:w-4 md:h-4" />
                      <span className="hidden sm:inline ml-2">{tab.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="flex items-center text-sm font-medium text-red-500 hover:text-red-700 transition-colors p-2"
                title="Sair do sistema"
              >
                <LogOut className="w-5 h-5 md:w-4 md:h-4" />
                <span className="hidden sm:inline ml-1.5">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
