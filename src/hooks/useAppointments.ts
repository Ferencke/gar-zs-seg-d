import { useLocalStorage } from './useLocalStorage';
import { Appointment } from '@/types';
import { useCallback } from 'react';
import { formatDateToLocal } from '@/utils/dateUtils';

export function useAppointments() {
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('garage-appointments', []);

  const addAppointment = useCallback((appointment: Omit<Appointment, 'id' | 'createdAt'>) => {
    const newAppointment: Appointment = {
      ...appointment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setAppointments((prev) => [...prev, newAppointment]);
    return newAppointment;
  }, [setAppointments]);

  const updateAppointment = useCallback((id: string, updates: Partial<Appointment>) => {
    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === id ? { ...appointment, ...updates } : appointment
      )
    );
  }, [setAppointments]);

  const deleteAppointment = useCallback((id: string) => {
    setAppointments((prev) => prev.filter((appointment) => appointment.id !== id));
  }, [setAppointments]);

  const getUpcomingAppointments = useCallback(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return appointments
      .filter((a) => a.status === 'scheduled' && new Date(a.scheduledDate) >= now)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }, [appointments]);

  const getTodayAppointments = useCallback(() => {
    const today = formatDateToLocal(new Date());
    return appointments
      .filter((a) => a.scheduledDate === today && a.status === 'scheduled')
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [appointments]);

  return {
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getUpcomingAppointments,
    getTodayAppointments,
  };
}
