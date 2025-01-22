import React, { useState } from 'react';
import type { Route } from '../types';
import AutocompleteSearch from './AutocompleteSearch';
import axios from 'axios';

interface RouteFormProps {
  onRouteSubmit: (route: Route) => void;
}

interface Coordinates {
  lat: number;
  lon: number;
}

interface LocationData {
  startAddress: string;
  endAddress: string;
  startCoords: Coordinates | null;
  endCoords: Coordinates | null;
}

export default function RouteForm({ onRouteSubmit }: RouteFormProps) {
  const [locationData, setLocationData] = useState<LocationData>({
    startAddress: '',
    endAddress: '',
    startCoords: null,
    endCoords: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoordinates = async (address: string, type: 'start' | 'end') => {
    try {
      const response = await axios.get(
        'https://nominatim.openstreetmap.org/search',
        {
          params: { 
            q: address, 
            format: 'json', 
            limit: 1,
            countrycodes: 'in' // Limit to India
          },
        }
      );

      if (response.data.length > 0) {
        const { lat, lon } = response.data[0];
        setLocationData(prev => ({
          ...prev,
          [`${type}Coords`]: { lat: parseFloat(lat), lon: parseFloat(lon) }
        }));
      }
    } catch (err) {
      setError('Error fetching coordinates. Please try again.');
    }
  };


const calculateDistance = async () => {
  if (!locationData.startCoords || !locationData.endCoords) return;

  const { startCoords, endCoords } = locationData;

  try {
    setLoading(true);
    const response = await axios.get(
      'https://api.openrouteservice.org/v2/directions/driving-car',
      {
        params: {
          api_key: '5b3ce3597851110001cf62483628cb4427c2430b96c354f4d63058fd',
          start: `${startCoords.lon},${startCoords.lat}`,
          end: `${endCoords.lon},${endCoords.lat}`
        }
      }
    );

    const distanceInMeters = response.data.features[0].properties.segments[0].distance;
    const distanceInKm = distanceInMeters / 1000;

    onRouteSubmit({
      startLocation: {
        lat: startCoords.lat,
        lng: startCoords.lon,
        address: locationData.startAddress
      },
      endLocation: {
        lat: endCoords.lat,
        lng: endCoords.lon,
        address: locationData.endAddress
      },
      distance: distanceInKm
    });
  } catch (err) {
    setError('Error calculating route. Please try again.');
  } finally {
    setLoading(false);
  }
};


  const handleLocationSelect = (address: string, fieldName: string) => {
    const type = fieldName === 'start' ? 'start' : 'end';
    setLocationData(prev => ({
      ...prev,
      [`${type}Address`]: address
    }));
    fetchCoordinates(address, type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!locationData.startAddress || !locationData.endAddress) {
      setError('Please enter both start and end locations');
      return;
    }

    await calculateDistance();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Start Location</label>
        <AutocompleteSearch
          onSelectLocation={handleLocationSelect}
          fieldName="start"
          value={locationData.startAddress}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">End Location</label>
        <AutocompleteSearch
          onSelectLocation={handleLocationSelect}
          fieldName="end"
          value={locationData.endAddress}
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !locationData.startAddress || !locationData.endAddress}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Calculating Route...' : 'Calculate Route'}
      </button>
    </form>
  );
}