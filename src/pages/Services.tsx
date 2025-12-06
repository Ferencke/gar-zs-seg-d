import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServiceRecords } from '@/hooks/useServiceRecords';
import { useVehicles } from '@/hooks/useVehicles';
import { useCustomers } from '@/hooks/useCustomers';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Calendar, Car, ChevronRight } from 'lucide-react';

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
      const matchesSearch =
        service.description.toLowerCase().includes(search.toLowerCase()) ||
        vehicle?.licensePlate.toLowerCase().includes(search.toLowerCase());
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Keresés..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Tabs */}
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="all" className="text-xs">Mind</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs">Függő</TabsTrigger>
              <TabsTrigger value="in-progress" className="text-xs">Folyamat</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs">Kész</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Service List */}
          <div className="space-y-2">
            {filteredServices.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  {search || statusFilter !== 'all'
                    ? 'Nincs találat'
                    : 'Még nincs szerviz. Hozz létre egyet a járműnél!'}
                </CardContent>
              </Card>
            ) : (
              filteredServices.map((service) => {
                const vehicle = getVehicle(service.vehicleId);
                const customer = getCustomer(service.customerId);
                return (
                  <Card
                    key={service.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/services/${service.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{service.description}</p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            {vehicle && (
                              <span className="flex items-center gap-1">
                                <Car className="h-3 w-3" />
                                {vehicle.licensePlate}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(service.date).toLocaleDateString('hu-HU')}
                            </span>
                          </div>
                          {customer && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {customer.name}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
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
                              <span className="text-sm font-medium">
                                {service.cost.toLocaleString()} Ft
                              </span>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
