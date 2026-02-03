import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '@/hooks/useCustomers';
import { useVehicles } from '@/hooks/useVehicles';
import { useServiceRecords } from '@/hooks/useServiceRecords';
import { useAppointments } from '@/hooks/useAppointments';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { useTodos } from '@/hooks/useTodos';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Upload, AlertTriangle, Building2, ChevronRight, Cloud, CloudOff, Settings, Check, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ExportData {
  version: string;
  exportedAt: string;
  customers: any[];
  vehicles: any[];
  serviceRecords: any[];
  appointments: any[];
  todos?: any[];
  companySettings?: any;
}

export default function DataManagement() {
  const navigate = useNavigate();
  const { customers } = useCustomers();
  const { vehicles } = useVehicles();
  const { serviceRecords } = useServiceRecords();
  const { appointments } = useAppointments();
  const { todos } = useTodos();
  const { settings: companySettings } = useCompanySettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Google Drive
  const {
    settings: driveSettings,
    isConfigured: isDriveConfigured,
    isLoading: isDriveLoading,
    error: driveError,
    updateSettings: updateDriveSettings,
    testConnection,
    exportToCloud,
    importFromCloud,
  } = useGoogleDrive();
  
  const [showDriveConfig, setShowDriveConfig] = useState(false);
  const [tempFolderId, setTempFolderId] = useState(driveSettings.folderId);
  const [tempServiceKey, setTempServiceKey] = useState(driveSettings.serviceAccountKeyJson);
  const [connectionTested, setConnectionTested] = useState(false);

  const getExportData = (): ExportData => ({
    version: '1.0',
    exportedAt: new Date().toISOString(),
    customers,
    vehicles,
    serviceRecords,
    appointments,
    todos,
    companySettings,
  });

  const handleExport = () => {
    const data = getExportData();

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
        if (data.todos?.length > 0) {
          localStorage.setItem('garage-todos', JSON.stringify(data.todos));
        }
        if (data.companySettings) {
          localStorage.setItem('companySettings', JSON.stringify(data.companySettings));
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
    localStorage.removeItem('garage-todos');
    toast.success('Adatok törölve! Az oldal frissül...');
    setTimeout(() => window.location.reload(), 1000);
  };

  // Google Drive handlers
  const handleSaveDriveConfig = async () => {
    updateDriveSettings({
      folderId: tempFolderId,
      serviceAccountKeyJson: tempServiceKey,
    });
    setConnectionTested(false);
    toast.success('Beállítások mentve!');
    setShowDriveConfig(false);
  };

  const handleTestConnection = async () => {
    // Temporarily update settings to test
    updateDriveSettings({
      folderId: tempFolderId,
      serviceAccountKeyJson: tempServiceKey,
    });
    
    // Wait a tick for state update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const success = await testConnection();
    if (success) {
      setConnectionTested(true);
      toast.success('Kapcsolat sikeres!');
    } else {
      toast.error(driveError || 'Kapcsolódási hiba');
    }
  };

  const handleCloudExport = async () => {
    const data = getExportData();
    const success = await exportToCloud(data);
    if (success) {
      toast.success('Adatok feltöltve a Google Drive-ra!');
    } else {
      toast.error(driveError || 'Feltöltési hiba');
    }
  };

  const handleCloudImport = async () => {
    const data = await importFromCloud();
    if (data) {
      const importData = data as ExportData;
      if (importData.customers?.length > 0) {
        localStorage.setItem('garage-customers', JSON.stringify(importData.customers));
      }
      if (importData.vehicles?.length > 0) {
        localStorage.setItem('garage-vehicles', JSON.stringify(importData.vehicles));
      }
      if (importData.serviceRecords?.length > 0) {
        localStorage.setItem('garage-services', JSON.stringify(importData.serviceRecords));
      }
      if (importData.appointments?.length > 0) {
        localStorage.setItem('garage-appointments', JSON.stringify(importData.appointments));
      }
      if (importData.todos?.length > 0) {
        localStorage.setItem('garage-todos', JSON.stringify(importData.todos));
      }
      if (importData.companySettings) {
        localStorage.setItem('companySettings', JSON.stringify(importData.companySettings));
      }
      toast.success('Adatok importálva a felhőből! Az oldal frissül...');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error(driveError || 'Importálási hiba');
    }
  };

  const totalRecords = customers.length + vehicles.length + serviceRecords.length + appointments.length + todos.length;

  return (
    <>
      <Header title="Adatkezelés" />
      <PageContainer>
        <div className="p-4 space-y-4 animate-fade-in">
          {/* Company Settings */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-all border-accent/20 hover:border-accent/40 bg-gradient-to-br from-accent/5 to-transparent"
            onClick={() => navigate('/company')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <Building2 className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-medium">Céges adatok</h3>
                    <p className="text-sm text-muted-foreground">
                      Szerkeszd a cég adatait (munkalapon, számlákon megjelenik)
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Google Drive Cloud Sync */}
          <Card className="border-blue-500/20 hover:border-blue-500/40 transition-colors bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {isDriveConfigured ? (
                  <Cloud className="h-4 w-4 text-blue-500" />
                ) : (
                  <CloudOff className="h-4 w-4 text-muted-foreground" />
                )}
                Google Drive szinkronizálás
              </CardTitle>
              <CardDescription>
                {isDriveConfigured 
                  ? `Kapcsolódva. Utolsó szinkronizálás: ${driveSettings.lastSyncAt ? new Date(driveSettings.lastSyncAt).toLocaleString('hu-HU') : 'még nem volt'}`
                  : 'Állítsd be a Google Drive szinkronizálást a felhőalapú mentéshez.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isDriveConfigured ? (
                <>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCloudExport} 
                      className="flex-1 bg-blue-500 hover:bg-blue-600"
                      disabled={isDriveLoading || totalRecords === 0}
                    >
                      {isDriveLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Feltöltés
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="flex-1 border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
                          disabled={isDriveLoading}
                        >
                          {isDriveLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          Letöltés
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="mx-4 max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Adatok letöltése a felhőből</AlertDialogTitle>
                          <AlertDialogDescription>
                            Ez felülírja a helyi adatokat a legutóbbi felhőmentéssel. Biztosan folytatod?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Mégse</AlertDialogCancel>
                          <AlertDialogAction onClick={handleCloudImport}>
                            Letöltés és felülírás
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-muted-foreground"
                    onClick={() => {
                      setTempFolderId(driveSettings.folderId);
                      setTempServiceKey(driveSettings.serviceAccountKeyJson);
                      setShowDriveConfig(true);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Beállítások módosítása
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setTempFolderId(driveSettings.folderId);
                    setTempServiceKey(driveSettings.serviceAccountKeyJson);
                    setShowDriveConfig(true);
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Google Drive beállítása
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Drive Config Dialog */}
          <Dialog open={showDriveConfig} onOpenChange={setShowDriveConfig}>
            <DialogContent className="mx-4 max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Google Drive beállítások</DialogTitle>
                <DialogDescription>
                  Add meg a Google Drive mappa ID-t és a Service Account kulcsot.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="folderId">Drive Mappa ID</Label>
                  <Input
                    id="folderId"
                    placeholder="pl. 1AbCdEfGhIjKlMnOpQrStUvWxYz"
                    value={tempFolderId}
                    onChange={(e) => setTempFolderId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    A mappa URL-jéből: drive.google.com/drive/folders/<strong>[MAPPA_ID]</strong>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceKey">Service Account kulcs (JSON)</Label>
                  <Textarea
                    id="serviceKey"
                    placeholder='{"type": "service_account", ...}'
                    value={tempServiceKey}
                    onChange={(e) => setTempServiceKey(e.target.value)}
                    rows={6}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    A teljes JSON kulcsfájl tartalma (Google Cloud Console-ból).
                  </p>
                </div>
                {connectionTested && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 p-2 rounded">
                    <Check className="h-4 w-4" />
                    Kapcsolat sikeresen tesztelve!
                  </div>
                )}
                {driveError && (
                  <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                    {driveError}
                  </div>
                )}
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isDriveLoading || !tempFolderId || !tempServiceKey}
                >
                  {isDriveLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Kapcsolat tesztelése
                </Button>
                <Button 
                  onClick={handleSaveDriveConfig}
                  disabled={!tempFolderId || !tempServiceKey}
                >
                  Mentés
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Local Export */}
          <Card className="border-success/20 hover:border-success/40 transition-colors">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="h-4 w-4 text-success" />
                Helyi exportálás
              </CardTitle>
              <CardDescription>
                Mentsd el az összes adatot JSON formátumban a készülékre.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExport} className="w-full bg-success hover:bg-success/90" disabled={totalRecords === 0}>
                <Download className="h-4 w-4 mr-2" />
                Exportálás JSON-ba
              </Button>
            </CardContent>
          </Card>

          {/* Local Import */}
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                Helyi importálás
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
