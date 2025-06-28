import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const AuthSection: React.FC = () => {
  const [authCode, setAuthCode] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authCode.trim()) {
      await login(authCode.trim());
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all hover:shadow-xl">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 py-6 px-6">
          <div className="flex justify-center">
            <div className="bg-white/20 p-3 rounded-full">
              <KeyRound size={32} className="text-white" />
            </div>
          </div>
          <h2 className="text-white text-center text-2xl font-bold mt-4">Authentication Required</h2>
          <p className="text-blue-100 text-center mt-1">
            Enter your authentication code to access client management
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="authCode" className="block text-sm font-medium text-gray-700 mb-1">
              Authentication Code
            </label>
            <input
              id="authCode"
              type="text"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your auth code"
              disabled={isLoading}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !authCode.trim()}
            className={`w-full py-2 px-4 rounded-md font-medium text-white transition-all duration-200 
              ${isLoading || !authCode.trim() 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                  <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </span>
            ) : (
              'Authenticate'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthSection;