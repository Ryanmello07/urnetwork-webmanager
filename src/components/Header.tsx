import React from 'react';
import { LogOut, TerminalSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white shadow-2xl border-b border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
              <TerminalSquare size={20} className="text-white md:w-6 md:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent truncate">
                URnetwork Client Manager
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">Advanced Network Management</p>
            </div>
          </div>
          
          {isAuthenticated && (
            <button
              onClick={logout}
              className="flex items-center space-x-1 md:space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-3 md:px-4 py-2 rounded-lg transition-all duration-200 border border-gray-600 hover:border-gray-500 shadow-lg hover:shadow-xl flex-shrink-0"
            >
              <LogOut size={14} className="md:w-4 md:h-4" />
              <span className="text-sm md:text-base">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;