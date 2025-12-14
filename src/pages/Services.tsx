import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServiceRecords } from '@/hooks/useServiceRecords';
import { useVehicles } from '@/hooks/useVehicles';
import { useCustomers } from '@/hooks/useCustomers';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchFilter } from '@/components/SearchFilter';
import { Calendar, Car, ChevronRight, User, Wrench } from 'lucide-react';

export default function Services() {
  const { serviceRecords } = useServiceRecords();
  const { getVehicle } = useVehicles();
  const { getCustomer } = useCustomers();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredServices = serviceRecords
    .filter((service) => {
      const vehicle = getVehicle(service.vehicleId);
      const customer = getCustomer(service.customerId);
      const matchesSearch =
        service.description.toLowerCase().includes(search.toLowerCase()) ||
        (vehicle?.licensePlate && vehicle.licensePlate.toLowerCase().includes(search.toLowerCase())) ||
        (vehicle?.brand && vehicle.brand.toLowerCase().includes(search.toLowerCase())) ||
        (customer?.name && customer.name.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <Header title="Szerviz" />
      <PageContainer>
        <div className="p-4 space-y-4 animate-fade-in">
          {/* Search */}
          <SearchFilter
            search={search}
            onSearchChange={setSearch}
            placeholder="Keresés leírás, rendszám, ügyfél..."
          />

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
                    {search || statusFilter !== 'all'
                      ? 'Nincs találat'
                      : 'Még nincs szerviz. Hozz létre egyet a járműnél!'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredServices.map((service) => {
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
                                  <Car className="h-3 w-3 text-accent" />
                                  {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-primary" />
                                {new Date(service.date).toLocaleDateString('hu-HU')}
                              </span>
                            </div>
                            {customer && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <User className="h-3 w-3 text-primary/60" />
                                {customer.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${
                                service.status === 'completed'
                                  ? 'bg-success/10 text-success'
                                  : service.status === 'in-progress'
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-warning/10 text-warning'
                              }`}
                            >
                              {service.status === 'completed'
                                ? 'Kész'
                                : service.status === 'in-progress'
                                ? 'Folyamatban'
                                : 'Függőben'}
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
        </div>
      </PageContainer>
    </>
  );
}
