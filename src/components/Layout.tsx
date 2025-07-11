import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import AuthSection from './AuthSection';
import ClientsSection from './ClientsSection';
import StatsSection from './StatsSection';
import LeaderboardSection from './LeaderboardSection';
import ProvidersSection from './ProvidersSection';
import WalletStatsSection from './WalletStatsSection';
import { ChevronDown } from 'lucide-react';

const Layout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'clients' | 'stats' | 'leaderboard' | 'providers' | 'wallet'>('clients');
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const tabs = [
    { id: 'clients', label: 'Clients', color: 'blue' },
    { id: 'stats', label: 'Statistics', color: 'green' },
    { id: 'leaderboard', label: 'Leaderboard', color: 'yellow' },
    { id: 'providers', label: 'Providers', color: 'purple' },
    { id: 'wallet', label: 'Wallet Stats', color: 'indigo' },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as any);
    setShowMobileMenu(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-700 border-t-blue-500"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse"></div>
            </div>
          </div>
        ) : (
          <>
            {!isAuthenticated && <AuthSection />}
            {isAuthenticated && (
              <div className="space-y-8">
                <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl">
                  {isMobile ? (
                    <div className="p-2">
                      <div className="relative">
                        <button
                          onClick={() => setShowMobileMenu(!showMobileMenu)}
                          className={`w-full flex items-center justify-between py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 bg-gradient-to-r from-${activeTabData?.color}-600 to-${activeTabData?.color}-500 text-white shadow-lg`}
                        >
                          <span>{activeTabData?.label}</span>
                          <ChevronDown 
                            size={16} 
                            className={`transition-transform duration-200 ${showMobileMenu ? 'rotate-180' : ''}`}
                          />
                        </button>
                        
                        {showMobileMenu && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 animate-fadeIn">
                            {tabs.map((tab) => (
                              <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`w-full text-left py-3 px-4 text-sm transition-all duration-200 first:rounded-t-lg last:rounded-b-lg ${
                                  activeTab === tab.id
                                    ? `bg-gradient-to-r from-${tab.color}-600 to-${tab.color}-500 text-white`
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <nav className="flex space-x-1 p-2">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                            activeTab === tab.id
                              ? `bg-gradient-to-r from-${tab.color}-600 to-${tab.color}-500 text-white shadow-lg transform scale-105`
                              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                  )}
                </div>
                
                <div className="animate-fadeIn">
                  {activeTab === 'clients' && <ClientsSection />}
                  {activeTab === 'stats' && <StatsSection />}
                  {activeTab === 'leaderboard' && <LeaderboardSection />}
                  {activeTab === 'providers' && <ProvidersSection />}
                  {activeTab === 'wallet' && <WalletStatsSection />}
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <footer className="bg-gray-800 border-t border-gray-700 text-gray-300 py-6">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-sm font-medium">URnetwork Client Manager</p>
          </div>
          <p className="text-xs text-gray-500">Advanced Network Management • Preview Application</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;