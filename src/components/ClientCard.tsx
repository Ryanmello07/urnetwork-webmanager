import React, { useState } from 'react';
import { Calendar, Clock, Cpu, Trash2, Info, AlertTriangle } from 'lucide-react';
import type { Client } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { removeClient } from '../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';

interface ClientCardProps {
  client: Client;
  onClientRemoved: (clientId: string) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onClientRemoved }) => {
  const { token } = useAuth();
  const [isRemoving, setIsRemoving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleRemoveClick = () => {
    setShowModal(true);
  };

  const handleRemoveConfirm = async () => {
    if (!token) return;
    
    setIsRemoving(true);
    try {
      const response = await removeClient(token, client.client_id);
      
      if (response.error) {
        toast.error(response.error.message);
      } else {
        toast.success(`Client ${client.device_name || client.client_id} removed successfully`);
        onClientRemoved(client.client_id);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove client');
    } finally {
      setIsRemoving(false);
      setShowModal(false);
    }
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
          <h3 className="font-medium text-gray-800 truncate" title={client.device_name || client.client_id}>
            {client.device_name || 'Unnamed Device'}
          </h3>
        </div>
        
        <div className="p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Cpu size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Device ID</p>
                <p className="text-sm font-medium">{client.device_id}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Calendar size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-sm">{formatDate(client.create_time)}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Clock size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Last Authentication</p>
                <p className="text-sm">{formatDate(client.auth_time)}</p>
              </div>
            </div>
          </div>
          
          {showDetails && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Details</h4>
              
              <div className="space-y-2 text-xs">
                <p><span className="text-gray-500">Network ID:</span> {client.network_id}</p>
                <p><span className="text-gray-500">Client ID:</span> {client.client_id}</p>
                <p><span className="text-gray-500">Description:</span> {client.description || 'N/A'}</p>
                <p><span className="text-gray-500">Device Spec:</span> {client.device_spec || 'N/A'}</p>
              </div>
              
              {client.resident && (
                <div className="mt-3">
                  <h5 className="text-xs font-medium text-gray-700">Resident Information</h5>
                  <div className="space-y-1 text-xs mt-1">
                    <p><span className="text-gray-500">Host:</span> {client.resident.resident_host}</p>
                    <p><span className="text-gray-500">Service:</span> {client.resident.resident_service}</p>
                    <p><span className="text-gray-500">ID:</span> {client.resident.resident_id}</p>
                  </div>
                </div>
              )}
              
              {client.connections && client.connections.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-xs font-medium text-gray-700">Connections ({client.connections.length})</h5>
                  <div className="space-y-1 text-xs mt-1 max-h-24 overflow-y-auto">
                    {client.connections.map((conn, index) => (
                      <div key={index} className="p-1 bg-gray-50 rounded text-xs">
                        <p><span className="text-gray-500">ID:</span> {conn.connection_id.substring(0, 8)}...</p>
                        <p><span className="text-gray-500">Host:</span> {conn.connection_host}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-4 flex justify-between">
            <button
              onClick={toggleDetails}
              className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Info size={14} />
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
            
            <button
              onClick={handleRemoveClick}
              disabled={isRemoving}
              className="text-xs flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors"
            >
              <Trash2 size={14} />
              Remove Client
            </button>
          </div>
        </div>
      </div>
      
      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleRemoveConfirm}
        title="Remove Client"
        isLoading={isRemoving}
        icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
      >
        <p>Are you sure you want to remove client <span className="font-medium">{client.device_name || client.client_id}</span>?</p>
        <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
      </ConfirmModal>
    </>
  );
};

export default ClientCard;