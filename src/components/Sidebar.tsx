// src/components/Sidebar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth'); // Redirige al usuario a la página de login tras cerrar sesión
  };

  return (
    <div className="flex h-screen flex-col justify-between border-e bg-white w-64">
      <div className="px-4 py-6">
        <span className="grid h-10 w-32 place-content-center rounded-lg bg-gray-100 text-xs text-gray-600">
          Tiender
        </span>

        <ul className="mt-6 space-y-1">
          <li>
            <Link
              to="/dashboard"
              className="block rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
            >
              Dashboard
            </Link>
          </li>

          <li>
            <Link
              to="/upgrade"
              className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              Gestionar Suscripción
            </Link>
          </li>
        </ul>
      </div>

      <div className="sticky inset-x-0 bottom-0 border-t border-gray-100">
        <div className="flex items-center gap-2 bg-white p-4 hover:bg-gray-50">
          <div>
            <p className="text-xs">
              <strong className="block font-medium">{user?.email || 'Usuario'}</strong>
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="ml-auto rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
