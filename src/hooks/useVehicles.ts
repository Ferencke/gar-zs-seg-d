import { useLocalStorage } from './useLocalStorage';
import { Vehicle } from '@/types';
import { useCallback } from 'react';

export function useVehicles() {
  const [vehicles, setVehicles] = useLocalStorage<Vehicle[]>('garage-vehicles', []);

  const addVehicle = useCallback((vehicle: Omit<Vehicle, 'id' | 'createdAt'>) => {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setVehicles((prev) => [...prev, newVehicle]);
    return newVehicle;
  }, [setVehicles]);

  const updateVehicle = useCallback((id: string, updates: Partial<Vehicle>) => {
    setVehicles((prev) =>
      prev.map((vehicle) =>
        vehicle.id === id ? { ...vehicle, ...updates } : vehicle
      )
    );
  }, [setVehicles]);

  const deleteVehicle = useCallback((id: string) => {
    setVehicles((prev) => prev.filter((vehicle) => vehicle.id !== id));
  }, [setVehicles]);

  const getVehiclesByCustomer = useCallback((customerId: string) => {
    return vehicles.filter((vehicle) => vehicle.customerId === customerId);
  }, [vehicles]);

  const getVehicle = useCallback((id: string) => {
    return vehicles.find((vehicle) => vehicle.id === id);
  }, [vehicles]);

  return {
    vehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    getVehiclesByCustomer,
    getVehicle,
  };
}
