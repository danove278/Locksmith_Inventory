import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getAlerts } from '../api';
import { useAuth } from '../context/AuthContext';
import AlertBanner from './AlertBanner';

export default function Layout() {
  const [alerts, setAlerts] = useState([]);
  const { user, logout, isAdmin } = useAuth();

  const refreshAlerts = () => {
    getAlerts().then(setAlerts).catch(() => {});
  };

  useEffect(() => {
    refreshAlerts();
    const interval = setInterval(refreshAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-lg font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-600 hover:bg-gray-200'
    }`;

  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Inventario de Llaves</h1>
          <div className="flex items-center gap-2">
            {isAdmin && <NavLink to="/" className={linkClass}>Inventario</NavLink>}
            <NavLink to="/uso" className={linkClass}>Registro de Uso</NavLink>
            {isAdmin && <NavLink to="/usuarios" className={linkClass}>Usuarios</NavLink>}
            <span className="text-sm text-gray-500 ml-4">{user?.username}</span>
            <button onClick={logout} className="text-sm text-red-600 hover:underline ml-1">
              Salir
            </button>
          </div>
        </div>
      </nav>
      {alerts.length > 0 && <AlertBanner alerts={alerts} />}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet context={{ refreshAlerts }} />
      </main>
    </div>
  );
}
