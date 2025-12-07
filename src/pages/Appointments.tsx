import { useState } from 'react';
import { useAppointments } from '@/hooks/useAppointments';
import { useCustomers } from '@/hooks/useCustomers';
import { useVehicles } from '@/hooks/useVehicles';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Calendar, Clock, Car, User, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Appointments() {
  const { appointments, addAppointment, updateAppointment, deleteAppointment, getUpcomingAppointments } = useAppointments();
  const { customers } = useCustomers();
  const { vehicles, getVehiclesByCustomer } = useVehicles();
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [formData, setFormData] = useState({
    vehicleId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '09:00',
    description: '',
    notes: '',
  });

  const upcomingAppointments = getUpcomingAppointments();
  const pastAppointments = appointments
    .filter((a) => a.status !== 'scheduled' || new Date(a.scheduledDate) < new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
    .slice(0, 10);

  const customerVehicles = selectedCustomerId ? getVehiclesByCustomer(selectedCustomerId) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !formData.description || !formData.scheduledDate) {
      toast.error('Ügyfél, leírás és dátum kötelező!');
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustomerId);
    const vehicle = formData.vehicleId ? vehicles.find((v) => v.id === formData.vehicleId) : null;

    addAppointment({
      customerId: selectedCustomerId,
      vehicleId: formData.vehicleId || undefined,
      customerName: customer?.name || '',
      vehicleInfo: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})` : undefined,
      scheduledDate: formData.scheduledDate,
      scheduledTime: formData.scheduledTime,
      description: formData.description,
      notes: formData.notes || undefined,
      status: 'scheduled',
    });

    toast.success('Előjegyzés létrehozva!');
    setIsOpen(false);
    setSelectedCustomerId('');
    setFormData({
      vehicleId: '',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '09:00',
      description: '',
      notes: '',
    });
  };

  const handleComplete = (id: string) => {
    updateAppointment(id, { status: 'completed' });
    toast.success('Előjegyzés teljesítve!');
  };

  const handleCancel = (id: string) => {
    updateAppointment(id, { status: 'cancelled' });
    toast.success('Előjegyzés lemondva!');
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return 'Ma';
    if (d.toDateString() === tomorrow.toDateString()) return 'Holnap';
    return d.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', weekday: 'short' });
  };

  return (
    <>
      <Header
        title="Előjegyzések"
        action={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9">
                <Plus className="h-4 w-4 mr-1" />
                Új
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Új előjegyzés</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Ügyfél *</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Válassz ügyfelet..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {customerVehicles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Autó (opcionális)</Label>
                    <Select value={formData.vehicleId} onValueChange={(v) => setFormData({ ...formData, vehicleId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Válassz autót..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customerVehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Dátum *</Label>
                    <Input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Időpont</Label>
                    <Input
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Leírás *</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mit kell csinálni?"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Megjegyzés</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="További részletek..."
                    rows={2}
                  />
                </div>

                <Button type="submit" className="w-full">Mentés</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <PageContainer>
        <div className="p-4 space-y-6 animate-fade-in">
          {/* Upcoming Appointments */}
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Közelgő előjegyzések</h2>
            {upcomingAppointments.length === 0 ? (
              <Card className="bg-secondary/30">
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Nincsenek közelgő előjegyzések</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <Card key={appointment.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
                              {formatDate(appointment.scheduledDate)}
                            </span>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {appointment.scheduledTime}
                            </span>
                          </div>
                          <p className="font-medium mb-1">{appointment.description}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {appointment.customerName}
                            </span>
                            {appointment.vehicleInfo && (
                              <span className="flex items-center gap-1">
                                <Car className="h-3 w-3" />
                                {appointment.vehicleInfo}
                              </span>
                            )}
                          </div>
                          {appointment.notes && (
                            <p className="text-xs text-muted-foreground mt-2 italic">{appointment.notes}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                            onClick={() => handleComplete(appointment.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleCancel(appointment.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Past Appointments */}
          {pastAppointments.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">Korábbi előjegyzések</h2>
              <div className="space-y-2">
                {pastAppointments.map((appointment) => (
                  <Card key={appointment.id} className="bg-secondary/30">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{appointment.description}</p>
                            <span
                              className={cn(
                                'text-xs px-2 py-0.5 rounded-full',
                                appointment.status === 'completed'
                                  ? 'bg-success/10 text-success'
                                  : 'bg-destructive/10 text-destructive'
                              )}
                            >
                              {appointment.status === 'completed' ? 'Teljesítve' : 'Lemondva'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {appointment.customerName} • {new Date(appointment.scheduledDate).toLocaleDateString('hu-HU')}
                          </p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="mx-4 max-w-md">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Előjegyzés törlése</AlertDialogTitle>
                              <AlertDialogDescription>
                                Biztosan törölni szeretnéd ezt az előjegyzést?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Mégse</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteAppointment(appointment.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Törlés
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
}
