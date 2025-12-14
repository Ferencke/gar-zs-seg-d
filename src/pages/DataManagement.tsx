import { useRef } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { useVehicles } from '@/hooks/useVehicles';
import { useServiceRecords } from '@/hooks/useServiceRecords';
import { useAppointments } from '@/hooks/useAppointments';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Download, Upload, Database, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ExportData {
  version: string;
  exportedAt: string;
  customers: any[];
  vehicles: any[];
  serviceRecords: any[];
  appointments: any[];
}

export default function DataManagement() {
  const { customers } = useCustomers();
  const { vehicles } = useVehicles();
  const { serviceRecords } = useServiceRecords();
  const { appointments } = useAppointments();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data: ExportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      customers,
      vehicles,
      serviceRecords,
      appointments,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `garage-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Adatok exportálva!');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data: ExportData = JSON.parse(content);

        if (!data.version || !data.customers || !data.vehicles || !data.serviceRecords) {
          throw new Error('Invalid backup file format');
        }

        // Import data to localStorage
        if (data.customers?.length > 0) {
          localStorage.setItem('garage-customers', JSON.stringify(data.customers));
        }
        if (data.vehicles?.length > 0) {
          localStorage.setItem('garage-vehicles', JSON.stringify(data.vehicles));
        }
        if (data.serviceRecords?.length > 0) {
          localStorage.setItem('garage-services', JSON.stringify(data.serviceRecords));
        }
        if (data.appointments?.length > 0) {
          localStorage.setItem('garage-appointments', JSON.stringify(data.appointments));
        }

        toast.success('Adatok importálva! Az oldal frissül...');
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        toast.error('Hibás fájlformátum!');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearData = () => {
    localStorage.removeItem('garage-customers');
    localStorage.removeItem('garage-vehicles');
    localStorage.removeItem('garage-services');
    localStorage.removeItem('garage-appointments');
    toast.success('Adatok törölve! Az oldal frissül...');
    setTimeout(() => window.location.reload(), 1000);
  };

  const totalRecords = customers.length + vehicles.length + serviceRecords.length + appointments.length;

  return (
    <>
      <Header title="Adatkezelés" />
      <PageContainer>
        <div className="p-4 space-y-4 animate-fade-in">
          {/* Data Summary */}
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                Adatok összegzése
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between p-3 bg-gradient-to-r from-primary/10 to-transparent rounded-lg border border-primary/10">
                  <span className="text-muted-foreground">Ügyfelek</span>
                  <span className="font-bold text-primary">{customers.length}</span>
                </div>
                <div className="flex justify-between p-3 bg-gradient-to-r from-accent/10 to-transparent rounded-lg border border-accent/10">
                  <span className="text-muted-foreground">Járművek</span>
                  <span className="font-bold text-accent">{vehicles.length}</span>
                </div>
                <div className="flex justify-between p-3 bg-gradient-to-r from-success/10 to-transparent rounded-lg border border-success/10">
                  <span className="text-muted-foreground">Szervizbejegyzések</span>
                  <span className="font-bold text-success">{serviceRecords.length}</span>
                </div>
                <div className="flex justify-between p-3 bg-gradient-to-r from-warning/10 to-transparent rounded-lg border border-warning/10">
                  <span className="text-muted-foreground">Előjegyzések</span>
                  <span className="font-bold text-warning">{appointments.length}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Összesen <span className="font-semibold text-foreground">{totalRecords}</span> bejegyzés
              </p>
            </CardContent>
          </Card>

          {/* Export */}
          <Card className="border-success/20 hover:border-success/40 transition-colors">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="h-4 w-4 text-success" />
                Adatok exportálása
              </CardTitle>
              <CardDescription>
                Mentsd el az összes adatot JSON formátumban biztonsági másolatként.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExport} className="w-full bg-success hover:bg-success/90" disabled={totalRecords === 0}>
                <Download className="h-4 w-4 mr-2" />
                Exportálás JSON-ba
              </Button>
            </CardContent>
          </Card>

          {/* Import */}
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                Adatok importálása
              </CardTitle>
              <CardDescription>
                Töltsd be egy korábban mentett JSON fájlból az adatokat.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/10">
                    <Upload className="h-4 w-4 mr-2" />
                    Importálás JSON-ból
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="mx-4 max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Adatok importálása</AlertDialogTitle>
                    <AlertDialogDescription>
                      Az importálás felülírja a meglévő adatokat! Biztosan folytatod?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Mégse</AlertDialogCancel>
                    <AlertDialogAction onClick={() => fileInputRef.current?.click()}>
                      Fájl kiválasztása
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Clear Data */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Veszélyes zóna
              </CardTitle>
              <CardDescription>
                Az összes adat törlése. Ez a művelet nem vonható vissza!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" disabled={totalRecords === 0}>
                    Összes adat törlése
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="mx-4 max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Biztosan törlöd az összes adatot?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ez a művelet visszavonhatatlanul törli az összes ügyfelet, járművet, szervizbejegyzést és előjegyzést.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Mégse</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearData}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Törlés
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
