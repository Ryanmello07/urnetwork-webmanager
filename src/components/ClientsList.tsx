import React from 'react';
import type { Client } from '../services/api';
import ClientCard from './ClientCard';

interface ClientsListProps {
  clients: Client[];
  onClientRemoved: (clientId: string) => void;
}

const ClientsList: React.FC<ClientsListProps> = ({ clients, onClientRemoved }) => {
  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500 italic">No clients found. Try refreshing the list.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clients.map((client) => (
        <ClientCard 
          key={client.client_id} 
          client={client} 
          onClientRemoved={onClientRemoved} 
        />
      ))}
    </div>
  );
};

export default ClientsList;