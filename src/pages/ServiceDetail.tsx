import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServiceRecords } from '@/hooks/useServiceRecords';
import { useVehicles } from '@/hooks/useVehicles';
import { useCustomers } from '@/hooks/useCustomers';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, User, Calendar, Gauge, Banknote, Trash2, Edit, FileText, Package, Share2, Printer, Clock, MapPin, Plus, Image, X } from 'lucide-react';
import { toast } from 'sonner';
import { Part } from '@/types';

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { serviceRecords, updateServiceRecord, deleteServiceRecord } = useServiceRecords();
  const { getVehicle } = useVehicles();
  const { getCustomer } = useCustomers();
  const worksheetRef = useRef<HTMLDivElement>(null);

  const service = serviceRecords.find((s) => s.id === id);
  const vehicle = service ? getVehicle(service.vehicleId) : null;
  const customer = service ? getCustomer(service.customerId) : null;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPartsOpen, setIsPartsOpen] = useState(false);
  const [isWorksheetOpen, setIsWorksheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [editData, setEditData] = useState(service || {
    description: '',
    date: '',
    mileage: undefined as number | undefined,
    cost: undefined as number | undefined,
    status: 'pending' as 'pending' | 'in-progress' | 'completed',
    notes: '',
    laborHours: undefined as number | undefined,
    location: '',
  });
  const [newPart, setNewPart] = useState({ name: '', partNumber: '', quantity: 1, price: undefined as number | undefined });
  const [photos, setPhotos] = useState<string[]>(service?.photos || []);

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
      laborHours: editData.laborHours,
      location: editData.location,
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

  const handleAddPart = () => {
    if (!newPart.name) {
      toast.error('Alkatrész név kötelező!');
      return;
    }
    const parts = service.parts || [];
    const part: Part = {
      id: crypto.randomUUID(),
      name: newPart.name,
      partNumber: newPart.partNumber || undefined,
      quantity: newPart.quantity,
      price: newPart.price,
    };
    updateServiceRecord(id!, { parts: [...parts, part] });
    setNewPart({ name: '', partNumber: '', quantity: 1, price: undefined });
    toast.success('Alkatrész hozzáadva!');
  };

  const handleRemovePart = (partId: string) => {
    const parts = (service.parts || []).filter(p => p.id !== partId);
    updateServiceRecord(id!, { parts });
    toast.success('Alkatrész törölve!');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const newPhotos = [...(service.photos || []), base64];
        updateServiceRecord(id!, { photos: newPhotos });
        setPhotos(newPhotos);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = (service.photos || []).filter((_, i) => i !== index);
    updateServiceRecord(id!, { photos: newPhotos });
    setPhotos(newPhotos);
    toast.success('Fotó törölve!');
  };

  const handleShareWorksheet = async () => {
    const partsTotal = (service.parts || []).reduce((sum, p) => sum + (p.price || 0) * p.quantity, 0);
    const laborCost = service.cost ? service.cost - partsTotal : 0;

    const worksheet = `
╔════════════════════════════════════════╗
║             MUNKALAP                   ║
╚════════════════════════════════════════╝

▌ JÁRMŰ ADATOK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Típus: ${vehicle?.brand || ''} ${vehicle?.model || ''}
Rendszám: ${vehicle?.licensePlate || ''}
Évjárat: ${vehicle?.year || '-'}
Üzemanyag: ${vehicle?.fuelType || '-'}
Alvázszám: ${vehicle?.vin || '-'}
Motorkód: ${vehicle?.engineCode || '-'}
Hengerűrt.: ${vehicle?.displacement ? `${vehicle.displacement} cm³` : '-'}
Teljesítmény: ${vehicle?.power ? `${vehicle.power} kW` : '-'}
Km óra állás: ${service.mileage ? `${service.mileage.toLocaleString()} km` : '-'}

▌ TULAJDONOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Név: ${customer?.name || ''}
Telefon: ${customer?.phone || ''}
${customer?.email ? `Email: ${customer.email}` : ''}
${customer?.address ? `Cím: ${customer.address}` : ''}

▌ ELVÉGZETT MUNKÁK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${service.description}

${service.notes ? `Megjegyzések: ${service.notes}` : ''}

▌ BEÉPÍTETT ALKATRÉSZEK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${(service.parts || []).length > 0 
  ? (service.parts || []).map(p => `• ${p.name}${p.partNumber ? ` (${p.partNumber})` : ''} x${p.quantity} ${p.price ? `- ${(p.price * p.quantity).toLocaleString()} Ft` : ''}`).join('\n')
  : 'Nincs beépített alkatrész'
}

▌ ÖSSZESÍTÉS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${service.laborHours ? `Munkaórák: ${service.laborHours} óra` : ''}
Alkatrészek összesen: ${partsTotal.toLocaleString()} Ft
Munkadíj: ${laborCost.toLocaleString()} Ft
VÉGÖSSZEG: ${(service.cost || 0).toLocaleString()} Ft

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${service.location ? `Hely: ${service.location}` : ''}
Dátum: ${new Date(service.date).toLocaleDateString('hu-HU')}
`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Munkalap',
          text: worksheet,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(worksheet);
          toast.success('Munkalap vágólapra másolva!');
        }
      }
    } else {
      await navigator.clipboard.writeText(worksheet);
      toast.success('Munkalap vágólapra másolva!');
    }
  };

  const handlePrintWorksheet = () => {
    const printContent = worksheetRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Munkalap - ${vehicle?.licensePlate}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: bold; background: #f0f0f0; padding: 5px 10px; margin-bottom: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .item { padding: 5px 0; }
            .label { color: #666; font-size: 12px; }
            .value { font-weight: 500; }
            .parts-table { width: 100%; border-collapse: collapse; }
            .parts-table th, .parts-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .parts-table th { background: #f0f0f0; }
            .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
            .footer { border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; color: #666; }
            @media print { body { print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MUNKALAP</h1>
            <p>Dátum: ${new Date(service.date).toLocaleDateString('hu-HU')}</p>
          </div>
          
          <div class="grid">
            <div class="section">
              <div class="section-title">JÁRMŰ ADATOK</div>
              <div class="item"><span class="label">Típus:</span> <span class="value">${vehicle?.brand || ''} ${vehicle?.model || ''}</span></div>
              <div class="item"><span class="label">Rendszám:</span> <span class="value">${vehicle?.licensePlate || ''}</span></div>
              <div class="item"><span class="label">Évjárat:</span> <span class="value">${vehicle?.year || '-'}</span></div>
              <div class="item"><span class="label">Üzemanyag:</span> <span class="value">${vehicle?.fuelType || '-'}</span></div>
              <div class="item"><span class="label">Alvázszám:</span> <span class="value">${vehicle?.vin || '-'}</span></div>
              <div class="item"><span class="label">Motorkód:</span> <span class="value">${vehicle?.engineCode || '-'}</span></div>
              <div class="item"><span class="label">Hengerűrtartalom:</span> <span class="value">${vehicle?.displacement ? `${vehicle.displacement} cm³` : '-'}</span></div>
              <div class="item"><span class="label">Teljesítmény:</span> <span class="value">${vehicle?.power ? `${vehicle.power} kW` : '-'}</span></div>
              <div class="item"><span class="label">Km óra állás:</span> <span class="value">${service.mileage ? `${service.mileage.toLocaleString()} km` : '-'}</span></div>
            </div>
            
            <div class="section">
              <div class="section-title">TULAJDONOS</div>
              <div class="item"><span class="label">Név:</span> <span class="value">${customer?.name || ''}</span></div>
              <div class="item"><span class="label">Telefon:</span> <span class="value">${customer?.phone || ''}</span></div>
              ${customer?.email ? `<div class="item"><span class="label">Email:</span> <span class="value">${customer.email}</span></div>` : ''}
              ${customer?.address ? `<div class="item"><span class="label">Cím:</span> <span class="value">${customer.address}</span></div>` : ''}
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">ELVÉGZETT MUNKÁK</div>
            <p>${service.description}</p>
            ${service.notes ? `<p><strong>Megjegyzések:</strong> ${service.notes}</p>` : ''}
          </div>
          
          <div class="section">
            <div class="section-title">BEÉPÍTETT ALKATRÉSZEK</div>
            ${(service.parts || []).length > 0 ? `
              <table class="parts-table">
                <thead>
                  <tr>
                    <th>Megnevezés</th>
                    <th>Cikkszám</th>
                    <th>Mennyiség</th>
                    <th>Ár</th>
                  </tr>
                </thead>
                <tbody>
                  ${(service.parts || []).map(p => `
                    <tr>
                      <td>${p.name}</td>
                      <td>${p.partNumber || '-'}</td>
                      <td>${p.quantity}</td>
                      <td>${p.price ? `${(p.price * p.quantity).toLocaleString()} Ft` : '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p>Nincs beépített alkatrész</p>'}
          </div>
          
          <div class="total">
            ${service.laborHours ? `<div>Munkaórák: ${service.laborHours} óra</div>` : ''}
            <div>VÉGÖSSZEG: ${(service.cost || 0).toLocaleString()} Ft</div>
          </div>
          
          <div class="footer">
            ${service.location ? `<p>Hely: ${service.location}</p>` : ''}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const partsTotal = (service.parts || []).reduce((sum, p) => sum + (p.price || 0) * p.quantity, 0);

  return (
    <>
      <Header
        title="Szerviz részletei"
        showBack
        action={
          <div className="flex gap-2">
            <Dialog open={isWorksheetOpen} onOpenChange={setIsWorksheetOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <FileText className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-4 max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Munkalap</DialogTitle>
                </DialogHeader>
                <div ref={worksheetRef} className="space-y-4 text-sm">
                  {/* Vehicle Info */}
                  <div className="grid grid-cols-2 gap-4 p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Típus</p>
                      <p className="font-medium">{vehicle?.brand} {vehicle?.model}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rendszám</p>
                      <p className="font-mono font-bold">{vehicle?.licensePlate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Évjárat</p>
                      <p>{vehicle?.year || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Üzemanyag</p>
                      <p className="capitalize">{vehicle?.fuelType || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Alvázszám</p>
                      <p className="font-mono text-xs">{vehicle?.vin || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Motorkód</p>
                      <p className="font-mono">{vehicle?.engineCode || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Hengerűrt.</p>
                      <p>{vehicle?.displacement ? `${vehicle.displacement} cm³` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Teljesítmény</p>
                      <p>{vehicle?.power ? `${vehicle.power} kW` : '-'}</p>
                    </div>
                    <div className="col-span-2 border-t border-border pt-2">
                      <p className="text-xs text-muted-foreground">Km óra állás</p>
                      <p className="font-medium">{service.mileage ? `${service.mileage.toLocaleString()} km` : '-'}</p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="p-3 bg-secondary/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Tulajdonos</p>
                    <p className="font-medium">{customer?.name}</p>
                    <p className="text-muted-foreground">{customer?.phone}</p>
                    {customer?.email && <p className="text-muted-foreground">{customer.email}</p>}
                    {customer?.address && <p className="text-muted-foreground">{customer.address}</p>}
                  </div>

                  {/* Work Done */}
                  <div className="p-3 border border-border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Elvégzett munkák</p>
                    <p className="font-medium">{service.description}</p>
                    {service.notes && <p className="text-muted-foreground mt-2">{service.notes}</p>}
                  </div>

                  {/* Parts */}
                  <div className="p-3 border border-border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Beépített alkatrészek</p>
                    {(service.parts || []).length > 0 ? (
                      <div className="space-y-1">
                        {(service.parts || []).map((part) => (
                          <div key={part.id} className="flex justify-between text-sm">
                            <span>{part.name} {part.partNumber && <span className="text-muted-foreground">({part.partNumber})</span>} x{part.quantity}</span>
                            {part.price && <span>{(part.price * part.quantity).toLocaleString()} Ft</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nincs beépített alkatrész</p>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="p-3 bg-primary/5 rounded-lg space-y-1">
                    {service.laborHours && (
                      <div className="flex justify-between">
                        <span>Munkaórák:</span>
                        <span>{service.laborHours} óra</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg">
                      <span>Végösszeg:</span>
                      <span>{(service.cost || 0).toLocaleString()} Ft</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {service.location && <span>{service.location}</span>}
                    <span>{new Date(service.date).toLocaleDateString('hu-HU')}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button className="flex-1" onClick={handleShareWorksheet}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Megosztás
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handlePrintWorksheet}>
                    <Printer className="h-4 w-4 mr-2" />
                    Nyomtatás
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Munkaórák</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={editData.laborHours || ''}
                        onChange={(e) => setEditData({ ...editData, laborHours: e.target.value ? parseFloat(e.target.value) : undefined })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hely</Label>
                      <Input
                        value={editData.location || ''}
                        onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                        placeholder="Műhely neve..."
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

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="details" className="text-xs">Részletek</TabsTrigger>
              <TabsTrigger value="parts" className="text-xs">Alkatrészek</TabsTrigger>
              <TabsTrigger value="photos" className="text-xs">Fotók</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4 space-y-4">
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
                    {service.laborHours && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{service.laborHours} óra</span>
                      </div>
                    )}
                    {service.location && (
                      <div className="flex items-center gap-2 col-span-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{service.location}</span>
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
            </TabsContent>

            <TabsContent value="parts" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Beépített alkatrészek
                    </CardTitle>
                    <Dialog open={isPartsOpen} onOpenChange={setIsPartsOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8">
                          <Plus className="h-3 w-3 mr-1" />
                          Hozzáad
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="mx-4 max-w-md">
                        <DialogHeader>
                          <DialogTitle>Alkatrész hozzáadása</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Megnevezés *</Label>
                            <Input
                              value={newPart.name}
                              onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                              placeholder="Olajszűrő, fékbetét..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Cikkszám</Label>
                            <Input
                              value={newPart.partNumber}
                              onChange={(e) => setNewPart({ ...newPart, partNumber: e.target.value })}
                              placeholder="OE szám..."
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Mennyiség</Label>
                              <Input
                                type="number"
                                min="1"
                                value={newPart.quantity}
                                onChange={(e) => setNewPart({ ...newPart, quantity: parseInt(e.target.value) || 1 })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Egységár (Ft)</Label>
                              <Input
                                type="number"
                                value={newPart.price || ''}
                                onChange={(e) => setNewPart({ ...newPart, price: e.target.value ? parseFloat(e.target.value) : undefined })}
                              />
                            </div>
                          </div>
                          <Button className="w-full" onClick={handleAddPart}>Hozzáadás</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {(service.parts || []).length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Még nincs alkatrész hozzáadva</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(service.parts || []).map((part) => (
                        <div key={part.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{part.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {part.partNumber && `${part.partNumber} • `}
                              {part.quantity} db
                              {part.price && ` • ${(part.price * part.quantity).toLocaleString()} Ft`}
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleRemovePart(part.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-border flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Összesen:</span>
                        <span className="font-medium">{partsTotal.toLocaleString()} Ft</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="photos" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Fotók
                    </CardTitle>
                    <label htmlFor="photo-upload">
                      <Button size="sm" variant="outline" className="h-8" asChild>
                        <span>
                          <Plus className="h-3 w-3 mr-1" />
                          Feltöltés
                        </span>
                      </Button>
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {(service.photos || []).length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Még nincs fotó feltöltve</p>
                      <p className="text-xs mt-1">Előtte/utána képek a javításokról</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {(service.photos || []).map((photo, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                          <img src={photo} alt={`Fotó ${index + 1}`} className="w-full h-full object-cover" />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemovePhoto(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </>
  );
}
