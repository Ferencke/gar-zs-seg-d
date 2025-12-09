import { useState, useEffect, useCallback } from 'react';
import { useVehicles } from './useVehicles';
import { useAppointments } from './useAppointments';

interface Notification {
  id: string;
  type: 'inspection' | 'appointment';
  title: string;
  message: string;
  date: Date;
  read: boolean;
  vehicleId?: string;
  appointmentId?: string;
}

export function useNotifications() {
  const { vehicles } = useVehicles();
  const { appointments } = useAppointments();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const generateNotifications = useCallback(() => {
    const newNotifications: Notification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Lejáró műszaki vizsgálatok (30 napon belül)
    vehicles.forEach((vehicle) => {
      if (!vehicle.technicalInspectionDate) return;
      const inspectionDate = new Date(vehicle.technicalInspectionDate);
      const days = Math.ceil((inspectionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (days <= 30) {
        newNotifications.push({
          id: `inspection-${vehicle.id}`,
          type: 'inspection',
          title: days < 0 ? 'Lejárt műszaki!' : 'Lejáró műszaki vizsga',
          message: `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate}) - ${days < 0 ? `${Math.abs(days)} napja lejárt` : `${days} nap múlva lejár`}`,
          date: inspectionDate,
          read: false,
          vehicleId: vehicle.id,
        });
      }
    });

    // Közelgő előjegyzések (3 napon belül)
    appointments
      .filter((a) => a.status === 'scheduled')
      .forEach((appointment) => {
        const appointmentDate = new Date(appointment.scheduledDate);
        const days = Math.ceil((appointmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (days >= 0 && days <= 3) {
          newNotifications.push({
            id: `appointment-${appointment.id}`,
            type: 'appointment',
            title: days === 0 ? 'Mai előjegyzés' : days === 1 ? 'Holnapi előjegyzés' : 'Közelgő előjegyzés',
            message: `${appointment.customerName} - ${appointment.description} (${appointment.scheduledTime})`,
            date: appointmentDate,
            read: false,
            appointmentId: appointment.id,
          });
        }
      });

    // Rendezés dátum szerint
    newNotifications.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Meglévő olvasott státusz megőrzése
    const readIds = new Set(
      JSON.parse(localStorage.getItem('readNotifications') || '[]')
    );
    
    setNotifications(
      newNotifications.map((n) => ({
        ...n,
        read: readIds.has(n.id),
      }))
    );
  }, [vehicles, appointments]);

  useEffect(() => {
    generateNotifications();
  }, [generateNotifications]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    const readIds = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    if (!readIds.includes(id)) {
      localStorage.setItem('readNotifications', JSON.stringify([...readIds, id]));
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const allIds = notifications.map((n) => n.id);
    localStorage.setItem('readNotifications', JSON.stringify(allIds));
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
