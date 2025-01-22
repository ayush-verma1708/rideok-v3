import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import type { Location, Passenger, Route, Vehicle } from '../types';
import AutocompleteSearch from './AutocompleteSearch';
import { api } from '../services/api';
import axios from 'axios';

interface PassengerFormProps {
  mainRoute: Route;
  vehicle: Vehicle;
  onAddPassenger: (passenger: Passenger) => void;
  existingPassengers: Passenger[];
}

export default function PassengerForm({ 
  mainRoute, 
  vehicle, 
  onAddPassenger,
  existingPassengers 
}: PassengerFormProps) {
  const [name, setName] = useState('');
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [dropLocation, setDropLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch coordinates for a given address
  const fetchCoordinates = async (address: string): Promise<Location | null> => {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address,
          format: 'json',
          limit: 1,
        },
      });

      if (response.data.length > 0) {
        const { lat, lon } = response.data[0];
        return {
          lat: parseFloat(lat),
          lng: parseFloat(lon),
          address,
        };
      } else {
        console.error(`No coordinates found for address: ${address}`);
        return null;
      }
    } catch (err) {
      console.error(`Error fetching coordinates for ${address}:`, err);
      return null;
    }
  };

  const calculateOptimizedCost = async () => {
    if (!pickupLocation || !dropLocation) return;

    try {
      setLoading(true);
      setError(null);

      // Calculate passenger's route
      const passengerRoute = await api.calculateRoute(
        pickupLocation.address,
        dropLocation.address
      );

      // Calculate base cost for this passenger's distance
      const fuelNeeded = passengerRoute.distance / vehicle.averageMileage;
      const fuelCost = fuelNeeded * vehicle.fuelPrice;
      const maintenanceCost = fuelCost * 0.2;
      const baseCost = fuelCost + maintenanceCost;

      // Calculate overlap with main route and other passengers
      const overlapDiscount = calculateOverlapDiscount(
        pickupLocation,
        dropLocation,
        mainRoute,
        existingPassengers
      );

      // Apply discount based on route overlap and number of passengers
      const totalPassengers = existingPassengers.length + 1;
      const costMultiplier = 1 - (overlapDiscount * 0.3) - (totalPassengers * 0.05);
      const finalCost = baseCost * costMultiplier;

      const newPassenger: Passenger = {
        id: crypto.randomUUID(),
        name,
        pickupLocation,
        dropLocation,
        distance: passengerRoute.distance,
        cost: finalCost
      };

      onAddPassenger(newPassenger);
      resetForm();
    } catch (err) {
      setError('Failed to calculate optimized route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateOverlapDiscount = (
    pickup: Location,
    drop: Location,
    mainRoute: Route,
    existingPassengers: Passenger[]
  ): number => {
    // Calculate overlap with main route
    const mainRouteOverlap = calculateRouteOverlap(
      pickup,
      drop,
      mainRoute.startLocation,
      mainRoute.endLocation
    );

    // Calculate overlap with existing passengers' routes
    const passengersOverlap = existingPassengers.reduce((maxOverlap, passenger) => {
      const overlap = calculateRouteOverlap(
        pickup,
        drop,
        passenger.pickupLocation,
        passenger.dropLocation
      );
      return Math.max(maxOverlap, overlap);
    }, 0);

    return Math.max(mainRouteOverlap, passengersOverlap);
  };

  const calculateRouteOverlap = (
    pickup1: Location,
    drop1: Location,
    pickup2: Location,
    drop2: Location
  ): number => {
    // Simple overlap calculation based on coordinates
    const lat1 = Math.min(pickup1.lat, drop1.lat);
    const lat2 = Math.max(pickup1.lat, drop1.lat);
    const lng1 = Math.min(pickup1.lng, drop1.lng);
    const lng2 = Math.max(pickup1.lng, drop1.lng);

    const olat1 = Math.min(pickup2.lat, drop2.lat);
    const olat2 = Math.max(pickup2.lat, drop2.lat);
    const olng1 = Math.min(pickup2.lng, drop2.lng);
    const olng2 = Math.max(pickup2.lng, drop2.lng);

    const latOverlap = Math.max(0, Math.min(lat2, olat2) - Math.max(lat1, olat1));
    const lngOverlap = Math.max(0, Math.min(lng2, olng2) - Math.max(lng1, olng1));

    const area1 = (lat2 - lat1) * (lng2 - lng1);
    const area2 = (olat2 - olat1) * (olng2 - olng1);
    const overlapArea = latOverlap * lngOverlap;

    return overlapArea / Math.min(area1, area2);
  };

  const resetForm = () => {
    setName('');
    setPickupLocation(null);
    setDropLocation(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pickupLocation?.address || !dropLocation?.address) {
      setError('Please fill in all fields');
      return;
    }

    const resolvedPickup = await fetchCoordinates(pickupLocation.address);
    const resolvedDrop = await fetchCoordinates(dropLocation.address);

    if (!resolvedPickup || !resolvedDrop) {
      setError('Failed to resolve coordinates for addresses');
      return;
    }

    setPickupLocation(resolvedPickup);
    setDropLocation(resolvedDrop);

    await calculateOptimizedCost();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <UserPlus className="h-5 w-5 mr-2" />
        Add New Passenger
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Passenger Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter passenger name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Pickup Location
          </label>
          <AutocompleteSearch
  onSelectLocation={(address, fieldName) => {
    if (fieldName === 'pickup') {
      setPickupLocation((prev) => ({
        ...prev,
        address,
        lat: 0, 
        lng: 0, 
      }));
    }
  }}
  fieldName="pickup"
  value={pickupLocation?.address || ''}
/>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Drop Location
          </label>
          <AutocompleteSearch
  onSelectLocation={(address, fieldName) => {
    if (fieldName === 'drop') {
      setDropLocation((prev) => ({
        ...prev,
        address,
        lat: 0, // Default value; coordinates logic should be handled internally or fetched if required
        lng: 0, // Default value
      }));
    }
  }}
  fieldName="drop"
  value={dropLocation?.address || ''}
/>
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Calculating...' : 'Add Passenger'}
        </button>
      </form>
    </div>
  );
}

// import React, { useState } from 'react';
// import { UserPlus } from 'lucide-react';
// import type { Location, Passenger, Route, Vehicle } from '../types';
// import AutocompleteSearch from './AutocompleteSearch';
// import { api } from '../services/api';

// interface PassengerFormProps {
//   mainRoute: Route;
//   vehicle: Vehicle;
//   onAddPassenger: (passenger: Passenger) => void;
//   existingPassengers: Passenger[];
// }

// export default function PassengerForm({ 
//   mainRoute, 
//   vehicle, 
//   onAddPassenger,
//   existingPassengers 
// }: PassengerFormProps) {
//   const [name, setName] = useState('');
//   const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
//   const [dropLocation, setDropLocation] = useState<Location | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const calculateOptimizedCost = async () => {
//     if (!pickupLocation || !dropLocation) return;

//     try {
//       setLoading(true);
//       setError(null);

//       // Calculate passenger's route
//       const passengerRoute = await api.calculateRoute(
//         pickupLocation.address,
//         dropLocation.address
//       );

//       // Calculate base cost for this passenger's distance
//       const fuelNeeded = passengerRoute.distance / vehicle.averageMileage;
//       const fuelCost = fuelNeeded * vehicle.fuelPrice;
//       const maintenanceCost = fuelCost * 0.2;
//       const baseCost = fuelCost + maintenanceCost;

//       // Calculate overlap with main route and other passengers
//       const overlapDiscount = calculateOverlapDiscount(
//         pickupLocation,
//         dropLocation,
//         mainRoute,
//         existingPassengers
//       );

//       // Apply discount based on route overlap and number of passengers
//       const totalPassengers = existingPassengers.length + 1;
//       const costMultiplier = 1 - (overlapDiscount * 0.3) - (totalPassengers * 0.05);
//       const finalCost = baseCost * costMultiplier;

//       const newPassenger: Passenger = {
//         id: crypto.randomUUID(),
//         name,
//         pickupLocation,
//         dropLocation,
//         distance: passengerRoute.distance,
//         cost: finalCost
//       };

//       onAddPassenger(newPassenger);
//       resetForm();
//     } catch (err) {
//       setError('Failed to calculate optimized route. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const calculateOverlapDiscount = (
//     pickup: Location,
//     drop: Location,
//     mainRoute: Route,
//     existingPassengers: Passenger[]
//   ): number => {

    
//     // Calculate overlap with main route
//     const mainRouteOverlap = calculateRouteOverlap(
//       pickup,
//       drop,
//       mainRoute.startLocation,
//       mainRoute.endLocation
//     );

//     // Calculate overlap with existing passengers' routes
//     const passengersOverlap = existingPassengers.reduce((maxOverlap, passenger) => {
//       const overlap = calculateRouteOverlap(
//         pickup,
//         drop,
//         passenger.pickupLocation,
//         passenger.dropLocation
//       );
//       return Math.max(maxOverlap, overlap);
//     }, 0);

//     return Math.max(mainRouteOverlap, passengersOverlap);
//   };

//   const calculateRouteOverlap = (
//     pickup1: Location,
//     drop1: Location,
//     pickup2: Location,
//     drop2: Location
//   ): number => {
//     // Simple overlap calculation based on coordinates
//     // Returns a value between 0 (no overlap) and 1 (complete overlap)
//     const lat1 = Math.min(pickup1.lat, drop1.lat);
//     const lat2 = Math.max(pickup1.lat, drop1.lat);
//     const lng1 = Math.min(pickup1.lng, drop1.lng);
//     const lng2 = Math.max(pickup1.lng, drop1.lng);

//     const olat1 = Math.min(pickup2.lat, drop2.lat);
//     const olat2 = Math.max(pickup2.lat, drop2.lat);
//     const olng1 = Math.min(pickup2.lng, drop2.lng);
//     const olng2 = Math.max(pickup2.lng, drop2.lng);

//     const latOverlap = Math.max(0, Math.min(lat2, olat2) - Math.max(lat1, olat1));
//     const lngOverlap = Math.max(0, Math.min(lng2, olng2) - Math.max(lng1, olng1));

//     const area1 = (lat2 - lat1) * (lng2 - lng1);
//     const area2 = (olat2 - olat1) * (olng2 - olng1);
//     const overlapArea = latOverlap * lngOverlap;

//     return overlapArea / Math.min(area1, area2);
//   };

//   const resetForm = () => {
//     setName('');
//     setPickupLocation(null);
//     setDropLocation(null);
//     setError(null);
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!name || !pickupLocation || !dropLocation) {
//       setError('Please fill in all fields');
//       return;
//     }
//     await calculateOptimizedCost();
//   };

//   return (
//     <div className="bg-white p-6 rounded-lg shadow-md">
//       <h3 className="text-lg font-semibold mb-4 flex items-center">
//         <UserPlus className="h-5 w-5 mr-2" />
//         Add New Passenger
//       </h3>

//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700">
//             Passenger Name
//           </label>
//           <input
//             type="text"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//             placeholder="Enter passenger name"
//             required
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700">
//             Pickup Location
//           </label>
//           <AutocompleteSearch
//   onSelectLocation={(address, fieldName) => {
//     if (fieldName === 'pickup') {
//       setPickupLocation((prev) => ({
//         ...prev,
//         address,
//         lat: 0, 
//         lng: 0, 
//       }));
//     }
//   }}
//   fieldName="pickup"
//   value={pickupLocation?.address || ''}
// />

//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700">
//             Drop Location
//           </label>
//           <AutocompleteSearch
//   onSelectLocation={(address, fieldName) => {
//     if (fieldName === 'drop') {
//       setDropLocation((prev) => ({
//         ...prev,
//         address,
//         lat: 0, // Default value; coordinates logic should be handled internally or fetched if required
//         lng: 0, // Default value
//       }));
//     }
//   }}
//   fieldName="drop"
//   value={dropLocation?.address || ''}
// />

//         </div>

//         {error && (
//           <div className="text-red-500 text-sm">{error}</div>
//         )}

//         <button
//           type="submit"
//           disabled={loading}
//           className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
//         >
//           {loading ? 'Calculating...' : 'Add Passenger'}
//         </button>
//       </form>
//     </div>
//   );
// } 