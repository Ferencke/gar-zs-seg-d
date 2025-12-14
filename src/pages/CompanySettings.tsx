import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { toast } from 'sonner';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  CreditCard, 
  Globe, 
  Save,
  RotateCcw
} from 'lucide-react';

export default function CompanySettings() {
  const { settings, updateSettings, resetSettings } = useCompanySettings();
  const [formData, setFormData] = useState(settings);

  const handleSave = () => {
    updateSettings(formData);
    toast.success('Céges adatok mentve!');
  };

  const handleReset = () => {
    resetSettings();
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      taxNumber: '',
      bankAccount: '',
      website: '',
      logo: '',
    });
    toast.success('Beállítások visszaállítva!');
  };

  const inputFields = [
    { key: 'name', label: 'Cégnév', icon: Building2, placeholder: 'pl. Autószerviz Kft.' },
    { key: 'address', label: 'Cím', icon: MapPin, placeholder: 'pl. 1234 Budapest, Fő utca 1.' },
    { key: 'phone', label: 'Telefonszám', icon: Phone, placeholder: 'pl. +36 1 234 5678' },
    { key: 'email', label: 'E-mail', icon: Mail, placeholder: 'pl. info@szerviz.hu', type: 'email' },
    { key: 'taxNumber', label: 'Adószám', icon: FileText, placeholder: 'pl. 12345678-1-12' },
    { key: 'bankAccount', label: 'Bankszámlaszám', icon: CreditCard, placeholder: 'pl. 12345678-12345678-12345678' },
    { key: 'website', label: 'Weboldal', icon: Globe, placeholder: 'pl. https://szerviz.hu' },
  ];

  return (
    <>
      <Header title="Céges adatok" />
      <PageContainer>
        <div className="p-4 space-y-4 animate-fade-in">
          {/* Header Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Cég beállítások</h2>
                  <p className="text-sm text-muted-foreground">
                    Ezek az adatok megjelennek a munkalapokon és számlákon
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Alapadatok
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {inputFields.map(({ key, label, icon: Icon, placeholder, type }) => (
                <div key={key} className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {label}
                  </Label>
                  <Input
                    type={type || 'text'}
                    value={formData[key as keyof typeof formData] || ''}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="bg-secondary/30"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Preview */}
          {formData.name && (
            <Card className="bg-gradient-to-br from-success/10 via-success/5 to-transparent border-success/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-success">
                  <FileText className="h-4 w-4" />
                  Előnézet (munkalap fejléc)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-card rounded-lg border space-y-1 text-center">
                  <h3 className="font-bold text-lg">{formData.name}</h3>
                  {formData.address && <p className="text-sm text-muted-foreground">{formData.address}</p>}
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {formData.phone && <span>Tel: {formData.phone}</span>}
                    {formData.email && <span>E-mail: {formData.email}</span>}
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                    {formData.taxNumber && <span>Adószám: {formData.taxNumber}</span>}
                    {formData.website && <span>{formData.website}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Visszaállítás
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-primary to-primary/80"
              onClick={handleSave}
            >
              <Save className="h-4 w-4 mr-2" />
              Mentés
            </Button>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
