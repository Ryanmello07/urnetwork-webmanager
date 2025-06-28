import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchProviderLocations, findProviderLocations } from '../services/api';
import type { Location, LocationGroup, Device } from '../services/api';
import toast from 'react-hot-toast';
import debounce from 'lodash/debounce';

const ProvidersSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [groups, setGroups] = useState<LocationGroup[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize the loadLocations function
  const loadLocations = useCallback(async (query?: string) => {
    if (isLoading) return; // Prevent multiple simultaneous requests
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = query 
        ? await findProviderLocations(query)
        : await fetchProviderLocations();
      
      if (response.error) {
        setError(response.error.message);
        toast.error(response.error.message);
      } else {
        // Sort locations by provider count in descending order
        const sortedLocations = [...response.locations]
          .sort((a, b) => b.provider_count - a.provider_count)
          .slice(0, 50); // Limit to 50 results

        // Sort groups by provider count in descending order
        const sortedGroups = [...response.groups]
          .sort((a, b) => b.provider_count - a.provider_count)
          .slice(0, 10); // Limit to 10 featured groups

        // Update state in a single batch
        setLocations(sortedLocations);
        setGroups(sortedGroups);
        setDevices(response.devices.slice(0, 50));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load provider locations';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Memoize and configure debounce with a longer delay
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.trim().length >= 2) {
        loadLocations(query.trim());
      }
    }, 500),
    [loadLocations]
  );

  useEffect(() => {
    loadLocations();
    return () => {
      debouncedSearch.cancel();
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim().length === 0) {
      loadLocations();
    } else if (query.trim().length >= 2) {
      debouncedSearch(query);
    }
  };

  // Memoize card components
  const LocationCard = React.memo<{ location: Location }>(({ location }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-medium text-gray-800 truncate flex-1" title={location.name}>
            {location.name}
          </h3>
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded whitespace-nowrap">
            {location.provider_count} Providers
          </span>
        </div>
      </div>
      <div className="p-4 flex-1">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">{location.city}</p>
          <p className="text-sm text-gray-500">{location.country}</p>
        </div>
      </div>
    </div>
  ));

  const GroupCard = React.memo<{ group: LocationGroup }>(({ group }) => (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col ${
      group.promoted ? 'ring-2 ring-purple-500' : ''
    }`}>
      <div className={`px-4 py-3 border-b border-gray-200 ${
        group.promoted ? 'bg-purple-50' : 'bg-gray-50'
      }`}>
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-medium text-gray-800 truncate flex-1" title={group.name}>
            {group.name}
          </h3>
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded whitespace-nowrap">
            {group.provider_count} Providers
          </span>
        </div>
        {group.promoted && (
          <span className="text-xs text-purple-600 font-medium mt-1 block">Featured Group</span>
        )}
      </div>
    </div>
  ));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MapPin className="text-purple-600" />
            Provider Locations
          </h2>
          <p className="text-gray-600 mt-1">Browse and search provider locations worldwide</p>
        </div>
        
        <button
          onClick={() => loadLocations()}
          disabled={isLoading}
          className="flex items-center gap-2 bg-purple-100 text-purple-700 hover:bg-purple-200 px-4 py-2 rounded-md transition-colors self-start"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh Locations
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search locations (minimum 2 characters)..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
        />
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800">Error loading locations</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Featured Groups</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group) => (
                  <GroupCard key={group.location_group_id} group={group} />
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">All Locations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location) => (
                <LocationCard key={location.location_id} location={location} />
              ))}
            </div>
          </div>

          {locations.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-500 italic">No locations found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProvidersSection;