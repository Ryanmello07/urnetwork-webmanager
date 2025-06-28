import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Wallet, RefreshCw, AlertCircle, Settings, Clock, TrendingUp, Database, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchWalletStats } from '../services/api';
import type { WalletStatsEntry } from '../services/api';
import toast from 'react-hot-toast';

const WalletStatsSection: React.FC = () => {
  const { token } = useAuth();
  const [currentStats, setCurrentStats] = useState({ paid_mb: 0, unpaid_mb: 0 });
  const [statsHistory, setStatsHistory] = useState<WalletStatsEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [refreshInterval, setRefreshInterval] = useState(5); // minutes
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const bytesToMB = (bytes: number) => bytes / (1024 * 1024);

  const loadWalletStats = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchWalletStats(token);
      
      if (response.error) {
        setError(response.error.message);
        toast.error(response.error.message);
      } else {
        const paidMB = bytesToMB(response.paid_bytes_provided);
        const unpaidMB = bytesToMB(response.unpaid_bytes_provided);
        
        setCurrentStats({ paid_mb: paidMB, unpaid_mb: unpaidMB });
        
        // Add to history
        const newEntry: WalletStatsEntry = {
          timestamp: new Date().toISOString(),
          paid_mb: paidMB,
          unpaid_mb: unpaidMB,
        };
        
        setStatsHistory(prev => {
          const updated = [...prev, newEntry];
          // Keep only last 100 entries to prevent memory issues
          return updated.slice(-100);
        });
        
        setLastUpdated(new Date().toISOString());
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load wallet stats';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Setup automatic refresh
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Initial load
    loadWalletStats();

    // Setup interval
    intervalRef.current = setInterval(() => {
      loadWalletStats();
    }, refreshInterval * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadWalletStats, refreshInterval]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const getTimezoneOptions = () => {
    return [
      'UTC',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Kolkata',
      'Australia/Sydney',
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ].filter((tz, index, arr) => arr.indexOf(tz) === index);
  };

  const StatCard = ({ title, value, icon: Icon, color }: { 
    title: string; 
    value: string; 
    icon: React.ElementType; 
    color: string;
  }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-full`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const SimpleChart = ({ data }: { data: WalletStatsEntry[] }) => {
    if (data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => Math.max(d.paid_mb, d.unpaid_mb)));
    const chartHeight = 200;

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Data Transfer History</h3>
        <div className="relative" style={{ height: chartHeight }}>
          <svg width="100%" height={chartHeight} className="overflow-visible">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1="0"
                y1={chartHeight * ratio}
                x2="100%"
                y2={chartHeight * ratio}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}
            
            {/* Data lines */}
            {data.length > 1 && (
              <>
                {/* Paid MB line */}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  points={data.map((d, i) => 
                    `${(i / (data.length - 1)) * 100}%,${chartHeight - (d.paid_mb / maxValue) * chartHeight}`
                  ).join(' ')}
                />
                
                {/* Unpaid MB line */}
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  points={data.map((d, i) => 
                    `${(i / (data.length - 1)) * 100}%,${chartHeight - (d.unpaid_mb / maxValue) * chartHeight}`
                  ).join(' ')}
                />
              </>
            )}
            
            {/* Data points */}
            {data.map((d, i) => (
              <g key={i}>
                <circle
                  cx={`${(i / (data.length - 1)) * 100}%`}
                  cy={chartHeight - (d.paid_mb / maxValue) * chartHeight}
                  r="3"
                  fill="#10b981"
                />
                <circle
                  cx={`${(i / (data.length - 1)) * 100}%`}
                  cy={chartHeight - (d.unpaid_mb / maxValue) * chartHeight}
                  r="3"
                  fill="#f59e0b"
                />
              </g>
            ))}
          </svg>
          
          {/* Legend */}
          <div className="flex justify-center mt-4 space-x-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Paid MB</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Unpaid MB</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Wallet className="text-green-600" />
            Wallet Statistics
          </h2>
          <p className="text-gray-600 mt-1">
            Real-time tracking of data transfer earnings
          </p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {formatDateTime(lastUpdated)}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-md transition-colors"
          >
            <Settings size={16} />
            Settings
          </button>
          
          <button
            onClick={loadWalletStats}
            disabled={isLoading}
            className="flex items-center gap-2 bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded-md transition-colors"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refresh Interval (minutes)
              </label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value={1}>1 minute</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {getTimezoneOptions().map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800">Error loading wallet stats</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {isLoading && statsHistory.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Current Paid Data"
              value={`${currentStats.paid_mb.toFixed(2)} MB`}
              icon={DollarSign}
              color="bg-green-500"
            />
            <StatCard
              title="Current Unpaid Data"
              value={`${currentStats.unpaid_mb.toFixed(2)} MB`}
              icon={Clock}
              color="bg-yellow-500"
            />
            <StatCard
              title="Total Data"
              value={`${(currentStats.paid_mb + currentStats.unpaid_mb).toFixed(2)} MB`}
              icon={Database}
              color="bg-blue-500"
            />
            <StatCard
              title="Data Points"
              value={statsHistory.length.toString()}
              icon={TrendingUp}
              color="bg-purple-500"
            />
          </div>

          <SimpleChart data={statsHistory} />

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-800">History Timeline</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid MB
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unpaid MB
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total MB
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {statsHistory.slice().reverse().map((entry, index) => (
                    <tr key={index} className={index === 0 ? 'bg-green-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(entry.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.paid_mb.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.unpaid_mb.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {(entry.paid_mb + entry.unpaid_mb).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {statsHistory.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 italic">No data collected yet. Data will appear after the first API call.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletStatsSection;