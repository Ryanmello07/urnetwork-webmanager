import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Wallet, RefreshCw, AlertCircle, Settings, Clock, TrendingUp, Database, DollarSign, User, Trash2, AlertTriangle, HardDrive } from 'lucide-react';
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

  const bytesToMB = (bytes: number) => bytes / (1024 * 1024);

  // Format bytes to appropriate unit (MB, GB, TB)
  const formatBytes = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
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
    const maxValue = Math.max(...values, 1); // Ensure minimum of 1 for scaling
    const minValue = Math.min(...values);
    const range = maxValue - minValue;
    const padding = range > 0 ? range * 0.1 : maxValue * 0.1; // 10% padding
    const chartMax = maxValue + padding;
    const chartMin = Math.max(0, minValue - padding);
    const chartRange = chartMax - chartMin || 1; // Prevent division by zero

    // Responsive dimensions that fill the container
    const leftPadding = 80;
    const rightPadding = 30;
    const topPadding = 30;
    const bottomPadding = 80;

    // Generate Y-axis labels
    const yAxisSteps = 5;
    const yAxisLabels = [];
    for (let i = 0; i <= yAxisSteps; i++) {
      const value = chartMin + (chartRange * i / yAxisSteps);
      yAxisLabels.push(value);
    }

    // Generate X-axis labels (show fewer points to avoid crowding)
    const maxXLabels = Math.min(5, chartData.length);
    const xAxisIndices = [];
    if (chartData.length <= maxXLabels) {
      // Show all points if we have few data points
      for (let i = 0; i < chartData.length; i++) {
        xAxisIndices.push(i);
      }
    } else {
      // Distribute points evenly
      for (let i = 0; i < maxXLabels; i++) {
        const index = Math.floor((i / (maxXLabels - 1)) * (chartData.length - 1));
        xAxisIndices.push(index);
      }
    }

    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full">
        <h3 className="text-lg font-medium text-gray-800 mb-6">{title}</h3>
        <div className="w-full h-80">
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 600 320"
            preserveAspectRatio="xMidYMid meet"
            className="border border-gray-200 rounded"
          >
            {/* Background */}
            <rect width="100%" height="100%" fill="#fafafa" />
            
            {/* Calculate plot area dimensions */}
            <defs>
              <clipPath id={`plotArea-${dataKey}`}>
                <rect 
                  x={leftPadding} 
                  y={topPadding} 
                  width={600 - leftPadding - rightPadding} 
                  height={320 - topPadding - bottomPadding} 
                />
              </clipPath>
            </defs>
            
            {/* Plot area background */}
            <rect 
              x={leftPadding} 
              y={topPadding} 
              width={600 - leftPadding - rightPadding} 
              height={320 - topPadding - bottomPadding} 
              fill="white" 
              stroke="#e5e7eb" 
              strokeWidth="1"
            />
            
            {/* Horizontal grid lines */}
            {yAxisLabels.map((value, i) => {
              const y = topPadding + (320 - topPadding - bottomPadding) - (i / yAxisSteps) * (320 - topPadding - bottomPadding);
              return (
                <g key={i}>
                  <line
                    x1={leftPadding}
                    y1={y}
                    x2={600 - rightPadding}
                    y2={y}
                    stroke="#f3f4f6"
                    strokeWidth="1"
                  />
                  <text
                    x={leftPadding - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs fill-gray-600"
                    fontSize="11"
                  >
                    {formatValue(value)}
                  </text>
                </g>
              );
            })}
            
            {/* Vertical grid lines */}
            {xAxisIndices.map((dataIndex) => {
              const x = leftPadding + (dataIndex / Math.max(1, chartData.length - 1)) * (600 - leftPadding - rightPadding);
              return (
                <line
                  key={dataIndex}
                  x1={x}
                  y1={topPadding}
                  x2={x}
                  y2={320 - bottomPadding}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
              );
            })}
            
            {/* Data line */}
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
            
            {/* Data points */}
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
                    stroke="white"
                    strokeWidth="2"
                  />
                  {/* Hover tooltip area */}
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
            
            {/* X-axis labels */}
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
                  className="text-xs fill-gray-600"
                  fontSize="10"
                >
                  {label}
                </text>
              );
            })}
            
            {/* Y-axis label */}
            <text
              x={20}
              y={160}
              textAnchor="middle"
              className="text-xs fill-gray-700 font-medium"
              fontSize="11"
              transform="rotate(-90, 20, 160)"
            >
              Data Transfer (MB)
            </text>
            
            {/* X-axis label */}
            <text
              x={300}
              y={310}
              textAnchor="middle"
              className="text-xs fill-gray-700 font-medium"
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
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Wallet className="text-green-600" />
              Wallet Statistics
            </h2>
            <p className="text-gray-600 mt-1">
              Real-time tracking of data transfer earnings (stored locally)
            </p>
            {networkUser && (
              <div className="flex items-center gap-2 mt-2">
                <User size={16} className="text-gray-500" />
                <span className="text-sm text-gray-600">
                  Network: {networkUser.network_name} ({networkUser.user_auth})
                </span>
              </div>
            )}
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {formatDateTime(lastUpdated)}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <HardDrive size={14} className="text-gray-400" />
              <span className="text-xs text-gray-500">
                {storageInfo.totalRecords} records • {storageInfo.storageSize} used
              </span>
            </div>
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
              onClick={() => setShowClearModal(true)}
              disabled={statsHistory.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                statsHistory.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              <Trash2 size={16} />
              Clear History
            </button>
            
            <button
              onClick={() => loadWalletStats(true)}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    checked={isAutoRefreshEnabled}
                    onChange={(e) => setIsAutoRefreshEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Auto Refresh</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refresh Interval (minutes)
                </label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  disabled={!isAutoRefreshEnabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
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
            
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Storage Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                <div>
                  <span className="font-medium">Total Records:</span> {storageInfo.totalRecords}
                </div>
                <div>
                  <span className="font-medium">Storage Used:</span> {storageInfo.storageSize}
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Data is stored locally in your browser. Maximum 1000 records are kept automatically.
              </p>
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

        {!networkUser && !isLoading && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md flex items-start gap-3">
            <AlertCircle size={20} className="text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-yellow-800">User Information Required</h3>
              <p className="text-yellow-700">Loading user information to enable wallet stats tracking...</p>
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
                value={formatMBValue(currentStats.paid_mb)}
                icon={DollarSign}
                color="bg-green-500"
              />
              <StatCard
                title="Current Unpaid Data"
                value={formatMBValue(currentStats.unpaid_mb)}
                icon={Clock}
                color="bg-yellow-500"
              />
              <StatCard
                title="Total Data"
                value={formatMBValue(currentStats.paid_mb + currentStats.unpaid_mb)}
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
                        Paid Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unpaid Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {statsHistory.map((entry, index) => (
                      <tr key={entry.id} className={index === 0 ? 'bg-green-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(entry.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatBytes(entry.paid_bytes_provided)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatBytes(entry.unpaid_bytes_provided)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatBytes(entry.paid_bytes_provided + entry.unpaid_bytes_provided)}
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

      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearHistory}
        title="Clear Wallet History"
        isLoading={isClearing}
        icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
      >
        <p>Are you sure you want to clear all wallet statistics history?</p>
        <p className="text-sm text-gray-500 mt-2">
          This will permanently delete all {statsHistory.length} data points from localStorage. This action cannot be undone.
        </p>
        <div className="mt-4 p-3 bg-red-50 rounded-md">
          <p className="text-sm text-red-800 font-medium">
            ⚠️ This will delete all historical data stored locally in your browser
          </p>
        </div>
      </ConfirmModal>
    </>
  );
};

export default WalletStatsSection;