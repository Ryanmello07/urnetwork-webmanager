import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, AlertCircle } from 'lucide-react';
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
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-blue-600" />
            Client Management
          </h2>
          <p className="text-gray-600 mt-1">View and manage connected clients</p>
        </div>
        
        <button
          onClick={loadClients}
          disabled={isLoading}
          className="flex items-center gap-2 bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-md transition-colors self-start"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh Clients
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800">Error loading clients</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <ClientsList clients={clients} onClientRemoved={handleClientRemoved} />
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden mt-8">
            <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100">
              <h3 className="font-medium text-indigo-800">Remove Client Manually</h3>
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