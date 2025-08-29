import React from 'react';
import { ChevronDown, ChevronRight, Smartphone } from 'lucide-react';
import type { Client } from '../services/api';
import ClientCard from './ClientCard';

interface ClientsListProps {
  clients: Client[];
  onClientRemoved: (clientId: string) => void;
}

interface ClientGroup {
  sourceClient: Client;
  childClients: Client[];
}

const ClientsList: React.FC<ClientsListProps> = ({ clients, onClientRemoved }) => {
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());

  // Group clients by source_client_id
  const groupClients = (): { groups: ClientGroup[]; standaloneClients: Client[] } => {
    const groups: ClientGroup[] = [];
    const standaloneClients: Client[] = [];
    const processedClientIds = new Set<string>();

    clients.forEach(client => {
      if (processedClientIds.has(client.client_id)) return;

      if (client.source_client_id) {
        // Find if this is a source client for others
        const childClients = clients.filter(c => 
          c.source_client_id === client.client_id && c.client_id !== client.client_id
        );

        if (childClients.length > 0) {
          // This client has children, create a group
          groups.push({
            sourceClient: client,
            childClients: childClients
          });
          processedClientIds.add(client.client_id);
          childClients.forEach(child => processedClientIds.add(child.client_id));
        } else {
          // Check if this client belongs to an existing group
          const parentExists = clients.some(c => c.client_id === client.source_client_id);
          if (!parentExists) {
            // Parent doesn't exist in current data, treat as standalone
            standaloneClients.push(client);
            processedClientIds.add(client.client_id);
          }
        }
      } else {
        // No source_client_id, check if this is a source for others
        const childClients = clients.filter(c => c.source_client_id === client.client_id);
        
        if (childClients.length > 0) {
          groups.push({
            sourceClient: client,
            childClients: childClients
          });
          processedClientIds.add(client.client_id);
          childClients.forEach(child => processedClientIds.add(child.client_id));
        } else {
          standaloneClients.push(client);
          processedClientIds.add(client.client_id);
        }
      }
    });

    return { groups, standaloneClients };
  };

  const { groups, standaloneClients } = groupClients();

  const toggleGroup = (sourceClientId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(sourceClientId)) {
      newExpanded.delete(sourceClientId);
    } else {
      newExpanded.add(sourceClientId);
    }
    setExpandedGroups(newExpanded);
  };

  if (clients.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 text-center border border-gray-700">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔍</span>
          </div>
          <h3 className="text-lg font-medium text-gray-200 mb-2">No Clients Found</h3>
          <p className="text-gray-400 italic">Try refreshing the list or check your network connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Client Groups */}
      {groups.map((group) => {
        const isExpanded = expandedGroups.has(group.sourceClient.client_id);
        const totalClients = 1 + group.childClients.length;
        const connectedCount = [group.sourceClient, ...group.childClients].filter(
          c => c.connections && c.connections.length > 0
        ).length;

        return (
          <div key={group.sourceClient.client_id} className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
            {/* Group Header */}
            <div 
              className="p-4 bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600 cursor-pointer hover:from-gray-600 hover:to-gray-700 transition-all duration-200"
              onClick={() => toggleGroup(group.sourceClient.client_id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown size={20} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={20} className="text-gray-400" />
                    )}
                    <Smartphone size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-100">
                      {group.sourceClient.device_name || 'Device Group'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {group.sourceClient.device_spec || 'Unknown device'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-200">
                      {totalClients} client{totalClients !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-gray-400">
                      {connectedCount} connected
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    connectedCount > 0
                      ? 'bg-green-900 text-green-300 border border-green-700'
                      : 'bg-red-900 text-red-300 border border-red-700'
                  }`}>
                    {connectedCount > 0 ? 'Active' : 'Offline'}
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="p-4">
                <div className="space-y-4">
                  {/* Source Client */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-400">Source Device</span>
                    </div>
                    <ClientCard 
                      client={group.sourceClient} 
                      onClientRemoved={onClientRemoved}
                      isInGroup={true}
                    />
                  </div>

                  {/* Child Clients */}
                  {group.childClients.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium text-purple-400">
                          Connected Instances ({group.childClients.length})
                        </span>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-4 border-l-2 border-gray-700">
                        {group.childClients.map((client) => (
                          <ClientCard 
                            key={client.client_id} 
                            client={client} 
                            onClientRemoved={onClientRemoved}
                            isInGroup={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Standalone Clients */}
      {standaloneClients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {standaloneClients.map((client) => (
            <ClientCard 
              key={client.client_id} 
              client={client} 
              onClientRemoved={onClientRemoved} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientsList;