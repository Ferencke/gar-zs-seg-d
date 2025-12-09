import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FilterOption {
  id: string;
  label: string;
}

interface SearchFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  filters?: {
    label: string;
    options: FilterOption[];
    selected: string[];
    onToggle: (id: string) => void;
  }[];
}

export function SearchFilter({
  search,
  onSearchChange,
  placeholder = 'Keresés...',
  filters,
}: SearchFilterProps) {
  const activeFiltersCount = filters?.reduce((acc, f) => acc + f.selected.length, 0) || 0;

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => onSearchChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {filters && filters.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 relative">
              <Filter className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-1.5 -right-1.5 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {filters.map((filter, index) => (
              <div key={filter.label}>
                {index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel>{filter.label}</DropdownMenuLabel>
                {filter.options.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.id}
                    checked={filter.selected.includes(option.id)}
                    onCheckedChange={() => filter.onToggle(option.id)}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
