import React, { useState, useEffect } from 'react';
import { Car, Fuel } from 'lucide-react';
import type { Vehicle } from '../types';
import { api } from '../services/api';

interface VehicleFormProps {
  onVehicleSubmit: (vehicle: Vehicle) => void;
}

export default function VehicleForm({ onVehicleSubmit }: VehicleFormProps) {
  const [mileage, setMileage] = useState('');
  const [fuelPrice, setFuelPrice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFuelPrice = async () => {
      try {
        const price = await api.getFuelPrice();
        setFuelPrice(price.toFixed(2));
      } catch (err) {
        // Safely handle error without passing complex objects
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch fuel price';
        console.error('Error:', errorMessage);
        // Set default Indian fuel price if API fails
        setFuelPrice('100.00');
      }
    };

    fetchFuelPrice();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      onVehicleSubmit({
        averageMileage: parseFloat(mileage),
        fuelPrice: parseFloat(fuelPrice)
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit vehicle details';
      console.error('Error:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Vehicle Mileage (km/L)</label>
        <div className="mt-1 relative">
          <input
            type="number"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            className="block w-full px-4 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter average mileage (e.g., 15)"
            required
            min="8"
            max="30"
            step="0.1"
            disabled={loading}
          />
          <Car className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <p className="mt-1 text-sm text-gray-500">Typical range for Indian cars: 12-20 km/L</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Fuel Price (₹/litre)</label>
        <div className="mt-1 relative">
          <input
            type="number"
            value={fuelPrice}
            onChange={(e) => setFuelPrice(e.target.value)}
            className="block w-full px-4 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Current fuel price"
            required
            min="90"
            max="120"
            step="0.01"
            disabled={loading}
          />
          <Fuel className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Vehicle Details'}
      </button>
    </form>
  );
}