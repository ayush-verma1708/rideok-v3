import React, { useState, useCallback } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { MapPin, Navigation } from 'lucide-react';

interface AutocompleteSearchProps {
  onSelectLocation: (address: string, fieldName: string) => void;
  fieldName: string;
  value: string;
}

const AutocompleteSearch: React.FC<AutocompleteSearchProps> = ({ 
  onSelectLocation, 
  fieldName, 
  value 
}) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetCurrentLocation = () => {
    setLoading(true);
    setError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await axios.get(
              'https://nominatim.openstreetmap.org/reverse',
              {
                params: {
                  lat: latitude,
                  lon: longitude,
                  format: 'json',
                  addressdetails: 1,
                },
              }
            );
            const place = response.data;
            setQuery(place.display_name);
            setSelectedLocation(place);
            onSelectLocation(place.display_name, fieldName);
          } catch (err) {
            setError('Unable to fetch location details');
          } finally {
            setLoading(false);
          }
        },
        () => {
          setError('Unable to get current location');
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setError('Geolocation is not supported');
      setLoading(false);
    }
  };

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        'https://nominatim.openstreetmap.org/search',
        {
          params: {
            q: searchQuery,
            format: 'json',
            addressdetails: 1,
            limit: 5,
            countrycodes: 'in', // Limit to India
          },
        }
      );
      setSuggestions(response.data);
    } catch (err) {
      setError('Failed to fetch suggestions');
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetchSuggestions = useCallback(
    debounce((query) => fetchSuggestions(query), 500),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.length > 2) {
      debouncedFetchSuggestions(value);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (place: any) => {
    setQuery(place.display_name);
    setSelectedLocation(place);
    onSelectLocation(place.display_name, fieldName);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={`Enter ${fieldName} location`}
          className="block w-full px-4 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          disabled={loading}
        />
        <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>

      {loading && (
        <div className="mt-2 text-sm text-gray-500">
          Searching locations...
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-500">
          {error}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
          <ul className="max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
            {suggestions.map((item, index) => (
              <li
                key={index}
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50"
                onClick={() => handleSuggestionClick(item)}
              >
                <div className="flex items-center">
                  <span className="ml-3 block truncate">{item.display_name}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={handleGetCurrentLocation}
        disabled={loading}
        className="mt-2 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <Navigation className="h-4 w-4 mr-2" />
        {loading ? 'Getting location...' : 'Use current location'}
      </button>
    </div>
  );
};

export default AutocompleteSearch;