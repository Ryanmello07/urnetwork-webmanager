import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw, AlertCircle, Medal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchLeaderboard, fetchNetworkRanking } from '../services/api';
import type { LeaderboardEntry, NetworkRanking } from '../services/api';
import toast from 'react-hot-toast';

const LeaderboardSection: React.FC = () => {
  const { token } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [ranking, setRanking] = useState<NetworkRanking['network_ranking'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const loadLeaderboard = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [leaderboardResponse, rankingResponse] = await Promise.all([
        fetchLeaderboard(token),
        fetchNetworkRanking(token)
      ]);
      
      if (leaderboardResponse.error) {
        throw new Error(leaderboardResponse.error.message);
      }
      
      if (rankingResponse.error) {
        throw new Error(rankingResponse.error.message);
      }

      setLeaderboard(leaderboardResponse.earners);
      setRanking(rankingResponse.network_ranking);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load leaderboard';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [token]);

  const formatMibCount = (mibCount: number) => {
    if (mibCount >= 1024) {
      return `${(mibCount / 1024).toFixed(2)} GB`;
    }
    return `${mibCount.toFixed(2)} MB`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Trophy className="text-blue-600" />
            Network Leaderboard
          </h2>
          <p className="text-gray-600 mt-1">
            Last updated: {new Date(lastUpdated).toLocaleString() || 'Never'}
          </p>
        </div>
        
        <button
          onClick={loadLeaderboard}
          disabled={isLoading}
          className="flex items-center gap-2 bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-md transition-colors self-start"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh Leaderboard
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800">Error loading leaderboard</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {ranking && (
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Medal size={24} />
                <h3 className="text-xl font-semibold">Your Network Ranking</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-blue-100">Total Data Transfer</p>
                  <p className="text-2xl font-bold">{formatMibCount(ranking.net_mib_count)}</p>
                </div>
                <div>
                  <p className="text-blue-100">Leaderboard Position</p>
                  <p className="text-2xl font-bold">#{ranking.leaderboard_rank}</p>
                </div>
                <div>
                  <p className="text-blue-100">Network Status</p>
                  <p className="text-2xl font-bold">{ranking.leaderboard_public ? 'Public' : 'Private'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-800">Global Rankings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Network</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Transfer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboard.map((entry, index) => (
                    <tr key={entry.network_id} className={ranking?.leaderboard_rank === index + 1 ? 'bg-blue-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.network_name || 'Private Network'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatMibCount(entry.net_mib_count)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          entry.is_public
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {entry.is_public ? 'Public' : 'Private'}
                        </span>
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

export default LeaderboardSection;