import axios from 'axios';
import type { Route, Vehicle, RideMetrics } from '../types';

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

  // async calculateRoute(start: string, end: string) {
  //   try {
  //     // First, get coordinates for both locations
  //     const [startResponse, endResponse] = await Promise.all([
  //       axiosInstance.get('https://nominatim.openstreetmap.org/search', {
  //         params: {
  //           q: start,
  //           format: 'json',
  //           limit: 1,
  //           countrycodes: 'in'
  //         }
  //       }),
  //       axiosInstance.get('https://nominatim.openstreetmap.org/search', {
  //         params: {
  //           q: end,
  //           format: 'json',
  //           limit: 1,
  //           countrycodes: 'in'
  //         }})
  //     ]);

  //     if (!startResponse.data.length || !endResponse.data.length) {
  //       throw new Error('Could not find one or both locations');
  //     }

  //     const startLoc = startResponse.data[0];
  //     const endLoc = endResponse.data[0];

  //     // Calculate route using OpenRouteService
  //     const routeResponse = await axiosInstance.get(
  //       'https://api.openrouteservice.org/v2/directions/driving-car',
  //       {
  //         params: {
  //           api_key: '5b3ce3597851110001cf62483628cb4427c2430b96c354f4d63058fd',
  //           start: `${startLoc.lon},${startLoc.lat}`,
  //           end: `${endLoc.lon},${endLoc.lat}`,
  //         }
  //       }
  //     );

  //     const distance = routeResponse.data.features[0].properties.segments[0].distance / 1000; // Convert to km

  //     return {
  //       startLocation: {
  //         lat: parseFloat(startLoc.lat),
  //         lng: parseFloat(startLoc.lon),
  //         address: start
  //       },
  //       endLocation: {
  //         lat: parseFloat(endLoc.lat),
  //         lng: parseFloat(endLoc.lon),
  //         address: end
  //       },
  //       distance
  //     };
  //   } catch (error) {
  //     handleApiError(error);
  //     // Fallback to a simpler distance calculation if API fails
  //     return {
  //       startLocation: {
  //         lat: 0,
  //         lng: 0,
  //         address: start
  //       },
  //       endLocation: {
  //         lat: 0,
  //         lng: 0,
  //         address: end
  //       },
  //       distance: 10 // Default 10km if calculation fails
  //     };
  //   }
  // }
  // Optimized calculateRoute function
async calculateRoute(start: string, end: string) {
  try {
    // Fetch coordinates for start and end locations
    const [startResponse, endResponse] = await Promise.all([
      axiosInstance.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: start,
          format: 'json',
          limit: 1,
          countrycodes: 'in'
        }
      }),
      axiosInstance.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: end,
          format: 'json',
          limit: 1,
          countrycodes: 'in'
        }
      })
    ]);

    if (!startResponse.data.length || !endResponse.data.length) {
      throw new Error('Could not find one or both locations');
    }

    const startLoc = startResponse.data[0];
    const endLoc = endResponse.data[0];

    // Calculate route using OpenRouteService
    const routeResponse = await axiosInstance.get(
      'https://api.openrouteservice.org/v2/directions/driving-car',
      {
        params: {
          api_key: '5b3ce3597851110001cf62483628cb4427c2430b96c354f4d63058fd',
          start: `${startLoc.lon},${startLoc.lat}`,
          end: `${endLoc.lon},${endLoc.lat}`
        }
      }
    );

    const distance = routeResponse.data.features[0].properties.segments[0].distance / 1000; // Convert to km

    return {
      startLocation: {
        lat: parseFloat(startLoc.lat),
        lng: parseFloat(startLoc.lon),
        address: start
      },
      endLocation: {
        lat: parseFloat(endLoc.lat),
        lng: parseFloat(endLoc.lon),
        address: end
      },
      distance
    };
  } catch (error) {
    handleApiError(error);
    return {
      startLocation: { lat: 0, lng: 0, address: start },
      endLocation: { lat: 0, lng: 0, address: end },
      distance: 10 // Default 10km if calculation fails
    };
  }
}

};