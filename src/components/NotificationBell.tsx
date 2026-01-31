import { useState, useMemo } from 'react';
import { Bell, AlertTriangle, Calendar, Check, Send, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useAppointments } from '@/hooks/useAppointments';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ShareReminderDialog } from './ShareReminderDialog';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { settings: companySettings } = useCompanySettings();
  const { appointments } = useAppointments();
  const navigate = useNavigate();
  const [shareDialog, setShareDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
  }>({ open: false, title: '', message: '' });

  // Get today's and tomorrow's tasks for notification
  const taskNotifications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const todayTasks = appointments.filter(
      (a) => a.scheduledDate === todayStr && a.status === 'scheduled'
    );
    const tomorrowTasks = appointments.filter(
      (a) => a.scheduledDate === tomorrowStr && a.status === 'scheduled'
    );

    const tasks: Array<{
      id: string;
      type: 'task';
      title: string;
      message: string;
      isToday: boolean;
    }> = [];
    
    if (todayTasks.length > 0) {
      tasks.push({
        id: 'today-tasks',
        type: 'task',
        title: `${todayTasks.length} mai teendő`,
        message: todayTasks.map(t => `${t.scheduledTime} - ${t.description}`).join(', '),
        isToday: true,
      });
    }
    
    if (tomorrowTasks.length > 0) {
      tasks.push({
        id: 'tomorrow-tasks',
        type: 'task',
        title: `${tomorrowTasks.length} holnapi teendő`,
        message: tomorrowTasks.map(t => `${t.scheduledTime} - ${t.description}`).join(', '),
        isToday: false,
      });
    }

    return tasks;
  }, [appointments]);

  const totalUnread = unreadCount + taskNotifications.length;

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id);
    if (notification.vehicleId) {
      navigate(`/vehicles/${notification.vehicleId}`);
    } else if (notification.appointmentId) {
      navigate('/appointments');
    }
  };

  const handleSendReminder = (
    e: React.MouseEvent,
    notification: typeof notifications[0]
  ) => {
    e.stopPropagation();
    
    const companyName = companySettings.name || 'Autószerviz';
    const companyPhone = companySettings.phone ? `\nTelefon: ${companySettings.phone}` : '';
    
    let message = '';
    if (notification.type === 'inspection') {
      message = `${companyName} értesítése:\n\n${notification.title}\n${notification.message}\n\nKérjük, vegye fel velünk a kapcsolatot időpont egyeztetéshez!${companyPhone}`;
    } else {
      message = `${companyName} emlékeztetője:\n\n${notification.title}\n${notification.message}\n\nVárjuk szeretettel!${companyPhone}`;
    }

    setShareDialog({
      open: true,
      title: notification.title,
      message,
    });
  };

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 relative">
            <Bell className="h-4 w-4" />
            {totalUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
            <span className="sr-only">Értesítések</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="flex flex-row items-center justify-between pr-6">
            <SheetTitle>Értesítések</SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={markAllAsRead}>
                <Check className="h-3 w-3 mr-1" />
                Mind olvasott
              </Button>
            )}
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-120px)] mt-4">
            {notifications.length === 0 && taskNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm">Nincs értesítés</p>
              </div>
            ) : (
              <div className="space-y-2 pr-2">
                {/* Task notifications */}
                {taskNotifications.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-colors cursor-pointer',
                      task.isToday
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-accent/10 border-accent/30'
                    )}
                    onClick={() => navigate('/appointments')}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'p-2 rounded-full shrink-0',
                          task.isToday
                            ? 'bg-primary/20 text-primary'
                            : 'bg-accent/20 text-accent'
                        )}
                      >
                        <ClipboardList className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm">{task.title}</p>
                          <span className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded shrink-0',
                            task.isToday
                              ? 'bg-primary/20 text-primary'
                              : 'bg-accent/20 text-accent'
                          )}>
                            {task.isToday ? 'Ma' : 'Holnap'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {task.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Regular notifications */}
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-colors',
                      notification.read
                        ? 'bg-background border-border'
                        : 'bg-primary/5 border-primary/20'
                    )}
                  >
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'p-2 rounded-full shrink-0',
                            notification.type === 'inspection'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-primary/10 text-primary'
                          )}
                        >
                          {notification.type === 'inspection' ? (
                            <AlertTriangle className="h-4 w-4" />
                          ) : (
                            <Calendar className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm truncate">{notification.title}</p>
                            {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </button>
                    <div className="mt-2 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5"
                        onClick={(e) => handleSendReminder(e, notification)}
                      >
                        <Send className="h-3 w-3" />
                        Emlékeztető küldése
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <ShareReminderDialog
        open={shareDialog.open}
        onOpenChange={(open) => setShareDialog((prev) => ({ ...prev, open }))}
        title={shareDialog.title}
        message={shareDialog.message}
      />
    </>
  );
}
