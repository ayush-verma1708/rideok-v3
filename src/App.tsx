import React, { useState } from 'react';
import { Route, Vehicle, Passenger } from './types';
import RouteForm from './components/RouteForm';
import VehicleForm from './components/VehicleForm';
import PassengerForm from './components/PassengerForm';
import CostCalculator from './components/CostCalculator';

function App() {
  const [route, setRoute] = useState<Route | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);

  const handleAddPassenger = (passenger: Passenger) => {
    setPassengers(prev => [...prev, passenger]);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">RideOK Metrics</h1>
          <p className="mt-2 text-gray-600">Calculate fair ride sharing costs</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Route Details</h2>
              <RouteForm onRouteSubmit={setRoute} />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Vehicle Details</h2>
              <VehicleForm onVehicleSubmit={setVehicle} />
            </div>

            {route && vehicle && (
              <PassengerForm
                mainRoute={route}
                vehicle={vehicle}
                onAddPassenger={handleAddPassenger}
                existingPassengers={passengers}
              />
            )}
          </div>

          <div>
            {route && vehicle ? (
              <CostCalculator
                route={route}
                vehicle={vehicle}
                passengers={passengers}
              />
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
                Enter route and vehicle details to see cost breakdown
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;