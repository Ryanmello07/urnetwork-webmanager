import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, AlertCircle, Activity, Clock, Database, Search, DollarSign, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchProviderStats } from '../services/api';
import type { Provider } from '../services/api';
import toast from 'react-hot-toast';

const StatsSection: React.FC = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const loadStats = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchProviderStats(token);
      
      if (response.error) {
        setError(response.error.message);
        toast.error(response.error.message);
      } else {
        setStats(response.providers || []);
        setLastUpdated(response.created_time);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load statistics';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [token]);

  const calculateTotals = () => {
    return stats.reduce((acc, provider) => ({
      uptime: acc.uptime + provider.uptime_last_24h,
      transfer: acc.transfer + provider.transfer_data_last_24h,
      payout: acc.payout + provider.payout_last_24h,
      interest: acc.interest + provider.search_interest_last_24h,
      contracts: acc.contracts + provider.contracts_last_24h,
      clients: acc.clients + provider.clients_last_24h,
      activeProviders: acc.activeProviders + (provider.connected ? 1 : 0),
    }), {
      uptime: 0,
      transfer: 0,
      payout: 0,
      interest: 0,
      contracts: 0,
      clients: 0,
      activeProviders: 0,
    });
  };

  const totals = calculateTotals();

  const StatCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <div className="bg-blue-50 p-3 rounded-full">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="text-blue-600" />
            Provider Statistics
          </h2>
          <p className="text-gray-600 mt-1">
            Last updated: {new Date(lastUpdated).toLocaleString() || 'Never'}
          </p>
        </div>
        
        <button
          onClick={loadStats}
          disabled={isLoading}
          className="flex items-center gap-2 bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-md transition-colors self-start"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh Stats
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800">Error loading statistics</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Active Providers"
              value={totals.activeProviders}
              icon={Activity}
            />
            <StatCard
              title="Average Uptime"
              value={`${(totals.uptime / (stats.length || 1)).toFixed(1)}%`}
              icon={Clock}
            />
            <StatCard
              title="Total Data Transfer"
              value={`${(totals.transfer / 1024).toFixed(2)} GB`}
              icon={Database}
            />
            <StatCard
              title="Total Search Interest"
              value={totals.interest}
              icon={Search}
            />
            <StatCard
              title="Total Payout"
              value={`$${totals.payout.toFixed(2)}`}
              icon={DollarSign}
            />
            <StatCard
              title="Total Contracts"
              value={totals.contracts}
              icon={Users}
            />
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-800">Provider Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uptime</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transfer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payout</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contracts</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.map((provider) => (
                    <tr key={provider.client_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          provider.connected
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {provider.connected ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {provider.client_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {provider.uptime_last_24h.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(provider.transfer_data_last_24h / 1024).toFixed(2)} GB
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${provider.payout_last_24h.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {provider.search_interest_last_24h}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {provider.contracts_last_24h}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsSection;