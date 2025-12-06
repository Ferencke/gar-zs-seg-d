import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCustomers } from '@/hooks/useCustomers';
import { useVehicles } from '@/hooks/useVehicles';
import { useServiceRecords } from '@/hooks/useServiceRecords';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Phone, Mail, MapPin, Plus, Car, Trash2, Edit, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { vehicles, addVehicle, getVehiclesByCustomer } = useVehicles();
  const { getServicesByCustomer, deleteServiceRecord } = useServiceRecords();

  const customer = getCustomer(id!);
  const customerVehicles = getVehiclesByCustomer(id!);
  const customerServices = getServicesByCustomer(id!);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isVehicleOpen, setIsVehicleOpen] = useState(false);
  const [editData, setEditData] = useState(customer || { name: '', phone: '', email: '', address: '' });
  const [vehicleData, setVehicleData] = useState({
    licensePlate: '',
    brand: '',
    model: '',
    year: '',
    vin: '',
    color: '',
  });

  if (!customer) {
    return (
      <>
        <Header title="Ügyfél nem található" showBack />
        <PageContainer>
          <div className="p-4 text-center text-muted-foreground">
            Az ügyfél nem található
          </div>
        </PageContainer>
      </>
    );
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateCustomer(id!, editData);
    toast.success('Ügyfél frissítve!');
    setIsEditOpen(false);
  };

  const handleDelete = () => {
    customerVehicles.forEach((v) => {
      // Delete related services would go here in a real app
    });
    deleteCustomer(id!);
    toast.success('Ügyfél törölve!');
    navigate('/customers');
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleData.licensePlate || !vehicleData.brand || !vehicleData.model) {
      toast.error('Rendszám, márka és modell kötelező!');
      return;
    }
    addVehicle({
      customerId: id!,
      licensePlate: vehicleData.licensePlate,
      brand: vehicleData.brand,
      model: vehicleData.model,
      year: vehicleData.year ? parseInt(vehicleData.year) : undefined,
      vin: vehicleData.vin || undefined,
      color: vehicleData.color || undefined,
    });
    toast.success('Jármű hozzáadva!');
    setVehicleData({ licensePlate: '', brand: '', model: '', year: '', vin: '', color: '' });
    setIsVehicleOpen(false);
  };

  return (
    <>
      <Header
        title={customer.name}
        showBack
        action={
          <div className="flex gap-2">
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-4 max-w-md">
                <DialogHeader>
                  <DialogTitle>Ügyfél szerkesztése</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Név *</Label>
                    <Input
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefon *</Label>
                    <Input
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editData.email || ''}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cím</Label>
                    <Input
                      value={editData.address || ''}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full">Mentés</Button>
                </form>
              </DialogContent>
            </Dialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="mx-4 max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Ügyfél törlése</AlertDialogTitle>
                  <AlertDialogDescription>
                    Biztosan törölni szeretnéd ezt az ügyfelet? Ez a művelet nem vonható vissza.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Mégse</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    Törlés
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />
      <PageContainer>
        <div className="p-4 space-y-4 animate-fade-in">
          {/* Contact Info */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${customer.phone}`} className="text-primary">
                  {customer.phone}
                </a>
              </div>
              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${customer.email}`} className="text-primary">
                    {customer.email}
                  </a>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{customer.address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vehicles */}
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-base">Járművek</CardTitle>
              <Dialog open={isVehicleOpen} onOpenChange={setIsVehicleOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8">
                    <Plus className="h-3 w-3 mr-1" />
                    Új
                  </Button>
                </DialogTrigger>
                <DialogContent className="mx-4 max-w-md">
                  <DialogHeader>
                    <DialogTitle>Új jármű</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddVehicle} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Rendszám *</Label>
                      <Input
                        value={vehicleData.licensePlate}
                        onChange={(e) => setVehicleData({ ...vehicleData, licensePlate: e.target.value.toUpperCase() })}
                        placeholder="ABC-123"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Márka *</Label>
                        <Input
                          value={vehicleData.brand}
                          onChange={(e) => setVehicleData({ ...vehicleData, brand: e.target.value })}
                          placeholder="Toyota"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Modell *</Label>
                        <Input
                          value={vehicleData.model}
                          onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                          placeholder="Corolla"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Évjárat</Label>
                        <Input
                          type="number"
                          value={vehicleData.year}
                          onChange={(e) => setVehicleData({ ...vehicleData, year: e.target.value })}
                          placeholder="2020"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Szín</Label>
                        <Input
                          value={vehicleData.color}
                          onChange={(e) => setVehicleData({ ...vehicleData, color: e.target.value })}
                          placeholder="Fehér"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Alvázszám</Label>
                      <Input
                        value={vehicleData.vin}
                        onChange={(e) => setVehicleData({ ...vehicleData, vin: e.target.value })}
                        placeholder="WVWZZZ..."
                      />
                    </div>
                    <Button type="submit" className="w-full">Mentés</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="pt-0">
              {customerVehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Még nincs jármű
                </p>
              ) : (
                <div className="space-y-2">
                  {customerVehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg cursor-pointer hover:bg-secondary transition-colors"
                      onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <Car className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{vehicle.licensePlate}</p>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.brand} {vehicle.model}
                            {vehicle.year && ` (${vehicle.year})`}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
