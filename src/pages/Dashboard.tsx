import { useCustomers } from '@/hooks/useCustomers';
import { useVehicles } from '@/hooks/useVehicles';
import { useServiceRecords } from '@/hooks/useServiceRecords';
import { useAppointments } from '@/hooks/useAppointments';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, Wrench, CalendarClock, AlertTriangle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { customers } = useCustomers();
  const { vehicles } = useVehicles();
  const { serviceRecords } = useServiceRecords();
  const { getTodayAppointments, getUpcomingAppointments } = useAppointments();
  const navigate = useNavigate();

  const inProgressServices = serviceRecords.filter((s) => s.status === 'in-progress').length;
  const todayAppointments = getTodayAppointments();
  const upcomingAppointments = getUpcomingAppointments().slice(0, 3);

  // Vehicles with expiring inspection (within 30 days)
  const expiringVehicles = vehicles.filter((v) => {
    if (!v.technicalInspectionDate) return false;
    const days = Math.ceil((new Date(v.technicalInspectionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 30;
  }).sort((a, b) => new Date(a.technicalInspectionDate!).getTime() - new Date(b.technicalInspectionDate!).getTime());

  const stats = [
    { title: 'Ügyfelek', value: customers.length, icon: Users, color: 'text-primary', bg: 'bg-primary/10', onClick: () => navigate('/customers') },
    { title: 'Autók', value: vehicles.length, icon: Car, color: 'text-accent', bg: 'bg-accent/10', onClick: () => navigate('/vehicles') },
    { title: 'Mai előjegyzés', value: todayAppointments.length, icon: CalendarClock, color: 'text-success', bg: 'bg-success/10', onClick: () => navigate('/appointments') },
    { title: 'Folyamatban', value: inProgressServices, icon: Wrench, color: 'text-warning', bg: 'bg-warning/10', onClick: () => navigate('/services') },
  ];

  return (
    <>
      <Header title="Autószerviz Kezelő" />
      <PageContainer>
        <div className="p-4 space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <Card key={stat.title} className="cursor-pointer hover:shadow-md transition-shadow" onClick={stat.onClick}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stat.bg}`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div>
                    <div><p className="text-2xl font-bold">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.title}</p></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {expiringVehicles.length > 0 && (
            <Card className="border-warning">
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" />Lejáró műszakik</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {expiringVehicles.slice(0, 3).map((v) => {
                  const days = Math.ceil((new Date(v.technicalInspectionDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={v.id} className="flex items-center justify-between p-2 bg-warning/5 rounded cursor-pointer" onClick={() => navigate(`/vehicles/${v.id}`)}>
                      <span className="text-sm font-medium">{v.brand} {v.model} ({v.licensePlate})</span>
                      <span className={cn('text-xs px-2 py-1 rounded', days < 0 ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning')}>
                        {days < 0 ? `${Math.abs(days)} napja lejárt` : `${days} nap`}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {upcomingAppointments.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Közelgő előjegyzések</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {upcomingAppointments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded cursor-pointer" onClick={() => navigate('/appointments')}>
                    <div><p className="text-sm font-medium">{a.description}</p><p className="text-xs text-muted-foreground">{a.customerName}</p></div>
                    <div className="text-right"><p className="text-xs text-primary">{new Date(a.scheduledDate).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}</p><p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{a.scheduledTime}</p></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {customers.length === 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto text-primary/50 mb-3" />
                <h3 className="font-medium mb-1">Kezdj el dolgozni!</h3>
                <p className="text-sm text-muted-foreground mb-4">Add hozzá az első ügyfelet</p>
                <button onClick={() => navigate('/customers')} className="text-primary text-sm font-medium">Új ügyfél hozzáadása →</button>
              </CardContent>
            </Card>
          )}
        </div>
      </PageContainer>
    </>
  );
}
