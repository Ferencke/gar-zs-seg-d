import { useState } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { useVehicles } from '@/hooks/useVehicles';
import { useServiceRecords } from '@/hooks/useServiceRecords';
import { useAppointments } from '@/hooks/useAppointments';
import { useTodos } from '@/hooks/useTodos';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { QuickActions } from '@/components/QuickActions';
import { Users, Car, Wrench, CalendarClock, AlertTriangle, Clock, ClipboardList, Plus, Check, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { toast } from 'sonner';

export default function Dashboard() {
  const { customers } = useCustomers();
  const { vehicles } = useVehicles();
  const { serviceRecords } = useServiceRecords();
  const { getUpcomingAppointments, appointments } = useAppointments();
  const { todos, addTodo, toggleComplete, deleteTodo, getTodayTodos, getTomorrowTodos, getUpcomingTodos } = useTodos();
  const navigate = useNavigate();

  const [isAddTodoOpen, setIsAddTodoOpen] = useState(false);
  const [todoForm, setTodoForm] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const inProgressServices = serviceRecords.filter((s) => s.status === 'in-progress').length;
  const todayAppointments = appointments.filter(
    (a) => a.status === 'scheduled' && a.scheduledDate === new Date().toISOString().split('T')[0]
  );
  const upcomingAppointments = getUpcomingAppointments().slice(0, 3);

  // Get todos for display
  const displayTodos = useMemo(() => {
    const todayTodos = getTodayTodos();
    const tomorrowTodos = getTomorrowTodos();
    const upcomingTodos = getUpcomingTodos();
    
    // If no today/tomorrow, get the next upcoming one
    let nextTodo = null;
    if (todayTodos.length === 0 && tomorrowTodos.length === 0 && upcomingTodos.length > 0) {
      nextTodo = upcomingTodos[0];
    }

    return { todayTodos, tomorrowTodos, nextTodo };
  }, [todos]);

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

  const formatTodoDate = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = new Date(dateStr);
    
    if (date.toDateString() === today.toDateString()) return 'Ma';
    if (date.toDateString() === tomorrow.toDateString()) return 'Holnap';
    return date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!todoForm.title.trim()) {
      toast.error('A cím kötelező!');
      return;
    }
    addTodo({
      title: todoForm.title,
      description: todoForm.description || undefined,
      dueDate: todoForm.dueDate || undefined,
      dueTime: todoForm.dueTime || undefined,
      priority: todoForm.priority,
    });
    toast.success('Teendő hozzáadva!');
    setIsAddTodoOpen(false);
    setTodoForm({
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '',
      priority: 'medium',
    });
  };

  const priorityColors = {
    low: 'bg-secondary/50 text-muted-foreground',
    medium: 'bg-primary/10 text-primary',
    high: 'bg-warning/10 text-warning',
  };

  const hasTodos = displayTodos.todayTodos.length > 0 || displayTodos.tomorrowTodos.length > 0 || displayTodos.nextTodo;

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
          {/* Todos Widget */}
          <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Teendők
                </CardTitle>
                <Dialog open={isAddTodoOpen} onOpenChange={setIsAddTodoOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="mx-4 max-w-md">
                    <DialogHeader>
                      <DialogTitle>Új teendő</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddTodo} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Teendő *</Label>
                        <Input
                          value={todoForm.title}
                          onChange={(e) => setTodoForm({ ...todoForm, title: e.target.value })}
                          placeholder="pl. Alkatrész vásárlás"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Leírás</Label>
                        <Textarea
                          value={todoForm.description}
                          onChange={(e) => setTodoForm({ ...todoForm, description: e.target.value })}
                          placeholder="További részletek..."
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Határidő</Label>
                          <Input
                            type="date"
                            value={todoForm.dueDate}
                            onChange={(e) => setTodoForm({ ...todoForm, dueDate: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Időpont</Label>
                          <Input
                            type="time"
                            value={todoForm.dueTime}
                            onChange={(e) => setTodoForm({ ...todoForm, dueTime: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Prioritás</Label>
                        <Select
                          value={todoForm.priority}
                          onValueChange={(v) => setTodoForm({ ...todoForm, priority: v as 'low' | 'medium' | 'high' })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Alacsony</SelectItem>
                            <SelectItem value="medium">Közepes</SelectItem>
                            <SelectItem value="high">Magas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="w-full">Mentés</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {!hasTodos ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nincs teendő. Kattints a + gombra az új hozzáadásához!
                </p>
              ) : (
                <>
                  {displayTodos.todayTodos.map((todo) => (
                    <div 
                      key={todo.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg',
                        priorityColors[todo.priority]
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{todo.title}</p>
                        {todo.description && (
                          <p className="text-xs text-muted-foreground truncate">{todo.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs font-medium bg-primary/20 text-primary px-2 py-0.5 rounded">Ma</span>
                        {todo.dueTime && <span className="text-xs text-muted-foreground">{todo.dueTime}</span>}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-success/20"
                          onClick={() => {
                            toggleComplete(todo.id);
                            toast.success('Teendő elvégezve!');
                          }}
                        >
                          <Check className="h-3 w-3 text-success" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {displayTodos.tomorrowTodos.map((todo) => (
                    <div 
                      key={todo.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg',
                        priorityColors[todo.priority]
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{todo.title}</p>
                        {todo.description && (
                          <p className="text-xs text-muted-foreground truncate">{todo.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs font-medium bg-accent/20 text-accent px-2 py-0.5 rounded">Holnap</span>
                        {todo.dueTime && <span className="text-xs text-muted-foreground">{todo.dueTime}</span>}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-success/20"
                          onClick={() => {
                            toggleComplete(todo.id);
                            toast.success('Teendő elvégezve!');
                          }}
                        >
                          <Check className="h-3 w-3 text-success" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {displayTodos.nextTodo && displayTodos.todayTodos.length === 0 && displayTodos.tomorrowTodos.length === 0 && (
                    <div 
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg',
                        priorityColors[displayTodos.nextTodo.priority]
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{displayTodos.nextTodo.title}</p>
                        {displayTodos.nextTodo.description && (
                          <p className="text-xs text-muted-foreground truncate">{displayTodos.nextTodo.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {displayTodos.nextTodo.dueDate && (
                          <span className="text-xs font-medium bg-secondary px-2 py-0.5 rounded">
                            {formatTodoDate(displayTodos.nextTodo.dueDate)}
                          </span>
                        )}
                        {displayTodos.nextTodo.dueTime && (
                          <span className="text-xs text-muted-foreground">{displayTodos.nextTodo.dueTime}</span>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-success/20"
                          onClick={() => {
                            toggleComplete(displayTodos.nextTodo!.id);
                            toast.success('Teendő elvégezve!');
                          }}
                        >
                          <Check className="h-3 w-3 text-success" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

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
