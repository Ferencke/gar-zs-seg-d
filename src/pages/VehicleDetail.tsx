import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVehicles } from '@/hooks/useVehicles';
import { useCustomers } from '@/hooks/useCustomers';
import { useServiceRecords } from '@/hooks/useServiceRecords';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Calendar, Gauge, Plus, Trash2, Edit, Wrench, Share2, AlertTriangle, Shield, Fuel, Zap, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
export default function VehicleDetail() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const {
    getVehicle,
    updateVehicle,
    deleteVehicle
  } = useVehicles();
  const {
    getCustomer
  } = useCustomers();
  const {
    addServiceRecord,
    getServicesByVehicle
  } = useServiceRecords();
  const vehicle = getVehicle(id!);
  const customer = vehicle ? getCustomer(vehicle.customerId) : null;
  const vehicleServices = getServicesByVehicle(id!).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [editData, setEditData] = useState(vehicle || {
    licensePlate: '',
    brand: '',
    model: '',
    year: undefined,
    vin: '',
    color: '',
    technicalInspectionDate: '',
    engineCode: '',
    ecuType: '',
    displacement: undefined,
    power: undefined,
    fuelType: ''
  });
  const [serviceData, setServiceData] = useState({
    description: '',
    date: new Date().toISOString().split('T')[0],
    mileage: '',
    cost: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed',
    notes: ''
  });

  // Technical inspection warning
  const getTechnicalInspectionStatus = () => {
    if (!vehicle?.technicalInspectionDate) return null;
    const inspectionDate = new Date(vehicle.technicalInspectionDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((inspectionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 0) return {
      type: 'expired',
      days: Math.abs(daysUntilExpiry)
    };
    if (daysUntilExpiry <= 30) return {
      type: 'warning',
      days: daysUntilExpiry
    };
    return {
      type: 'ok',
      days: daysUntilExpiry
    };
  };
  const inspectionStatus = getTechnicalInspectionStatus();

  // Share service history
  const handleShareServiceHistory = async () => {
    if (!vehicle || !customer) return;
    const serviceHistory = vehicleServices.map(s => `${new Date(s.date).toLocaleDateString('hu-HU')} - ${s.description}${s.mileage ? ` (${s.mileage.toLocaleString()} km)` : ''}${s.cost ? ` - ${s.cost.toLocaleString()} Ft` : ''}`).join('\n');
    const message = `🚗 Szerviz előzmények
    
Jármű: ${vehicle.brand} ${vehicle.model}
Rendszám: ${vehicle.licensePlate}
${vehicle.year ? `Évjárat: ${vehicle.year}` : ''}
${vehicle.vin ? `Alvázszám: ${vehicle.vin}` : ''}
${vehicle.engineCode ? `Motorkód: ${vehicle.engineCode}` : ''}
${vehicle.displacement ? `Hengerűrtartalom: ${vehicle.displacement} cm³` : ''}
${vehicle.power ? `Teljesítmény: ${vehicle.power} kW` : ''}
${vehicle.fuelType ? `Üzemanyag: ${vehicle.fuelType}` : ''}

📋 Elvégzett munkák:
${serviceHistory || 'Nincs szerviz előzmény'}

Összesen ${vehicleServices.length} szerviz bejegyzés
Összes költség: ${vehicleServices.reduce((sum, s) => sum + (s.cost || 0), 0).toLocaleString()} Ft`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${vehicle.brand} ${vehicle.model} szerviz előzmények`,
          text: message
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(message);
          toast.success('Szerviz előzmények vágólapra másolva!');
        }
      }
    } else {
      await navigator.clipboard.writeText(message);
      toast.success('Szerviz előzmények vágólapra másolva!');
    }
  };
  if (!vehicle) {
    return <>
        <Header title="Jármű nem található" showBack />
        <PageContainer>
          <div className="p-4 text-center text-muted-foreground">
            A jármű nem található
          </div>
        </PageContainer>
      </>;
  }
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateVehicle(id!, {
      ...editData,
      year: editData.year ? Number(editData.year) : undefined,
      displacement: editData.displacement ? Number(editData.displacement) : undefined,
      power: editData.power ? Number(editData.power) : undefined
    });
    toast.success('Jármű frissítve!');
    setIsEditOpen(false);
  };
  const handleDelete = () => {
    deleteVehicle(id!);
    toast.success('Jármű törölve!');
    navigate(-1);
  };
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceData.description || !serviceData.date) {
      toast.error('Leírás és dátum kötelező!');
      return;
    }
    addServiceRecord({
      vehicleId: id!,
      customerId: vehicle.customerId,
      description: serviceData.description,
      date: serviceData.date,
      mileage: serviceData.mileage ? parseInt(serviceData.mileage) : undefined,
      cost: serviceData.cost ? parseFloat(serviceData.cost) : undefined,
      status: serviceData.status,
      notes: serviceData.notes || undefined
    });
    toast.success('Szerviz bejegyzés hozzáadva!');
    setServiceData({
      description: '',
      date: new Date().toISOString().split('T')[0],
      mileage: '',
      cost: '',
      status: 'pending',
      notes: ''
    });
    setIsServiceOpen(false);
  };
  return <>
      <Header title={vehicle.licensePlate} showBack action={<div className="flex gap-2">
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-4 max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Jármű szerkesztése</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Rendszám</Label>
                    <Input value={editData.licensePlate} onChange={e => setEditData({
                ...editData,
                licensePlate: e.target.value.toUpperCase()
              })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Márka</Label>
                      <Input value={editData.brand} onChange={e => setEditData({
                  ...editData,
                  brand: e.target.value
                })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Modell</Label>
                      <Input value={editData.model} onChange={e => setEditData({
                  ...editData,
                  model: e.target.value
                })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Évjárat</Label>
                      <Input type="number" value={editData.year || ''} onChange={e => setEditData({
                  ...editData,
                  year: e.target.value ? parseInt(e.target.value) : undefined
                })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Szín</Label>
                      <Input value={editData.color || ''} onChange={e => setEditData({
                  ...editData,
                  color: e.target.value
                })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Alvázszám</Label>
                    <Input value={editData.vin || ''} onChange={e => setEditData({
                ...editData,
                vin: e.target.value
              })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Motorkód</Label>
                      <Input value={editData.engineCode || ''} onChange={e => setEditData({
                  ...editData,
                  engineCode: e.target.value
                })} placeholder="BKD, AGR..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Motorvezérlő</Label>
                      <Input value={editData.ecuType || ''} onChange={e => setEditData({
                  ...editData,
                  ecuType: e.target.value
                })} placeholder="EDC16, MED17..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Hengerűrt. (cm³)</Label>
                      <Input type="number" value={editData.displacement || ''} onChange={e => setEditData({
                  ...editData,
                  displacement: e.target.value ? parseInt(e.target.value) : undefined
                })} placeholder="1968" />
                    </div>
                    <div className="space-y-2">
                      <Label>Teljesítmény (kW)</Label>
                      <Input type="number" value={editData.power || ''} onChange={e => setEditData({
                  ...editData,
                  power: e.target.value ? parseInt(e.target.value) : undefined
                })} placeholder="103" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Üzemanyag</Label>
                    <Select value={editData.fuelType || ''} onValueChange={v => setEditData({
                ...editData,
                fuelType: v
              })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Válassz..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="benzin">Benzin</SelectItem>
                        <SelectItem value="diesel">Dízel</SelectItem>
                        <SelectItem value="lpg">LPG</SelectItem>
                        <SelectItem value="hybrid">Hibrid</SelectItem>
                        <SelectItem value="electric">Elektromos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Műszaki érvényesség
                    </Label>
                    <Input type="date" value={editData.technicalInspectionDate || ''} onChange={e => setEditData({
                ...editData,
                technicalInspectionDate: e.target.value
              })} />
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
                  <AlertDialogTitle>Jármű törlése</AlertDialogTitle>
                  <AlertDialogDescription>
                    Biztosan törölni szeretnéd ezt a járművet?
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
          </div>} />
      <PageContainer>
        <div className="p-4 space-y-4 animate-fade-in">
          {/* Technical Inspection Warning */}
          {inspectionStatus && inspectionStatus.type !== 'ok' && <Card className={cn('border-2', inspectionStatus.type === 'expired' ? 'border-destructive bg-destructive/5' : 'border-warning bg-warning/5')}>
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className={cn('h-6 w-6 shrink-0', inspectionStatus.type === 'expired' ? 'text-destructive' : 'text-warning')} />
                <div>
                  <p className="font-medium">
                    {inspectionStatus.type === 'expired' ? `Műszaki vizsga lejárt ${inspectionStatus.days} napja!` : `Műszaki vizsga ${inspectionStatus.days} nap múlva lejár!`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Érvényesség: {new Date(vehicle.technicalInspectionDate!).toLocaleDateString('hu-HU')}
                  </p>
                </div>
              </CardContent>
            </Card>}

          {/* Vehicle Info */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="text-center pb-3 border-b border-border">
                <p className="text-2xl font-bold text-primary">{vehicle.brand} {vehicle.model}</p>
                {vehicle.year && <p className="text-muted-foreground">{vehicle.year}</p>}
              </div>
              {customer && <div className="flex items-center gap-3 cursor-pointer hover:bg-secondary/50 -mx-4 px-4 py-2 transition-colors" onClick={() => navigate(`/customers/${customer.id}`)}>
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-primary">{customer.name}</span>
                </div>}
              <div className="grid grid-cols-2 gap-2 text-sm">
                {vehicle.color && <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Szín</span>
                    <span>{vehicle.color}</span>
                  </div>}
                {vehicle.fuelType && <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Fuel className="h-3 w-3" />
                      Üzemanyag
                    </span>
                    <span className="capitalize">{vehicle.fuelType}</span>
                  </div>}
                {vehicle.engineCode && <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Motorkód</span>
                    <span className="font-mono">{vehicle.engineCode}</span>
                  </div>}
                {vehicle.ecuType && <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Settings className="h-3 w-3" />
                      ECU
                    </span>
                    <span className="font-mono text-sm font-normal">{vehicle.ecuType}</span>
                  </div>}
                {vehicle.displacement && <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Hengerűrt.</span>
                    <span>{vehicle.displacement.toLocaleString()} cm³</span>
                  </div>}
                {vehicle.power && <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Teljesítmény
                    </span>
                    <span>{vehicle.power} kW ({Math.round(vehicle.power * 1.36)} LE)</span>
                  </div>}
              </div>
              {vehicle.vin && <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                  <span className="text-muted-foreground">Alvázszám</span>
                  <span className="font-mono text-xs">{vehicle.vin}</span>
                </div>}
              {vehicle.technicalInspectionDate && <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Műszaki érvényes
                  </span>
                  <span className={cn(inspectionStatus?.type === 'expired' && 'text-destructive', inspectionStatus?.type === 'warning' && 'text-warning')}>
                    {new Date(vehicle.technicalInspectionDate).toLocaleDateString('hu-HU')}
                  </span>
                </div>}
            </CardContent>
          </Card>

          {/* Service History */}
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-base">Szerviz előzmények</CardTitle>
              <div className="flex gap-2">
                {vehicleServices.length > 0 && <Button size="sm" variant="outline" className="h-8" onClick={handleShareServiceHistory}>
                    <Share2 className="h-3 w-3 mr-1" />
                    Küldés
                  </Button>}
                <Dialog open={isServiceOpen} onOpenChange={setIsServiceOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8">
                      <Plus className="h-3 w-3 mr-1" />
                      Új
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="mx-4 max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Új szerviz bejegyzés</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddService} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Leírás *</Label>
                        <Input value={serviceData.description} onChange={e => setServiceData({
                        ...serviceData,
                        description: e.target.value
                      })} placeholder="Olajcsere, fékbetét..." />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Dátum *</Label>
                          <Input type="date" value={serviceData.date} onChange={e => setServiceData({
                          ...serviceData,
                          date: e.target.value
                        })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Státusz</Label>
                          <Select value={serviceData.status} onValueChange={(value: 'pending' | 'in-progress' | 'completed') => setServiceData({
                          ...serviceData,
                          status: value
                        })}>
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
                          <Input type="number" value={serviceData.mileage} onChange={e => setServiceData({
                          ...serviceData,
                          mileage: e.target.value
                        })} placeholder="125000" />
                        </div>
                        <div className="space-y-2">
                          <Label>Költség (Ft)</Label>
                          <Input type="number" value={serviceData.cost} onChange={e => setServiceData({
                          ...serviceData,
                          cost: e.target.value
                        })} placeholder="25000" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Megjegyzések</Label>
                        <Textarea value={serviceData.notes} onChange={e => setServiceData({
                        ...serviceData,
                        notes: e.target.value
                      })} placeholder="További részletek..." rows={3} />
                      </div>
                      <Button type="submit" className="w-full">Mentés</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {vehicleServices.length === 0 ? <div className="text-center py-6 text-muted-foreground">
                  <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Még nincs szerviz előzmény</p>
                </div> : <div className="space-y-3">
                  {vehicleServices.map(service => <div key={service.id} className="p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => navigate(`/services/${service.id}`)}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{service.description}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(service.date).toLocaleDateString('hu-HU')}
                            </span>
                            {service.mileage && <span className="flex items-center gap-1">
                                <Gauge className="h-3 w-3" />
                                {service.mileage.toLocaleString()} km
                              </span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${service.status === 'completed' ? 'bg-success/10 text-success' : service.status === 'in-progress' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}`}>
                            {service.status === 'completed' ? 'Kész' : service.status === 'in-progress' ? 'Folyamatban' : 'Függőben'}
                          </span>
                          {service.cost && <span className="text-sm font-medium">
                              {service.cost.toLocaleString()} Ft
                            </span>}
                        </div>
                      </div>
                    </div>)}
                </div>}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>;
}