import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServiceRecords } from '@/hooks/useServiceRecords';
import { useVehicles } from '@/hooks/useVehicles';
import { useCustomers } from '@/hooks/useCustomers';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchFilter } from '@/components/SearchFilter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronRight, Wrench, CalendarDays, ChevronLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateToLocal } from '@/utils/dateUtils';

type ViewMode = 'list' | 'calendar';

export default function Services() {
  const { serviceRecords } = useServiceRecords();
  const { getVehicle } = useVehicles();
  const { getCustomer } = useCustomers();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const filteredServices = serviceRecords.filter(service => {
    const vehicle = getVehicle(service.vehicleId);
    const customer = getCustomer(service.customerId);
    const matchesSearch = service.description.toLowerCase().includes(search.toLowerCase()) || 
      (vehicle?.licensePlate && vehicle.licensePlate.toLowerCase().includes(search.toLowerCase())) || 
      (vehicle?.brand && vehicle.brand.toLowerCase().includes(search.toLowerCase())) || 
      (customer?.name && customer.name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

  const getServicesForDate = (date: Date) => {
    const dateStr = formatDateToLocal(date);
    return serviceRecords.filter(s => s.date === dateStr);
  };

  const navigateCalendar = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);
  const dayNames = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDateServices = selectedDate ? getServicesForDate(selectedDate) : [];

  return (
    <>
      <Header title="Szerviz" />
      <PageContainer>
        <div className="p-4 space-y-4 animate-fade-in">
          {/* Search */}
          <SearchFilter search={search} onSearchChange={setSearch} placeholder="Keresés leírás, rendszám, ügyfél..." />

          {/* View Mode Tabs */}
          <div className="flex gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="flex-1">
              <TabsList className="w-full grid grid-cols-2 bg-secondary/50">
                <TabsTrigger value="list" className="text-xs gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Wrench className="h-3 w-3" />
                  Lista
                </TabsTrigger>
                <TabsTrigger value="calendar" className="text-xs gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <CalendarDays className="h-3 w-3" />
                  Visszatekintés
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {viewMode === 'list' ? (
            <>
              {/* Status Tabs */}
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="all" className="text-xs">Mind</TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs">Függő</TabsTrigger>
                  <TabsTrigger value="in-progress" className="text-xs">Folyamat</TabsTrigger>
                  <TabsTrigger value="completed" className="text-xs">Kész</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Results count */}
              <p className="text-xs text-muted-foreground">
                {filteredServices.length} szerviz{(search || statusFilter !== 'all') && ` (szűrve)`}
              </p>

              {/* Service List */}
              <div className="space-y-2">
                {filteredServices.length === 0 ? (
                  <Card className="bg-gradient-to-br from-warning/5 to-success/5 border-warning/20">
                    <CardContent className="p-8 text-center">
                      <Wrench className="h-12 w-12 mx-auto text-warning/30 mb-3" />
                      <p className="text-muted-foreground">
                        {search || statusFilter !== 'all' ? 'Nincs találat' : 'Még nincs szerviz. Hozz létre egyet a járműnél!'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredServices.map(service => {
                    const vehicle = getVehicle(service.vehicleId);
                    const customer = getCustomer(service.customerId);
                    const statusGradient = service.status === 'completed' 
                      ? 'from-card to-success/5 hover:border-success/30' 
                      : service.status === 'in-progress' 
                        ? 'from-card to-primary/5 hover:border-primary/30' 
                        : 'from-card to-warning/5 hover:border-warning/30';
                    
                    return (
                      <Card 
                        key={service.id} 
                        className={`cursor-pointer hover:shadow-md transition-all bg-gradient-to-r ${statusGradient}`} 
                        onClick={() => navigate(`/services/${service.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className={`p-2 rounded-lg shrink-0 ${
                                service.status === 'completed' ? 'bg-success/10' : 
                                service.status === 'in-progress' ? 'bg-primary/10' : 'bg-warning/10'
                              }`}>
                                <Wrench className={`h-4 w-4 ${
                                  service.status === 'completed' ? 'text-success' : 
                                  service.status === 'in-progress' ? 'text-primary' : 'text-warning'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{service.description}</p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                                  {vehicle && (
                                    <span className="flex items-center gap-1">
                                      {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    {new Date(service.date).toLocaleDateString('hu-HU')}
                                  </span>
                                </div>
                                {customer && (
                                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    {customer.name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col items-end gap-1">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  service.status === 'completed' ? 'bg-success/10 text-success' : 
                                  service.status === 'in-progress' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
                                }`}>
                                  {service.status === 'completed' ? 'Kész' : 
                                   service.status === 'in-progress' ? 'Folyamatban' : 'Függőben'}
                                </span>
                                {service.cost && (
                                  <span className="text-sm font-bold text-success">
                                    {service.cost.toLocaleString()} Ft
                                  </span>
                                )}
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            /* Calendar View */
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigateCalendar(-1)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <CardTitle className="text-base">
                    {currentDate.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' })}
                  </CardTitle>
                  <button
                    onClick={() => navigateCalendar(1)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {monthDays.map((date, index) => {
                    if (!date) return <div key={`empty-${index}`} className="aspect-square" />;

                    const dayServices = getServicesForDate(date);
                    const serviceCount = dayServices.length;
                    const hasServices = serviceCount > 0;
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    const isFuture = date > today;

                    return (
                      <div
                        key={date.toISOString()}
                        onClick={() => hasServices && setSelectedDate(isSelected ? null : date)}
                        className={cn(
                          'aspect-square p-1 border rounded-md flex flex-col cursor-pointer transition-colors',
                          isToday && 'bg-primary/10 border-primary',
                          isFuture && 'opacity-50',
                          isSelected && 'ring-2 ring-primary',
                          hasServices && !isFuture && 'hover:bg-secondary/50',
                          !hasServices && 'cursor-default'
                        )}
                      >
                        <span className={cn(
                          'text-xs font-medium',
                          isToday && 'text-primary'
                        )}>
                          {date.getDate()}
                        </span>
                        {hasServices && !isFuture && (
                          <div className="flex-1 flex items-center justify-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-success/20 text-success rounded-full text-xs font-bold">
                              {serviceCount}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center text-[10px] font-bold text-success">
                      3
                    </span>
                    Elvégzett szervizek száma
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Selected Date Services Dialog */}
        <Dialog open={selectedDate !== null} onOpenChange={(open) => !open && setSelectedDate(null)}>
          <DialogContent className="mx-4 max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                {selectedDate?.toLocaleDateString('hu-HU', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {selectedDateServices.map((service) => {
                const vehicle = getVehicle(service.vehicleId);
                const customer = getCustomer(service.customerId);

                return (
                  <Card 
                    key={service.id}
                    className={cn(
                      'cursor-pointer hover:shadow-md transition-all',
                      service.status === 'completed' 
                        ? 'bg-gradient-to-r from-success/10 to-transparent border-success/30' 
                        : service.status === 'in-progress'
                          ? 'bg-gradient-to-r from-primary/10 to-transparent border-primary/30'
                          : 'bg-gradient-to-r from-warning/10 to-transparent border-warning/30'
                    )}
                    onClick={() => {
                      setSelectedDate(null);
                      navigate(`/services/${service.id}`);
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{service.description}</p>
                          {vehicle && (
                            <p className="text-sm text-muted-foreground">
                              {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                            </p>
                          )}
                          {customer && (
                            <p className="text-xs text-primary mt-1">{customer.name}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className={cn(
                            'text-xs px-2 py-1 rounded font-medium',
                            service.status === 'completed' 
                              ? 'bg-success/20 text-success' 
                              : service.status === 'in-progress'
                                ? 'bg-primary/20 text-primary'
                                : 'bg-warning/20 text-warning'
                          )}>
                            {service.status === 'completed' ? 'Kész' : 
                             service.status === 'in-progress' ? 'Folyamat' : 'Függő'}
                          </span>
                          {service.cost && (
                            <p className="text-sm font-bold text-success mt-1">
                              {service.cost.toLocaleString()} Ft
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {selectedDateServices.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nincs szerviz ezen a napon
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
