import { IndianRupee, Users } from 'lucide-react';
import type { Route, Vehicle, Passenger } from '../types';

interface CostCalculatorProps {
  route: Route;
  vehicle: Vehicle;
  passengers: Passenger[];
}

export default function CostCalculator({ route, vehicle, passengers }: CostCalculatorProps) {
  // Calculate base cost (fuel cost) for main route
  const fuelNeeded = route.distance / vehicle.averageMileage;
  const fuelCost = fuelNeeded * vehicle.fuelPrice;

  // Add maintenance cost (20% of fuel cost)
  const maintenanceCost = fuelCost * 0.2;

  // Base cost includes fuel and maintenance
  const baseCost = fuelCost + maintenanceCost;

  // Calculate total distance including all passengers
  const totalDistance = passengers.reduce(
    (total, passenger) => total + passenger.distance,
    route.distance
  );
  
  // Check if total distance is valid
  if (isNaN(totalDistance)) {
    console.error('Invalid total distance:', totalDistance);
  }
  
  const totalCost = passengers.reduce(
    (total, passenger) => total + passenger.cost,
    baseCost
  );
  
  // Check if total cost is valid
  if (isNaN(totalCost)) {
    console.error('Invalid total cost:', totalCost);
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span>Total Distance:</span>
          <span className="font-medium">{totalDistance.toFixed(1)} km</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Total Fuel Required:</span>
          <span className="font-medium">{(totalDistance / vehicle.averageMileage).toFixed(2)} litres</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Base Route Cost:</span>
          <div className="flex items-center">
            <IndianRupee className="h-4 w-4 mr-1" />
            <span className="font-medium">{baseCost.toFixed(2)}</span>
          </div>
        </div>

        <div className="border-t pt-3 mt-3">
          <h4 className="font-semibold mb-2 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Passenger Breakdown
          </h4>
          
          {passengers.map((passenger) => (
            <div key={passenger.id} className="mb-3 pl-4 border-l-2 border-gray-200">
              <div className="text-sm font-medium">{passenger.name}</div>
              <div className="text-sm text-gray-600">
                {passenger.pickupLocation.address} → {passenger.dropLocation.address}
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm">Distance: {passenger.distance.toFixed(1)} km</span>
                <div className="flex items-center text-green-600">
                  <IndianRupee className="h-4 w-4 mr-1" />
                  <span>{passenger.cost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between items-center font-semibold">
            <span>Total Cost:</span>
            <div className="flex items-center text-green-600">
              <IndianRupee className="h-4 w-4 mr-1" />
              <span>{totalCost.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
