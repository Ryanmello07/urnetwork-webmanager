import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, AlertCircle, Network } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchClients } from '../services/api';
import ClientsList from './ClientsList';
import RemoveClientForm from './RemoveClientForm';
import type { Client } from '../services/api';
import toast from 'react-hot-toast';

const ClientsSection: React.FC = () => {
  const { token } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClients = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchClients(token);
      
      if (response.error) {
        setError(response.error.message);
        toast.error(response.error.message);
      } else {
        setClients(response.clients || []);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load clients';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load clients on initial render
  useEffect(() => {
    loadClients();
  }, [token]);

  // Handle client removal from the list
  const handleClientRemoved = (clientId: string) => {
    setClients((prevClients) => prevClients.filter(client => client.client_id !== clientId));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
              <Users className="text-white" size={28} />
            </div>
            Client Management
          </h2>
          <p className="text-gray-400 mt-2">View and manage connected network clients</p>
          <div className="flex items-center gap-2 mt-2">
            <Network size={16} className="text-blue-400" />
            <span className="text-sm text-gray-500">{clients.length} clients connected</span>
          </div>
        </div>
        
        <button
          onClick={loadClients}
          disabled={isLoading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-200 border border-blue-500 hover:shadow-lg"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh Clients
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-300">Error loading clients</h3>
            <p className="text-red-200">{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-700 border-t-blue-500"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse"></div>
          </div>
        </div>
      ) : (
        <>
          <ClientsList clients={clients} onClientRemoved={handleClientRemoved} />
          
          <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 border-b border-gray-600">
              <h3 className="font-medium text-white">Remove Client Manually</h3>
              <p className="text-indigo-100 text-sm mt-1">Enter a client ID to remove it from the network</p>
            </div>
            <div className="p-6">
              <RemoveClientForm onClientRemoved={handleClientRemoved} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ClientsSection;