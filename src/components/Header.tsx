import React from 'react';
import { LogOut, TerminalSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <TerminalSquare size={24} className="text-white" />
            <h1 className="text-xl font-bold">URnetwork Client Manager</h1>
          </div>
          
          {isAuthenticated && (
            <button
              onClick={logout}
              className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-md transition-colors duration-200"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;