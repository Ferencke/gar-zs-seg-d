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
  technicalInspectionDate?: string;
  // New fields
  engineCode?: string;
  ecuType?: string;
  displacement?: number; // cm³
  power?: number; // kW or HP
  fuelType?: string;
  createdAt: string;
}

export interface Part {
  id: string;
  name: string;
  partNumber?: string;
  quantity: number;
  price?: number;
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
  parts?: Part[];
  photos?: string[];
  laborHours?: number;
  location?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  vehicleId?: string;
  customerName: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleLicensePlate?: string;
  vehicleInfo?: string;
  scheduledDate: string;
  scheduledTime: string;
  description: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}
