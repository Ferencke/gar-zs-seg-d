import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicles } from '@/hooks/useVehicles';
import { useCustomers } from '@/hooks/useCustomers';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { SearchFilter } from '@/components/SearchFilter';
import { ChevronRight, User, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
export default function Vehicles() {
  const {
    vehicles
  } = useVehicles();
  const {
    getCustomer
  } = useCustomers();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // Get unique brands for filter
  const uniqueBrands = [...new Set(vehicles.map(v => v.brand))].sort();
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.licensePlate.toLowerCase().includes(search.toLowerCase()) || vehicle.brand.toLowerCase().includes(search.toLowerCase()) || vehicle.model.toLowerCase().includes(search.toLowerCase()) || vehicle.vin && vehicle.vin.toLowerCase().includes(search.toLowerCase());
    const matchesBrand = brandFilter.length === 0 || brandFilter.includes(vehicle.brand);
    const hasExpiring = vehicle.technicalInspectionDate && Math.ceil((new Date(vehicle.technicalInspectionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 30;
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes('expiring') && hasExpiring || statusFilter.includes('ok') && !hasExpiring;
    return matchesSearch && matchesBrand && matchesStatus;
  });
  const toggleBrandFilter = (brand: string) => {
    setBrandFilter(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  };
  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };
  return <>
      <Header title="Autók" />
      <PageContainer>
        <div className="p-4 space-y-4 animate-fade-in">
          {/* Search and Filters */}
          <SearchFilter search={search} onSearchChange={setSearch} placeholder="Keresés rendszám, márka, modell, alvázszám..." filters={[{
          label: 'Márka',
          options: uniqueBrands.slice(0, 4).map(brand => ({
            id: brand,
            label: brand
          })),
          selected: brandFilter,
          onToggle: toggleBrandFilter
        }, {
          label: 'Státusz',
          options: [{
            id: 'expiring',
            label: 'Lejáró műszaki'
          }, {
            id: 'ok',
            label: 'Rendben'
          }],
          selected: statusFilter,
          onToggle: toggleStatusFilter
        }]} />

          {/* Results count */}
          <p className="text-xs text-muted-foreground">
            {filteredVehicles.length} autó{(search || brandFilter.length > 0 || statusFilter.length > 0) && ` (szűrve)`}
          </p>

          {/* Vehicle List */}
          <div className="space-y-2">
            {filteredVehicles.length === 0 ? <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  {search || brandFilter.length > 0 || statusFilter.length > 0 ? 'Nincs találat' : 'Még nincs jármű. Adj hozzá ügyfélnél!'}
                </CardContent>
              </Card> : filteredVehicles.map(vehicle => {
            const customer = getCustomer(vehicle.customerId);
            const hasExpiring = vehicle.technicalInspectionDate && Math.ceil((new Date(vehicle.technicalInspectionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 30;
            const daysUntilExpiry = vehicle.technicalInspectionDate ? Math.ceil((new Date(vehicle.technicalInspectionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
            return <Card key={vehicle.id} className={cn('cursor-pointer hover:shadow-md transition-shadow', hasExpiring && 'border-warning')} onClick={() => navigate(`/vehicles/${vehicle.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-primary">
                              {vehicle.licensePlate}
                            </span>
                            {hasExpiring && <span className={cn('text-xs px-1.5 py-0.5 rounded flex items-center gap-1', daysUntilExpiry !== null && daysUntilExpiry < 0 ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning')}>
                                <AlertTriangle className="h-3 w-3" />
                                {daysUntilExpiry !== null && daysUntilExpiry < 0 ? 'Lejárt' : `${daysUntilExpiry} nap`}
                              </span>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {vehicle.brand} {vehicle.model}
                            {vehicle.year && ` • ${vehicle.year}`}
                            {vehicle.fuelType && ` • ${vehicle.fuelType}`}
                          </p>
                          {customer && <p className="text-xs flex items-center gap-1 mt-1 text-destructive">
                              <User className="h-3 w-3" />
                              {customer.name}
                            </p>}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>;
          })}
          </div>
        </div>
      </PageContainer>
    </>;
}