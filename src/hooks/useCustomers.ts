import { useLocalStorage } from './useLocalStorage';
import { Customer } from '@/types';
import { useCallback } from 'react';

export function useCustomers() {
  const [customers, setCustomers] = useLocalStorage<Customer[]>('garage-customers', []);

  const addCustomer = useCallback((customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [...prev, newCustomer]);
    return newCustomer;
  }, [setCustomers]);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === id ? { ...customer, ...updates } : customer
      )
    );
  }, [setCustomers]);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers((prev) => prev.filter((customer) => customer.id !== id));
  }, [setCustomers]);

  const getCustomer = useCallback((id: string) => {
    return customers.find((customer) => customer.id === id);
  }, [customers]);

  return {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomer,
  };
}
