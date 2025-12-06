import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicles } from '@/hooks/useVehicles';
import { useCustomers } from '@/hooks/useCustomers';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ChevronRight, User } from 'lucide-react';

export default function Vehicles() {
  const { vehicles } = useVehicles();
  const { getCustomer } = useCustomers();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Header title="Autók" />
      <PageContainer>
        <div className="p-4 space-y-4 animate-fade-in">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Keresés rendszám, márka..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Vehicle List */}
          <div className="space-y-2">
            {filteredVehicles.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  {search ? 'Nincs találat' : 'Még nincs jármű. Adj hozzá ügyfélnél!'}
                </CardContent>
              </Card>
            ) : (
              filteredVehicles.map((vehicle) => {
                const customer = getCustomer(vehicle.customerId);
                return (
                  <Card
                    key={vehicle.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-primary">
                              {vehicle.licensePlate}
                            </span>
                            {vehicle.color && (
                              <span className="text-xs text-muted-foreground">
                                ({vehicle.color})
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {vehicle.brand} {vehicle.model}
                            {vehicle.year && ` • ${vehicle.year}`}
                          </p>
                          {customer && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <User className="h-3 w-3" />
                              {customer.name}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
