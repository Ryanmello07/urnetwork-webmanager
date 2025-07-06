import React, { useState } from 'react';
import { KeyRound, Shield, Lock } from 'lucide-react';

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
      <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all hover:shadow-3xl border border-gray-700">
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 py-8 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full border border-white/30">
                <KeyRound size={32} className="text-white" />
              </div>
            </div>
            <h2 className="text-white text-center text-2xl font-bold mb-2">Secure Authentication</h2>
            <p className="text-blue-100 text-center text-sm">
              Enter your authentication code to access the urnetwork client management dashboard
            </p>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-4 right-4 opacity-20">
            <Shield size={24} className="text-white" />
          </div>
          <div className="absolute bottom-4 left-4 opacity-20">
            <Lock size={20} className="text-white" />
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 bg-gray-800">
          <div className="mb-6">
            <label htmlFor="authCode" className="block text-sm font-medium text-gray-300 mb-2">
              Authentication Code
            </label>
            <input
              id="authCode"
              type="text"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white placeholder-gray-400"
              placeholder="Enter your one time auth code"
              disabled={isLoading}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !authCode.trim()}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 transform ${
              isLoading || !authCode.trim() 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </span>
            ) : (
              'Access Dashboard'
            )}
          </button>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Preview Application • Data Locally Stored
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthSection;