import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicles } from '@/hooks/useVehicles';
import { useCustomers } from '@/hooks/useCustomers';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchFilter } from '@/components/SearchFilter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronRight, User, AlertTriangle, Car, Fuel, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Vehicles() {
  const { vehicles } = useVehicles();
  const { getCustomer } = useCustomers();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [showExpiringDialog, setShowExpiringDialog] = useState(false);

  // Get unique brands for filter
  const uniqueBrands = [...new Set(vehicles.map(v => v.brand))].sort();
  
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.licensePlate.toLowerCase().includes(search.toLowerCase()) || 
      vehicle.brand.toLowerCase().includes(search.toLowerCase()) || 
      vehicle.model.toLowerCase().includes(search.toLowerCase()) || 
      (vehicle.vin && vehicle.vin.toLowerCase().includes(search.toLowerCase()));
    const matchesBrand = brandFilter.length === 0 || brandFilter.includes(vehicle.brand);
    const hasExpiring = vehicle.technicalInspectionDate && 
      Math.ceil((new Date(vehicle.technicalInspectionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 30;
    const matchesStatus = statusFilter.length === 0 || 
      (statusFilter.includes('expiring') && hasExpiring) || 
      (statusFilter.includes('ok') && !hasExpiring);
    return matchesSearch && matchesBrand && matchesStatus;
  });

  const toggleBrandFilter = (brand: string) => {
    setBrandFilter(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  // Stats
  const totalVehicles = vehicles.length;
  const expiringVehicles = vehicles.filter(v => 
    v.technicalInspectionDate && 
    Math.ceil((new Date(v.technicalInspectionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 30
  ).sort((a, b) => new Date(a.technicalInspectionDate!).getTime() - new Date(b.technicalInspectionDate!).getTime());

  return (
    <>
      <Header title="Autók" />
      <PageContainer>
        <div className="p-4 space-y-4 animate-fade-in">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Car className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-primary">{totalVehicles}</p>
                    <p className="text-xs text-muted-foreground">Összes autó</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card 
              className="bg-gradient-to-br from-warning/10 via-warning/5 to-transparent border-warning/20 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => expiringVehicles.length > 0 && setShowExpiringDialog(true)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-warning/20">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-warning">{expiringVehicles.length}</p>
                    <p className="text-xs text-muted-foreground">Lejáró műszaki</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <SearchFilter 
            search={search} 
            onSearchChange={setSearch} 
            placeholder="Keresés rendszám, márka, modell, alvázszám..." 
            filters={[
              {
                label: 'Márka',
                options: uniqueBrands.slice(0, 4).map(brand => ({
                  id: brand,
                  label: brand
                })),
                selected: brandFilter,
                onToggle: toggleBrandFilter
              }, 
              {
                label: 'Státusz',
                options: [
                  { id: 'expiring', label: 'Lejáró műszaki' }, 
                  { id: 'ok', label: 'Rendben' }
                ],
                selected: statusFilter,
                onToggle: toggleStatusFilter
              }
            ]} 
          />

          {/* Results count */}
          <p className="text-xs text-muted-foreground">
            {filteredVehicles.length} autó{(search || brandFilter.length > 0 || statusFilter.length > 0) && ` (szűrve)`}
          </p>

          {/* Vehicle List */}
          <div className="space-y-2">
            {filteredVehicles.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  {search || brandFilter.length > 0 || statusFilter.length > 0 ? 'Nincs találat' : 'Még nincs jármű. Adj hozzá ügyfélnél!'}
                </CardContent>
              </Card>
            ) : (
              filteredVehicles.map(vehicle => {
                const customer = getCustomer(vehicle.customerId);
                const hasExpiring = vehicle.technicalInspectionDate && 
                  Math.ceil((new Date(vehicle.technicalInspectionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 30;
                const daysUntilExpiry = vehicle.technicalInspectionDate 
                  ? Math.ceil((new Date(vehicle.technicalInspectionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) 
                  : null;
                
                return (
                  <Card 
                    key={vehicle.id} 
                    className={cn(
                      'cursor-pointer hover:shadow-md transition-all hover:scale-[1.01]',
                      hasExpiring 
                        ? 'bg-gradient-to-br from-warning/10 via-warning/5 to-transparent border-warning/30' 
                        : 'bg-gradient-to-br from-primary/5 via-transparent to-transparent border-border/50 hover:border-primary/30'
                    )} 
                    onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              'p-1.5 rounded-lg',
                              hasExpiring ? 'bg-warning/20' : 'bg-primary/10'
                            )}>
                              <Car className={cn('h-4 w-4', hasExpiring ? 'text-warning' : 'text-primary')} />
                            </div>
                            {/* Vehicle type highlighted with displacement and year inline */}
                            <span className="font-bold text-foreground">
                              {vehicle.brand} {vehicle.model}
                              {vehicle.displacement && <span className="font-normal text-muted-foreground ml-1">{vehicle.displacement} cm³</span>}
                              {vehicle.year && <span className="font-normal text-muted-foreground ml-1">({vehicle.year})</span>}
                            </span>
                            {hasExpiring && (
                              <span className={cn(
                                'text-xs px-1.5 py-0.5 rounded flex items-center gap-1',
                                daysUntilExpiry !== null && daysUntilExpiry < 0 
                                  ? 'bg-destructive/10 text-destructive' 
                                  : 'bg-warning/10 text-warning'
                              )}>
                                <AlertTriangle className="h-3 w-3" />
                                {daysUntilExpiry !== null && daysUntilExpiry < 0 ? 'Lejárt' : `${daysUntilExpiry} nap`}
                              </span>
                            )}
                          </div>
                          {/* Displacement and year inline with type - no icons */}
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className="font-mono text-sm text-muted-foreground">
                              {vehicle.licensePlate}
                            </span>
                            {vehicle.fuelType && (
                              <span className="text-xs text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
                                {vehicle.fuelType}
                              </span>
                            )}
                          </div>
                          {customer && (
                            <p className="text-xs flex items-center gap-1 mt-2 text-primary">
                              <User className="h-3 w-3" />
                              {customer.name}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Expiring Vehicles Dialog */}
        <Dialog open={showExpiringDialog} onOpenChange={setShowExpiringDialog}>
          <DialogContent className="mx-4 max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Lejáró műszakik ({expiringVehicles.length})
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {expiringVehicles.map((vehicle) => {
                const customer = getCustomer(vehicle.customerId);
                const daysUntilExpiry = Math.ceil(
                  (new Date(vehicle.technicalInspectionDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                const isExpired = daysUntilExpiry < 0;

                return (
                  <Card 
                    key={vehicle.id}
                    className={cn(
                      'cursor-pointer hover:shadow-md transition-all',
                      isExpired 
                        ? 'bg-gradient-to-r from-destructive/10 to-transparent border-destructive/30' 
                        : 'bg-gradient-to-r from-warning/10 to-transparent border-warning/30'
                    )}
                    onClick={() => {
                      setShowExpiringDialog(false);
                      navigate(`/vehicles/${vehicle.id}`);
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{vehicle.brand} {vehicle.model}</p>
                          <p className="text-sm text-muted-foreground">{vehicle.licensePlate}</p>
                          {customer && (
                            <p className="text-xs text-primary mt-1">{customer.name}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            'text-xs px-2 py-1 rounded font-medium',
                            isExpired 
                              ? 'bg-destructive/20 text-destructive' 
                              : 'bg-warning/20 text-warning'
                          )}>
                            {isExpired ? `${Math.abs(daysUntilExpiry)} napja lejárt` : `${daysUntilExpiry} nap`}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(vehicle.technicalInspectionDate!).toLocaleDateString('hu-HU')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {expiringVehicles.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nincs lejáró műszakis jármű
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
