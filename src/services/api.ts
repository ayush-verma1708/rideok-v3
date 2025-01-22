import axios from 'axios';
import type { Location, RouteResult,NominatimResponse, RideMetrics } from '../types';

// Create axios instance with default config
const axiosInstance = axios.create({
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 10000 // 10 second timeout
});

// Add retry logic for failed requests
axiosInstance.interceptors.response.use(undefined, async (err) => {
  const { config, message } = err;
  if (!config || !config.retry) {
    return Promise.reject(err);
  }
  config.retry -= 1;
  if (config.retry === 0) {
    return Promise.reject(err);
  }
  await new Promise(resolve => setTimeout(resolve, 1000));
  return axiosInstance(config);
});

const API_URL = 'http://localhost:5000/api';

// Helper function to handle API errors
const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error
    throw new Error(error.response.data.message || 'Server error occurred');
  } else if (error.request) {
    // Request made but no response
    throw new Error('Unable to connect to server');
  } else {
    // Request setup error
    throw new Error('Error making request');
  }
};

export const api = {
  async getFuelPrice() {
    try {
      const response = await axiosInstance.get(`${API_URL}/fuel-prices`);
      return response.data.price;
    } catch (error) {
      handleApiError(error);
      return 100; // Fallback to default price for India
    }
  },

  async saveRide(metrics: RideMetrics) {
    try {
      const response = await axiosInstance.post(`${API_URL}/rides`, metrics);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  async getRides() {
    try {
      const response = await axiosInstance.get(`${API_URL}/rides`);
      return response.data;
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

   // Corrected method definition
   async calculateRoute(start: string, end: string): Promise<RouteResult> {
    try {
      // Log start and end locations
  
      const [startResponse, endResponse] = await Promise.all([
        axios.get<NominatimResponse[]>('https://nominatim.openstreetmap.org/search', {
          params: {
            q: start,
            format: 'json',
            limit: 1,
            countrycodes: 'in',
          },
        }),
        axios.get<NominatimResponse[]>('https://nominatim.openstreetmap.org/search', {
          params: {
            q: end,
            format: 'json',
            limit: 1,
            countrycodes: 'in',
          },
        }),
      ]);
  
      if (!startResponse.data.length || !endResponse.data.length) {
        throw new Error('Could not find one or both locations');
      }
  
      const startLocData = startResponse.data[0];
      const endLocData = endResponse.data[0];
  
      // Log location data for both start and end locations
  
      const routeResponse = await axios.get('http://localhost:5000/api/directions', {
        params: {
          start: `${startLocData.lon},${startLocData.lat}`,
          end: `${endLocData.lon},${endLocData.lat}`,
        },
      });
  
      // Log the entire routeResponse to inspect its structure
  
      // Check if features exist in the response
      if (!routeResponse.data.features || !routeResponse.data.features.length) {
        throw new Error('No route found');
      }
  
      const routeFeature = routeResponse.data.features[0];  // Get the first feature
  
      const distance = routeFeature?.properties?.summary?.distance;
  
      // Check if distance is valid
      if (typeof distance !== 'number' || isNaN(distance)) {
        throw new Error('Invalid distance value received');
      }
  
      const distanceInKm = distance / 1000; // Convert meters to kilometers
  
      return {
        startLocation: {
          lat: parseFloat(startLocData.lat),
          lng: parseFloat(startLocData.lon),
          address: start,
        },
        endLocation: {
          lat: parseFloat(endLocData.lat),
          lng: parseFloat(endLocData.lon),
          address: end,
        },
        distance: distanceInKm,
      };
    } catch (error) {
      console.error('Error in calculateRoute:', error);
      return {
        startLocation: { lat: 0, lng: 0, address: start },
        endLocation: { lat: 0, lng: 0, address: end },
        distance: 10, // Default distance if error occurs
      };
    }
  }
  
  
  
  
};