import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Activity, Stethoscope, Clock, HeartPulse, LayoutGrid, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Cmbs2026*') {
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/');
    } else {
      setError('Senha incorreta. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden px-4 md:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-50 md:opacity-100">
        <Calendar className="absolute top-10 left-10 w-16 h-16 md:w-24 md:h-24 text-brand-primary/10" />
        <Users className="absolute top-20 right-20 w-24 h-24 md:w-32 md:h-32 text-brand-primary/10" />
        <Activity className="absolute bottom-10 left-1/4 w-16 h-16 md:w-20 md:h-20 text-brand-primary/10" />
        <Stethoscope className="absolute top-1/3 left-10 w-12 h-12 md:w-16 md:h-16 text-brand-primary/10 hidden md:block" />
        <Clock className="absolute bottom-20 right-10 w-20 h-20 md:w-28 md:h-28 text-brand-primary/10 hidden md:block" />
        <HeartPulse className="absolute top-1/2 right-1/4 w-10 h-10 md:w-12 md:h-12 text-brand-primary/10 hidden md:block" />
        <LayoutGrid className="absolute bottom-1/3 left-20 w-20 h-20 md:w-24 md:h-24 text-brand-primary/10 hidden md:block" />

        {/* More scattered icons for density */}
        <Calendar className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 text-brand-primary/5" />
      </div>

      <div className="max-w-md w-full space-y-6 md:space-y-8 bg-white/90 backdrop-blur-sm p-6 md:p-10 rounded-2xl shadow-2xl relative z-10 border border-white/50">
        <div className="text-center">
          <div className="text-xs md:text-sm font-black text-brand-primary uppercase tracking-[0.2em] mb-1">
            Boa Saúde
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Mapa de Salas
          </h2>
          <div className="h-1 w-12 md:w-16 bg-brand-primary mx-auto mt-4 rounded-full"></div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm">
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent focus:z-10 sm:text-sm transition-all duration-200 bg-gray-50 focus:bg-white pr-10"
                placeholder="Senha de acesso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none z-20"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-brand-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all duration-200 shadow-lg hover:shadow-brand-primary/30 transform hover:-translate-y-0.5"
            >
              Entrar no Sistema
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            Área restrita para gestão de escalas
          </p>
        </div>
      </div>
    </div>
  );
}
