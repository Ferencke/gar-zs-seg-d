import { useLocalStorage } from './useLocalStorage';
import { ServiceRecord } from '@/types';
import { useCallback } from 'react';

export function useServiceRecords() {
  const [serviceRecords, setServiceRecords] = useLocalStorage<ServiceRecord[]>('garage-services', []);

  const addServiceRecord = useCallback((record: Omit<ServiceRecord, 'id' | 'createdAt'>) => {
    const newRecord: ServiceRecord = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setServiceRecords((prev) => [...prev, newRecord]);
    return newRecord;
  }, [setServiceRecords]);

  const updateServiceRecord = useCallback((id: string, updates: Partial<ServiceRecord>) => {
    setServiceRecords((prev) =>
      prev.map((record) =>
        record.id === id ? { ...record, ...updates } : record
      )
    );
  }, [setServiceRecords]);

  const deleteServiceRecord = useCallback((id: string) => {
    setServiceRecords((prev) => prev.filter((record) => record.id !== id));
  }, [setServiceRecords]);

  const getServicesByVehicle = useCallback((vehicleId: string) => {
    return serviceRecords.filter((record) => record.vehicleId === vehicleId);
  }, [serviceRecords]);

  const getServicesByCustomer = useCallback((customerId: string) => {
    return serviceRecords.filter((record) => record.customerId === customerId);
  }, [serviceRecords]);

  return {
    serviceRecords,
    addServiceRecord,
    updateServiceRecord,
    deleteServiceRecord,
    getServicesByVehicle,
    getServicesByCustomer,
  };
}
