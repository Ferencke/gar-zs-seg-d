import { useCustomers } from '@/hooks/useCustomers';
import { useVehicles } from '@/hooks/useVehicles';
import { useServiceRecords } from '@/hooks/useServiceRecords';
import { useAppointments } from '@/hooks/useAppointments';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { QuickActions } from '@/components/QuickActions';
import { Users, Car, Wrench, CalendarClock, AlertTriangle, Clock, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export default function Dashboard() {
  const { customers } = useCustomers();
  const { vehicles } = useVehicles();
  const { serviceRecords } = useServiceRecords();
  const { getTodayAppointments, getUpcomingAppointments, appointments } = useAppointments();
  const navigate = useNavigate();

  const inProgressServices = serviceRecords.filter((s) => s.status === 'in-progress').length;
  const todayAppointments = getTodayAppointments();
  const upcomingAppointments = getUpcomingAppointments().slice(0, 3);

  // Get today's and tomorrow's tasks (scheduled appointments)
  const todayAndTomorrowTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const todayTasks = appointments.filter(
      (a) => a.scheduledDate === todayStr && a.status === 'scheduled'
    );
    const tomorrowTasks = appointments.filter(
      (a) => a.scheduledDate === tomorrowStr && a.status === 'scheduled'
    );

    // If no tasks today/tomorrow, get next upcoming
    let nextTask = null;
    if (todayTasks.length === 0 && tomorrowTasks.length === 0) {
      const upcoming = appointments
        .filter((a) => a.status === 'scheduled' && new Date(a.scheduledDate) >= today)
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
      nextTask = upcoming[0] || null;
    }

    return { todayTasks, tomorrowTasks, nextTask };
  }, [appointments]);

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

  const formatTaskDate = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = new Date(dateStr);
    
    if (date.toDateString() === today.toDateString()) return 'Ma';
    if (date.toDateString() === tomorrow.toDateString()) return 'Holnap';
    return date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <Header 
        title="Autószerviz Kezelő" 
        action={
          <div className="flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
          </div>
        }
      />
      <PageContainer>
        <div className="p-4 space-y-6 animate-fade-in">
          {/* Tasks Widget */}
          {(todayAndTomorrowTasks.todayTasks.length > 0 || todayAndTomorrowTasks.tomorrowTasks.length > 0 || todayAndTomorrowTasks.nextTask) && (
            <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Teendők
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {todayAndTomorrowTasks.todayTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-primary/10 rounded-lg cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => navigate('/appointments')}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{task.description}</p>
                      <p className="text-xs text-muted-foreground">{task.customerName}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="text-xs font-medium text-primary bg-primary/20 px-2 py-0.5 rounded">Ma</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{task.scheduledTime}</p>
                    </div>
                  </div>
                ))}
                {todayAndTomorrowTasks.tomorrowTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-accent/10 rounded-lg cursor-pointer hover:bg-accent/20 transition-colors"
                    onClick={() => navigate('/appointments')}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{task.description}</p>
                      <p className="text-xs text-muted-foreground">{task.customerName}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="text-xs font-medium text-accent bg-accent/20 px-2 py-0.5 rounded">Holnap</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{task.scheduledTime}</p>
                    </div>
                  </div>
                ))}
                {todayAndTomorrowTasks.nextTask && todayAndTomorrowTasks.todayTasks.length === 0 && todayAndTomorrowTasks.tomorrowTasks.length === 0 && (
                  <div 
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg cursor-pointer hover:bg-secondary transition-colors"
                    onClick={() => navigate('/appointments')}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{todayAndTomorrowTasks.nextTask.description}</p>
                      <p className="text-xs text-muted-foreground">{todayAndTomorrowTasks.nextTask.customerName}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                        {formatTaskDate(todayAndTomorrowTasks.nextTask.scheduledDate)}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">{todayAndTomorrowTasks.nextTask.scheduledTime}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
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
        
        <QuickActions />
      </PageContainer>
    </>
  );
}
