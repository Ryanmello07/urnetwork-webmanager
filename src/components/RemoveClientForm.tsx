import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { removeClient } from '../services/api';
import toast from 'react-hot-toast';

interface RemoveClientFormProps {
  onClientRemoved: (clientId: string) => void;
}

const RemoveClientForm: React.FC<RemoveClientFormProps> = ({ onClientRemoved }) => {
  const { token } = useAuth();
  const [clientId, setClientId] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !clientId.trim()) return;
    
    setIsRemoving(true);
    try {
      const response = await removeClient(token, clientId.trim());
      
      if (response.error) {
        toast.error(response.error.message);
      } else {
        toast.success(`Client removed successfully`);
        onClientRemoved(clientId.trim());
        setClientId('');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove client');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md">
      <div className="mb-4">
        <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
          Client ID
        </label>
        <input
          id="clientId"
          type="text"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="Enter client ID to remove"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          disabled={isRemoving}
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={isRemoving || !clientId.trim()}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-white transition-colors
          ${isRemoving || !clientId.trim() 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-red-600 hover:bg-red-700'
          }`}
      >
        {isRemoving ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
              <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Removing...
          </>
        ) : (
          <>
            <Trash2 size={16} />
            Remove Client
          </>
        )}
      </button>
    </form>
  );
};

export default RemoveClientForm;