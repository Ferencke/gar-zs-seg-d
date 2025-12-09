import { Plus, UserPlus, Car, CalendarPlus, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: UserPlus,
      label: 'Új ügyfél',
      onClick: () => navigate('/customers'),
    },
    {
      icon: CalendarPlus,
      label: 'Új előjegyzés',
      onClick: () => navigate('/appointments'),
    },
    {
      icon: Wrench,
      label: 'Szervizek',
      onClick: () => navigate('/services'),
    },
    {
      icon: Car,
      label: 'Autók',
      onClick: () => navigate('/vehicles'),
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" className="h-12 w-12 rounded-full shadow-lg fixed bottom-20 right-4 z-50">
          <Plus className="h-6 w-6" />
          <span className="sr-only">Gyors műveletek</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="mb-2">
        {actions.map((action) => (
          <DropdownMenuItem key={action.label} onClick={action.onClick}>
            <action.icon className="mr-2 h-4 w-4" />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
