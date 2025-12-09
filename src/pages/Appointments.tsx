import { useState, useMemo } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Clock, Car, User, Trash2, Check, X, ChevronLeft, ChevronRight, Edit, List, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Appointment } from '@/types';

type ViewMode = 'list' | 'month' | 'week';

export default function Appointments() {
  const { appointments, addAppointment, updateAppointment, deleteAppointment, getUpcomingAppointments } = useAppointments();
  const { customers } = useCustomers();
  const { vehicles, getVehiclesByCustomer } = useVehicles();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
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

  // Calendar helpers
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday first
    
    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const getWeekDays = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - (day === 0 ? 6 : day - 1);
    const monday = new Date(date);
    monday.setDate(diff);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(a => a.scheduledDate === dateStr && a.status === 'scheduled');
  };

  const navigateCalendar = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else {
      newDate.setDate(newDate.getDate() + direction * 7);
    }
    setCurrentDate(newDate);
  };

  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const resetForm = () => {
    setSelectedCustomerId('');
    setFormData({
      vehicleId: '',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '09:00',
      description: '',
      notes: '',
    });
  };

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
      vehicleBrand: vehicle?.brand,
      vehicleModel: vehicle?.model,
      vehicleLicensePlate: vehicle?.licensePlate,
      vehicleInfo: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})` : undefined,
      scheduledDate: formData.scheduledDate,
      scheduledTime: formData.scheduledTime,
      description: formData.description,
      notes: formData.notes || undefined,
      status: 'scheduled',
    });

    toast.success('Előjegyzés létrehozva!');
    setIsOpen(false);
    resetForm();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;

    const vehicle = formData.vehicleId ? vehicles.find((v) => v.id === formData.vehicleId) : null;

    updateAppointment(editingAppointment.id, {
      vehicleId: formData.vehicleId || undefined,
      vehicleBrand: vehicle?.brand,
      vehicleModel: vehicle?.model,
      vehicleLicensePlate: vehicle?.licensePlate,
      vehicleInfo: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})` : undefined,
      scheduledDate: formData.scheduledDate,
      scheduledTime: formData.scheduledTime,
      description: formData.description,
      notes: formData.notes || undefined,
    });

    toast.success('Előjegyzés frissítve!');
    setIsEditOpen(false);
    setEditingAppointment(null);
    resetForm();
  };

  const openEditDialog = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setSelectedCustomerId(appointment.customerId);
    setFormData({
      vehicleId: appointment.vehicleId || '',
      scheduledDate: appointment.scheduledDate,
      scheduledTime: appointment.scheduledTime,
      description: appointment.description,
      notes: appointment.notes || '',
    });
    setIsEditOpen(true);
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

  const dayNames = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const renderAppointmentForm = (onSubmit: (e: React.FormEvent) => void, isEdit = false) => (
    <form onSubmit={onSubmit} className="space-y-4">
      {!isEdit && (
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
      )}

      {(isEdit ? getVehiclesByCustomer(editingAppointment?.customerId || '') : customerVehicles).length > 0 && (
        <div className="space-y-2">
          <Label>Autó (opcionális)</Label>
          <Select value={formData.vehicleId} onValueChange={(v) => setFormData({ ...formData, vehicleId: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Válassz autót..." />
            </SelectTrigger>
            <SelectContent>
              {(isEdit ? getVehiclesByCustomer(editingAppointment?.customerId || '') : customerVehicles).map((vehicle) => (
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
  );

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const renderCalendarDay = (date: Date | null, isCompact = false) => {
    if (!date) return <div className="aspect-square" />;
    
    const dayAppointments = getAppointmentsForDate(date);
    const isToday = date.toDateString() === new Date().toDateString();
    const isPast = date < today;
    const isSelected = selectedDate?.toDateString() === date.toDateString();
    
    return (
      <div 
        onClick={() => dayAppointments.length > 0 && setSelectedDate(isSelected ? null : date)}
        className={cn(
          'aspect-square p-1 border border-border rounded-md flex flex-col cursor-pointer transition-colors',
          isToday && 'bg-primary/10 border-primary',
          isPast && 'opacity-50',
          isSelected && 'ring-2 ring-primary',
          dayAppointments.length > 0 && 'hover:bg-secondary/50'
        )}
      >
        <span className={cn(
          'text-xs font-medium',
          isToday && 'text-primary'
        )}>
          {date.getDate()}
        </span>
        {dayAppointments.length > 0 && (
          <div className="flex-1 overflow-hidden">
            {isCompact ? (
              <div className="text-xs text-center mt-1">
                <span className="inline-flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground rounded-full text-[10px]">
                  {dayAppointments.length}
                </span>
              </div>
            ) : (
              <div className="space-y-0.5 mt-0.5">
                {dayAppointments.slice(0, 2).map((apt) => (
                  <div key={apt.id} className="text-[9px] bg-primary/10 text-primary px-1 rounded truncate">
                    {apt.vehicleBrand || apt.description.slice(0, 10)}
                  </div>
                ))}
                {dayAppointments.length > 2 && (
                  <div className="text-[9px] text-muted-foreground text-center">
                    +{dayAppointments.length - 2}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Header
        title="Előjegyzések"
        action={
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
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
              {renderAppointmentForm(handleSubmit)}
            </DialogContent>
          </Dialog>
        }
      />
      <PageContainer>
        <div className="p-4 space-y-4 animate-fade-in">
          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="list" className="text-xs gap-1">
                <List className="h-3 w-3" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="week" className="text-xs gap-1">
                <CalendarDays className="h-3 w-3" />
                Heti
              </TabsTrigger>
              <TabsTrigger value="month" className="text-xs gap-1">
                <Calendar className="h-3 w-3" />
                Havi
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Calendar Views */}
          {viewMode !== 'list' && (
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateCalendar(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium">
                    {currentDate.toLocaleDateString('hu-HU', { 
                      year: 'numeric', 
                      month: 'long',
                      ...(viewMode === 'week' && { day: 'numeric' })
                    })}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateCalendar(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {viewMode === 'month' && (
                  <>
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {dayNames.map((day) => (
                        <div key={day} className="text-center text-xs text-muted-foreground font-medium">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {monthDays.map((date, i) => (
                        <div key={i}>{renderCalendarDay(date, true)}</div>
                      ))}
                    </div>
                    
                    {/* Selected Day Details */}
                    {selectedDate && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-sm">
                            {selectedDate.toLocaleDateString('hu-HU', { month: 'long', day: 'numeric', weekday: 'long' })}
                          </h3>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedDate(null)}>
                            Bezár
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {getAppointmentsForDate(selectedDate).map((apt) => (
                            <div key={apt.id} className="text-sm flex items-start gap-2 bg-secondary/50 p-2 rounded">
                              <span className="text-muted-foreground shrink-0">{apt.scheduledTime}</span>
                              <div className="flex-1 min-w-0">
                                <span className="font-medium">{apt.vehicleBrand} {apt.vehicleModel}</span>
                                {apt.vehicleLicensePlate && (
                                  <span className="text-muted-foreground ml-1">({apt.vehicleLicensePlate})</span>
                                )}
                                <p className="text-xs text-muted-foreground truncate">{apt.description}</p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 shrink-0"
                                onClick={() => openEditDialog(apt)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {viewMode === 'week' && (
                  <div className="space-y-2">
                    {weekDays.map((date) => {
                      const dayAppointments = getAppointmentsForDate(date);
                      const isToday = date.toDateString() === new Date().toDateString();
                      return (
                        <div key={date.toISOString()} className={cn(
                          'p-2 rounded-md border border-border',
                          isToday && 'bg-primary/5 border-primary'
                        )}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={cn(
                              'text-sm font-medium',
                              isToday && 'text-primary'
                            )}>
                              {date.toLocaleDateString('hu-HU', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            {dayAppointments.length > 0 && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {dayAppointments.length} javítás
                              </span>
                            )}
                          </div>
                          {dayAppointments.length > 0 ? (
                            <div className="space-y-1">
                              {dayAppointments.map((apt) => (
                                <div key={apt.id} className="text-xs flex items-start gap-2 bg-secondary/50 p-1.5 rounded">
                                  <span className="text-muted-foreground shrink-0">{apt.scheduledTime}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <span className="font-medium">{apt.vehicleBrand} {apt.vehicleModel}</span>
                                      {apt.vehicleLicensePlate && (
                                        <span className="text-muted-foreground">({apt.vehicleLicensePlate})</span>
                                      )}
                                    </div>
                                    <p className="text-muted-foreground truncate">{apt.description}</p>
                                  </div>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 shrink-0"
                                    onClick={() => openEditDialog(apt)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Nincs előjegyzés</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <>
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
                              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {appointment.customerName}
                                </span>
                                {(appointment.vehicleBrand || appointment.vehicleInfo) && (
                                  <span className="flex items-center gap-1">
                                    <Car className="h-3 w-3" />
                                    {appointment.vehicleBrand && appointment.vehicleModel 
                                      ? `${appointment.vehicleBrand} ${appointment.vehicleModel}`
                                      : appointment.vehicleInfo?.split('(')[0]?.trim()}
                                    {appointment.vehicleLicensePlate && (
                                      <span className="font-mono font-medium text-foreground">
                                        ({appointment.vehicleLicensePlate})
                                      </span>
                                    )}
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
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => openEditDialog(appointment)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
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
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium truncate">{appointment.description}</p>
                                <span
                                  className={cn(
                                    'text-xs px-2 py-0.5 rounded-full shrink-0',
                                    appointment.status === 'completed'
                                      ? 'bg-success/10 text-success'
                                      : 'bg-destructive/10 text-destructive'
                                  )}
                                >
                                  {appointment.status === 'completed' ? 'Teljesítve' : 'Lemondva'}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {appointment.customerName}
                                {appointment.vehicleBrand && ` • ${appointment.vehicleBrand} ${appointment.vehicleModel}`}
                                {appointment.vehicleLicensePlate && ` (${appointment.vehicleLicensePlate})`}
                                {' • '}{new Date(appointment.scheduledDate).toLocaleDateString('hu-HU')}
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
            </>
          )}
        </div>
      </PageContainer>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) { setEditingAppointment(null); resetForm(); }}}>
        <DialogContent className="mx-4 max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Előjegyzés szerkesztése</DialogTitle>
          </DialogHeader>
          {renderAppointmentForm(handleEditSubmit, true)}
        </DialogContent>
      </Dialog>
    </>
  );
}
