import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServiceRecords } from '@/hooks/useServiceRecords';
import { useVehicles } from '@/hooks/useVehicles';
import { useCustomers } from '@/hooks/useCustomers';
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
import { Car, User, Calendar, Gauge, Banknote, Trash2, Edit, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { serviceRecords, updateServiceRecord, deleteServiceRecord } = useServiceRecords();
  const { getVehicle } = useVehicles();
  const { getCustomer } = useCustomers();

  const service = serviceRecords.find((s) => s.id === id);
  const vehicle = service ? getVehicle(service.vehicleId) : null;
  const customer = service ? getCustomer(service.customerId) : null;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState(service || {
    description: '',
    date: '',
    mileage: undefined as number | undefined,
    cost: undefined as number | undefined,
    status: 'pending' as 'pending' | 'in-progress' | 'completed',
    notes: '',
  });

  if (!service) {
    return (
      <>
        <Header title="Szerviz nem található" showBack />
        <PageContainer>
          <div className="p-4 text-center text-muted-foreground">
            A szerviz bejegyzés nem található
          </div>
        </PageContainer>
      </>
    );
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateServiceRecord(id!, {
      description: editData.description,
      date: editData.date,
      mileage: editData.mileage,
      cost: editData.cost,
      status: editData.status,
      notes: editData.notes,
    });
    toast.success('Szerviz frissítve!');
    setIsEditOpen(false);
  };

  const handleDelete = () => {
    deleteServiceRecord(id!);
    toast.success('Szerviz törölve!');
    navigate(-1);
  };

  const handleStatusChange = (status: 'pending' | 'in-progress' | 'completed') => {
    updateServiceRecord(id!, { status });
    toast.success('Státusz frissítve!');
  };

  return (
    <>
      <Header
        title="Szerviz részletei"
        showBack
        action={
          <div className="flex gap-2">
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-4 max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Szerviz szerkesztése</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Leírás</Label>
                    <Input
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Dátum</Label>
                      <Input
                        type="date"
                        value={editData.date}
                        onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Státusz</Label>
                      <Select
                        value={editData.status}
                        onValueChange={(value: 'pending' | 'in-progress' | 'completed') =>
                          setEditData({ ...editData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Függőben</SelectItem>
                          <SelectItem value="in-progress">Folyamatban</SelectItem>
                          <SelectItem value="completed">Kész</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Kilométer</Label>
                      <Input
                        type="number"
                        value={editData.mileage || ''}
                        onChange={(e) => setEditData({ ...editData, mileage: e.target.value ? parseInt(e.target.value) : undefined })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Költség (Ft)</Label>
                      <Input
                        type="number"
                        value={editData.cost || ''}
                        onChange={(e) => setEditData({ ...editData, cost: e.target.value ? parseFloat(e.target.value) : undefined })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Megjegyzések</Label>
                    <Textarea
                      value={editData.notes || ''}
                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                      rows={3}
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
                  <AlertDialogTitle>Szerviz törlése</AlertDialogTitle>
                  <AlertDialogDescription>
                    Biztosan törölni szeretnéd ezt a szerviz bejegyzést?
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
          {/* Status Quick Change */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-sm text-muted-foreground mb-3 block">Státusz</Label>
              <div className="flex gap-2">
                {(['pending', 'in-progress', 'completed'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={service.status === status ? 'default' : 'outline'}
                    size="sm"
                    className={`flex-1 ${
                      service.status === status
                        ? status === 'completed'
                          ? 'bg-success hover:bg-success/90'
                          : status === 'in-progress'
                          ? 'bg-primary hover:bg-primary/90'
                          : 'bg-warning hover:bg-warning/90 text-warning-foreground'
                        : ''
                    }`}
                    onClick={() => handleStatusChange(status)}
                  >
                    {status === 'completed'
                      ? 'Kész'
                      : status === 'in-progress'
                      ? 'Folyamatban'
                      : 'Függőben'}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Service Info */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{service.description}</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(service.date).toLocaleDateString('hu-HU')}</span>
                </div>
                {service.mileage && (
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <span>{service.mileage.toLocaleString()} km</span>
                  </div>
                )}
                {service.cost && (
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{service.cost.toLocaleString()} Ft</span>
                  </div>
                )}
              </div>

              {service.notes && (
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <FileText className="h-4 w-4" />
                    <span>Megjegyzések</span>
                  </div>
                  <p className="text-sm">{service.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Info */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {vehicle && (
                <div
                  className="flex items-center gap-3 cursor-pointer hover:bg-secondary/50 -mx-4 px-4 py-2 transition-colors"
                  onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                >
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-primary">{vehicle.licensePlate}</p>
                    <p className="text-xs text-muted-foreground">
                      {vehicle.brand} {vehicle.model}
                    </p>
                  </div>
                </div>
              )}
              {customer && (
                <div
                  className="flex items-center gap-3 cursor-pointer hover:bg-secondary/50 -mx-4 px-4 py-2 transition-colors"
                  onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-primary">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.phone}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
