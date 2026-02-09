import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Car, Wrench, LayoutDashboard, CalendarClock, BarChart3, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Áttekintés' },
  { path: '/appointments', icon: CalendarClock, label: 'Előjegyzés' },
  { path: '/customers', icon: Users, label: 'Ügyfelek' },
  { path: '/vehicles', icon: Car, label: 'Autók' },
  { path: '/services', icon: Wrench, label: 'Szerviz' },
];

const moreItems = [
  { path: '/statistics', icon: BarChart3, label: 'Statisztikák' },
  { path: '/data', icon: MoreHorizontal, label: 'Adatkezelés' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const isMoreActive = moreItems.some(item => location.pathname === item.path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all relative',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full" />
              )}
              <item.icon className={cn(
                'h-5 w-5 transition-transform',
                isActive && 'scale-110'
              )} strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn(
                'text-[10px] transition-all',
                isActive ? 'font-bold' : 'font-medium'
              )}>{item.label}</span>
            </button>
          );
        })}
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all relative',
                isMoreActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {/* Active indicator bar */}
              {isMoreActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full" />
              )}
              <MoreHorizontal className={cn(
                'h-5 w-5 transition-transform',
                isMoreActive && 'scale-110'
              )} strokeWidth={isMoreActive ? 2.5 : 2} />
              <span className={cn(
                'text-[10px] transition-all',
                isMoreActive ? 'font-bold' : 'font-medium'
              )}>Több</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="pb-safe">
            <SheetHeader>
              <SheetTitle>További menüpontok</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-3 mt-4 pb-4">
              {moreItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 p-4 rounded-lg border transition-colors',
                      isActive
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-secondary/30 border-border hover:bg-secondary'
                    )}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}