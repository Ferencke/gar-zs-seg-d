import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '@/hooks/useCustomers';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SearchFilter } from '@/components/SearchFilter';
import { Plus, Phone, Mail, ChevronRight, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';
export default function Customers() {
  const {
    customers,
    addCustomer
  } = useCustomers();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [sortFilter, setSortFilter] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const filteredCustomers = customers.filter(customer => customer.name.toLowerCase().includes(search.toLowerCase()) || customer.phone.includes(search) || customer.email && customer.email.toLowerCase().includes(search.toLowerCase())).sort((a, b) => {
    if (sortFilter.includes('name-asc')) return a.name.localeCompare(b.name);
    if (sortFilter.includes('name-desc')) return b.name.localeCompare(a.name);
    return 0;
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Név és telefon kötelező!');
      return;
    }
    addCustomer(formData);
    toast.success('Ügyfél hozzáadva!');
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: ''
    });
    setIsOpen(false);
  };
  const toggleSortFilter = (id: string) => {
    setSortFilter(prev => prev.includes(id) ? prev.filter(f => f !== id) : [id]);
  };
  return <>
      <Header title="Ügyfelek" action={<Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9">
                <Plus className="h-4 w-4 mr-1" />
                Új
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 max-w-md">
              <DialogHeader>
                <DialogTitle>Új ügyfél</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Név *</Label>
                  <Input id="name" value={formData.name} onChange={e => setFormData({
              ...formData,
              name: e.target.value
            })} placeholder="Kovács János" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon *</Label>
                  <Input id="phone" value={formData.phone} onChange={e => setFormData({
              ...formData,
              phone: e.target.value
            })} placeholder="+36 30 123 4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={e => setFormData({
              ...formData,
              email: e.target.value
            })} placeholder="kovacs@email.hu" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Cím</Label>
                  <Input id="address" value={formData.address} onChange={e => setFormData({
              ...formData,
              address: e.target.value
            })} placeholder="Budapest, Kossuth u. 1." />
                </div>
                <Button type="submit" className="w-full">
                  Mentés
                </Button>
              </form>
            </DialogContent>
          </Dialog>} />
      <PageContainer>
        <div className="p-4 space-y-4 animate-fade-in">
          {/* Search and Filters */}
          <SearchFilter search={search} onSearchChange={setSearch} placeholder="Keresés név, telefon, email..." filters={[{
          label: 'Rendezés',
          options: [{
            id: 'name-asc',
            label: 'Név (A-Z)'
          }, {
            id: 'name-desc',
            label: 'Név (Z-A)'
          }],
          selected: sortFilter,
          onToggle: toggleSortFilter
        }]} />

          {/* Results count */}
          <p className="text-xs text-muted-foreground">
            {filteredCustomers.length} ügyfél{search && ` (szűrve)`}
          </p>

          {/* Customer List */}
          <div className="space-y-2">
            {filteredCustomers.length === 0 ? (
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-primary/30 mb-3" />
                  <p className="text-muted-foreground">
                    {search ? 'Nincs találat' : 'Még nincs ügyfél'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredCustomers.map((customer) => (
                <Card 
                  key={customer.id} 
                  className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30 bg-gradient-to-r from-card to-primary/5" 
                  onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-full bg-primary/10 shrink-0">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{customer.name}</h3>
                          {customer.address && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3 text-accent" />
                              {customer.address}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-primary/50 shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </PageContainer>
    </>;
}