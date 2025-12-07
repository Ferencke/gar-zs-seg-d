export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  licensePlate: string;
  brand: string;
  model: string;
  year?: number;
  vin?: string;
  color?: string;
  technicalInspectionDate?: string; // Műszaki vizsga érvényessége
  createdAt: string;
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  customerId: string;
  description: string;
  date: string;
  mileage?: number;
  cost?: number;
  status: 'pending' | 'in-progress' | 'completed';
  notes?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  vehicleId?: string;
  customerName: string;
  vehicleInfo?: string;
  scheduledDate: string;
  scheduledTime: string;
  description: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}
