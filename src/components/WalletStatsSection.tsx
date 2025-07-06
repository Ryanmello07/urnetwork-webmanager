import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Wallet, RefreshCw, AlertCircle, Settings, Clock, TrendingUp, Database, DollarSign, User, Trash2, AlertTriangle, HardDrive, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchWalletStats, fetchNetworkUser } from '../services/api';
import { saveWalletStats, getWalletStatsHistory, clearWalletStatsHistory, getStorageInfo, type WalletStatsRecord } from '../services/localStorage';
import type { NetworkUser } from '../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';

const WalletStatsSection: React.FC = () => {
  const { token } = useAuth();
  const [currentStats, setCurrentStats] = useState({ paid_mb: 0, unpaid_mb: 0 });
  const [statsHistory, setStatsHistory] = useState<WalletStatsRecord[]>([]);
  const [networkUser, setNetworkUser] = useState<NetworkUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [refreshInterval, setRefreshInterval] = useState(5); // minutes
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [showSettings, setShowSettings] = useState(false);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ totalRecords: 0, storageSize: '0 KB' });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const bytesToMB = (bytes: number) => bytes / (1048576);

  // Format bytes to appropriate unit (MB, GB, TB)
  const formatBytes = (bytes: number): string => {
    const mb = bytes / (1048576);
    const gb = mb / 1024;
    const tb = gb / 1024;

    if (tb >= 1) {
      return `${tb.toFixed(2)} TB`;
    } else if (gb >= 1) {
      return `${gb.toFixed(2)} GB`;
    } else {
      return `${mb.toFixed(2)} MB`;
    }
  };

  // Format MB value to appropriate unit
  const formatMBValue = (mb: number): string => {
    const gb = mb / 1024;
    const tb = gb / 1024;

    if (tb >= 1) {
      return `${tb.toFixed(2)} TB`;
    } else if (gb >= 1) {
      return `${gb.toFixed(2)} GB`;
    } else {
      return `${mb.toFixed(2)} MB`;
    }
  };

  // Update storage info
  const updateStorageInfo = useCallback(() => {
    const info = getStorageInfo();
    setStorageInfo(info);
  }, []);

  // Load network user info
  const loadNetworkUser = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetchNetworkUser(token);
      
      if (response.error) {
        console.error('Failed to fetch network user:', response.error.message);
        toast.error('Failed to fetch user information');
      } else if (response.network_user) {
        setNetworkUser(response.network_user);
      }
    } catch (err) {
      console.error('Error fetching network user:', err);
    }
  }, [token]);

  // Load wallet stats history from localStorage
  const loadStatsHistory = useCallback(async () => {
    if (!networkUser?.user_id) return;
    
    try {
      const { data, error } = await getWalletStatsHistory(networkUser.user_id, 100);
      
      if (error) {
        console.error('Error loading stats history:', error);
      } else if (data) {
        setStatsHistory(data);
        updateStorageInfo();
        
        // Set current stats from the latest entry
        if (data.length > 0) {
          const latest = data[0];
          setCurrentStats({
            paid_mb: bytesToMB(latest.paid_bytes_provided),
            unpaid_mb: bytesToMB(latest.unpaid_bytes_provided),
          });
        }
      }
    } catch (err) {
      console.error('Error loading stats history:', err);
    }
  }, [networkUser?.user_id, updateStorageInfo]);

  // Fetch wallet stats from API and save to localStorage
  const loadWalletStats = useCallback(async (showToast = true) => {
    if (!token || !networkUser?.network_name || !networkUser?.user_id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchWalletStats(token);
      
      if (response.error) {
        setError(response.error.message);
        if (showToast) {
          toast.error(response.error.message);
        }
      } else {
        const paidMB = bytesToMB(response.paid_bytes_provided);
        const unpaidMB = bytesToMB(response.unpaid_bytes_provided);
        
        setCurrentStats({ paid_mb: paidMB, unpaid_mb: unpaidMB });
        setLastUpdated(new Date().toISOString());
        
        // Save to localStorage using the user ID and network name from networkUser
        const { error: saveError } = await saveWalletStats(
          networkUser.user_id,
          networkUser.network_name,
          response.paid_bytes_provided,
          response.unpaid_bytes_provided
        );
        
        if (saveError) {
          console.error('Error saving wallet stats:', saveError);
          if (showToast) {
            toast.error('Failed to save stats to localStorage');
          }
        } else {
          // Reload history to include the new entry
          await loadStatsHistory();
          if (showToast) {
            toast.success('Wallet stats updated successfully');
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load wallet stats';
      setError(message);
      if (showToast) {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, networkUser?.network_name, networkUser?.user_id, loadStatsHistory]);

  // Clear wallet stats history
  const handleClearHistory = async () => {
    if (!networkUser?.user_id) return;
    
    setIsClearing(true);
    try {
      const { success, error } = await clearWalletStatsHistory(networkUser.user_id);
      
      if (error || !success) {
        toast.error('Failed to clear history');
        console.error('Error clearing history:', error);
      } else {
        setStatsHistory([]);
        setCurrentStats({ paid_mb: 0, unpaid_mb: 0 });
        updateStorageInfo();
        toast.success('History cleared successfully');
      }
    } catch (err) {
      console.error('Error clearing history:', err);
      toast.error('Failed to clear history');
    } finally {
      setIsClearing(false);
      setShowClearModal(false);
    }
  };

  // Setup automatic refresh
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (isAutoRefreshEnabled && networkUser?.network_name && networkUser?.user_id) {
      // Initial load
      loadWalletStats(false);

      // Setup interval
      intervalRef.current = setInterval(() => {
        loadWalletStats(false);
      }, refreshInterval * 60 * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadWalletStats, refreshInterval, isAutoRefreshEnabled, networkUser?.network_name, networkUser?.user_id]);

  // Load network user on component mount
  useEffect(() => {
    loadNetworkUser();
  }, [loadNetworkUser]);

  // Load stats history when networkUser is available
  useEffect(() => {
    if (networkUser?.user_id) {
      loadStatsHistory();
    }
  }, [loadStatsHistory, networkUser?.user_id]);

  // Update storage info on mount
  useEffect(() => {
    updateStorageInfo();
  }, [updateStorageInfo]);

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

  const StatCard = ({ title, value, icon: Icon, gradient }: { 
    title: string; 
    value: string; 
    icon: React.ElementType; 
    gradient: string;
  }) => (
    <div className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-semibold mt-1 text-white">{value}</p>
        </div>
        <div className={`${gradient} p-3 rounded-xl shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const formatValue = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}GB`;
    }
    return `${value.toFixed(1)}MB`;
  };

  const Chart = ({ data, title, dataKey, color }: { 
    data: WalletStatsRecord[]; 
    title: string; 
    dataKey: 'paid_bytes_provided' | 'unpaid_bytes_provided';
    color: string;
  }) => {
    if (data.length === 0) return null;

    const chartData = [...data].reverse();
    const values = chartData.map(d => bytesToMB(d[dataKey]));
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values);
    const range = maxValue - minValue;
    const padding = range > 0 ? range * 0.1 : maxValue * 0.1;
    const chartMax = maxValue + padding;
    const chartMin = Math.max(0, minValue - padding);
    const chartRange = chartMax - chartMin || 1;

    const leftPadding = 80;
    const rightPadding = 30;
    const topPadding = 30;
    const bottomPadding = 80;

    const yAxisSteps = 5;
    const yAxisLabels = [];
    for (let i = 0; i <= yAxisSteps; i++) {
      const value = chartMin + (chartRange * i / yAxisSteps);
      yAxisLabels.push(value);
    }

    const maxXLabels = Math.min(5, chartData.length);
    const xAxisIndices = [];
    if (chartData.length <= maxXLabels) {
      for (let i = 0; i < chartData.length; i++) {
        xAxisIndices.push(i);
      }
    } else {
      for (let i = 0; i < maxXLabels; i++) {
        const index = Math.floor((i / (maxXLabels - 1)) * (chartData.length - 1));
        xAxisIndices.push(index);
      }
    }

    return (
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 h-full border border-gray-700">
        <h3 className="text-lg font-medium text-gray-100 mb-6">{title}</h3>
        <div className="w-full h-80">
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 600 320"
            preserveAspectRatio="xMidYMid meet"
            className="border border-gray-600 rounded bg-gray-900"
          >
            <defs>
              <clipPath id={`plotArea-${dataKey}`}>
                <rect 
                  x={leftPadding} 
                  y={topPadding} 
                  width={600 - leftPadding - rightPadding} 
                  height={320 - topPadding - bottomPadding} 
                />
              </clipPath>
              <linearGradient id={`gradient-${dataKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
                <stop offset="100%" stopColor={color} stopOpacity="0.1"/>
              </linearGradient>
            </defs>
            
            <rect 
              x={leftPadding} 
              y={topPadding} 
              width={600 - leftPadding - rightPadding} 
              height={320 - topPadding - bottomPadding} 
              fill="url(#gradient-${dataKey})" 
              stroke="#374151" 
              strokeWidth="1"
            />
            
            {yAxisLabels.map((value, i) => {
              const y = topPadding + (320 - topPadding - bottomPadding) - (i / yAxisSteps) * (320 - topPadding - bottomPadding);
              return (
                <g key={i}>
                  <line
                    x1={leftPadding}
                    y1={y}
                    x2={600 - rightPadding}
                    y2={y}
                    stroke="#4b5563"
                    strokeWidth="1"
                  />
                  <text
                    x={leftPadding - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs fill-gray-400"
                    fontSize="11"
                  >
                    {formatValue(value)}
                  </text>
                </g>
              );
            })}
            
            {xAxisIndices.map((dataIndex) => {
              const x = leftPadding + (dataIndex / Math.max(1, chartData.length - 1)) * (600 - leftPadding - rightPadding);
              return (
                <line
                  key={dataIndex}
                  x1={x}
                  y1={topPadding}
                  x2={x}
                  y2={320 - bottomPadding}
                  stroke="#4b5563"
                  strokeWidth="1"
                />
              );
            })}
            
            {chartData.length > 1 && (
              <polyline
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                clipPath={`url(#plotArea-${dataKey})`}
                points={chartData.map((d, i) => {
                  const x = leftPadding + (i / Math.max(1, chartData.length - 1)) * (600 - leftPadding - rightPadding);
                  const value = bytesToMB(d[dataKey]);
                  const y = topPadding + (320 - topPadding - bottomPadding) - ((value - chartMin) / chartRange) * (320 - topPadding - bottomPadding);
                  return `${x},${y}`;
                }).join(' ')}
              />
            )}
            
            {chartData.map((d, i) => {
              const x = leftPadding + (i / Math.max(1, chartData.length - 1)) * (600 - leftPadding - rightPadding);
              const value = bytesToMB(d[dataKey]);
              const y = topPadding + (320 - topPadding - bottomPadding) - ((value - chartMin) / chartRange) * (320 - topPadding - bottomPadding);
              
              return (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={y}
                    r="5"
                    fill={color}
                    stroke="#1f2937"
                    strokeWidth="2"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="10"
                    fill="transparent"
                    className="cursor-pointer"
                  >
                    <title>{`${formatValue(value)} at ${formatDateTime(d.created_at)}`}</title>
                  </circle>
                </g>
              );
            })}
            
            {xAxisIndices.map((dataIndex) => {
              const d = chartData[dataIndex];
              const x = leftPadding + (dataIndex / Math.max(1, chartData.length - 1)) * (600 - leftPadding - rightPadding);
              const date = new Date(d.created_at);
              const label = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              
              return (
                <text
                  key={dataIndex}
                  x={x}
                  y={320 - bottomPadding + 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-400"
                  fontSize="10"
                >
                  {label}
                </text>
              );
            })}
            
            <text
              x={20}
              y={160}
              textAnchor="middle"
              className="text-xs fill-gray-300 font-medium"
              fontSize="11"
              transform="rotate(-90, 20, 160)"
            >
              Data Transfer (MB)
            </text>
            
            <text
              x={300}
              y={310}
              textAnchor="middle"
              className="text-xs fill-gray-300 font-medium"
              fontSize="11"
            >
              Time
            </text>
          </svg>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl">
                <Wallet className="text-white" size={28} />
              </div>
              Wallet Statistics
            </h2>
            <p className="text-gray-400 mt-2">
              Real-time tracking of data transfer earnings (stored locally)
            </p>
            {networkUser && (
              <div className="flex items-center gap-2 mt-3">
                <User size={16} className="text-blue-400" />
                <span className="text-sm text-gray-300">
                  Network: <span className="text-blue-400 font-medium">{networkUser.network_name}</span> ({networkUser.user_auth})
                </span>
              </div>
            )}
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <Activity size={14} />
                Last updated: {formatDateTime(lastUpdated)}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <HardDrive size={14} className="text-gray-400" />
              <span className="text-xs text-gray-500">
                {storageInfo.totalRecords} records • {storageInfo.storageSize} used
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-lg transition-all duration-200 border border-gray-600"
            >
              <Settings size={16} />
              Settings
            </button>
            
            <button
              onClick={() => setShowClearModal(true)}
              disabled={statsHistory.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                statsHistory.length === 0
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600'
                  : 'bg-red-600 text-white hover:bg-red-700 border border-red-500 hover:shadow-lg'
              }`}
            >
              <Trash2 size={16} />
              Clear History
            </button>
            
            <button
              onClick={() => loadWalletStats(true)}
              disabled={isLoading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all duration-200 border border-green-500 hover:shadow-lg"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700">
            <h3 className="text-lg font-medium text-gray-100 mb-6 flex items-center gap-2">
              <Settings size={20} />
              Configuration Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <label className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    checked={isAutoRefreshEnabled}
                    onChange={(e) => setIsAutoRefreshEnabled(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-green-600 focus:ring-green-500 focus:ring-offset-gray-800"
                  />
                  <span className="text-sm font-medium text-gray-200">Enable Auto Refresh</span>
                </label>
              </div>
              
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Refresh Interval (minutes)
                </label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  disabled={!isAutoRefreshEnabled}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-800 text-gray-200"
                >
                  <option value={1}>1 minute</option>
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>
              
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-200"
                >
                  {getTimezoneOptions().map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-700/50">
              <h4 className="text-sm font-medium text-blue-300 mb-2">Storage Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-200">
                <div>
                  <span className="font-medium">Total Records:</span> {storageInfo.totalRecords}
                </div>
                <div>
                  <span className="font-medium">Storage Used:</span> {storageInfo.storageSize}
                </div>
              </div>
              <p className="text-xs text-blue-300 mt-2">
                Data is stored locally in your browser. Maximum 1000 records are kept automatically.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-700 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-300">Error loading wallet stats</h3>
              <p className="text-red-200">{error}</p>
            </div>
          </div>
        )}

        {!networkUser && !isLoading && (
          <div className="bg-yellow-900/50 border border-yellow-700 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle size={20} className="text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-yellow-300">User Information Required</h3>
              <p className="text-yellow-200">Loading user information to enable wallet stats tracking...</p>
            </div>
          </div>
        )}

        {isLoading && statsHistory.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-700 border-t-green-500"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 animate-pulse"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Current Paid Data"
                value={formatMBValue(currentStats.paid_mb)}
                icon={DollarSign}
                gradient="bg-gradient-to-r from-green-600 to-emerald-600"
              />
              <StatCard
                title="Current Unpaid Data"
                value={formatMBValue(currentStats.unpaid_mb)}
                icon={Clock}
                gradient="bg-gradient-to-r from-yellow-600 to-orange-600"
              />
              <StatCard
                title="Total Data"
                value={formatMBValue(currentStats.paid_mb + currentStats.unpaid_mb)}
                icon={Database}
                gradient="bg-gradient-to-r from-blue-600 to-indigo-600"
              />
              <StatCard
                title="Data Points"
                value={statsHistory.length.toString()}
                icon={TrendingUp}
                gradient="bg-gradient-to-r from-purple-600 to-pink-600"
              />
            </div>

            {statsHistory.length > 0 && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <Chart 
                  data={statsHistory} 
                  title="Paid Data Transfer History" 
                  dataKey="paid_bytes_provided"
                  color="#10b981"
                />
                <Chart 
                  data={statsHistory} 
                  title="Unpaid Data Transfer History" 
                  dataKey="unpaid_bytes_provided"
                  color="#f59e0b"
                />
              </div>
            )}

            <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600">
                <h3 className="font-medium text-gray-100">History Timeline</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-900 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Paid Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Unpaid Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Total Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {statsHistory.map((entry, index) => (
                      <tr key={entry.id} className={index === 0 ? 'bg-green-900/20 border-l-4 border-green-500' : 'hover:bg-gray-700/50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {formatDateTime(entry.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 font-medium">
                          {formatBytes(entry.paid_bytes_provided)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-400 font-medium">
                          {formatBytes(entry.unpaid_bytes_provided)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {formatBytes(entry.paid_bytes_provided + entry.unpaid_bytes_provided)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {statsHistory.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Database className="text-gray-500" size={24} />
                    </div>
                    <p className="text-gray-400 italic">No data collected yet. Data will appear after the first API call.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearHistory}
        title="Clear Wallet History"
        isLoading={isClearing}
        icon={<AlertTriangle className="h-6 w-6 text-red-400" />}
      >
        <p className="text-gray-300">Are you sure you want to clear all wallet statistics history?</p>
        <p className="text-sm text-gray-400 mt-2">
          This will permanently delete all {statsHistory.length} data points from localStorage. This action cannot be undone.
        </p>
        <div className="mt-4 p-3 bg-red-900/50 rounded-lg border border-red-700">
          <p className="text-sm text-red-300 font-medium">
            ⚠️ This will delete all historical data stored locally in your browser
          </p>
        </div>
      </ConfirmModal>
    </>
  );
};

export default WalletStatsSection;