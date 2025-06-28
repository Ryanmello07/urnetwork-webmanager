import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import AuthSection from './AuthSection';
import ClientsSection from './ClientsSection';
import StatsSection from './StatsSection';
import LeaderboardSection from './LeaderboardSection';
import ProvidersSection from './ProvidersSection';
import WalletStatsSection from './WalletStatsSection';

const Layout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'clients' | 'stats' | 'leaderboard' | 'providers' | 'wallet'>('clients');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {!isAuthenticated && <AuthSection />}
            {isAuthenticated && (
              <div className="space-y-6">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('clients')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'clients'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Clients
                    </button>
                    <button
                      onClick={() => setActiveTab('stats')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'stats'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Statistics
                    </button>
                    <button
                      onClick={() => setActiveTab('leaderboard')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'leaderboard'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Leaderboard
                    </button>
                    <button
                      onClick={() => setActiveTab('providers')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'providers'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Providers
                    </button>
                    <button
                      onClick={() => setActiveTab('wallet')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'wallet'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Wallet Stats
                    </button>
                  </nav>
                </div>
                {activeTab === 'clients' && <ClientsSection />}
                {activeTab === 'stats' && <StatsSection />}
                {activeTab === 'leaderboard' && <LeaderboardSection />}
                {activeTab === 'providers' && <ProvidersSection />}
                {activeTab === 'wallet' && <WalletStatsSection />}
              </div>
            )}
          </>
        )}
      </main>
      <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>URnetwork Client Manager, Preview Application</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;