export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Route {
  startLocation: Location;
  endLocation: Location;
  distance: number;
}

export interface Passenger {
  id: string;
  name: string;
  pickupLocation: Location;
  dropLocation: Location;
  distance: number;
  cost: number;
}

export interface Vehicle {
  averageMileage: number; // km/L
  fuelPrice: number; // per liter
}

export interface RideMetrics {
  route: Route;
  passengers: Passenger[];
  vehicle: Vehicle;
  totalCost: number;
  costPerPassenger: Record<string, number>;
  totalDistance: number;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface RouteResult {
startLocation: Location;
  endLocation: Location;
  distance: number; // Distance in kilometers
}

export interface NominatimResponse {
  lat: string;
  lon: string;
}