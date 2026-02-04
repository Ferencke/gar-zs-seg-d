import { useState, useMemo } from 'react';
import { useTodos } from '@/hooks/useTodos';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Plus, Check, Trash2, ChevronLeft, ChevronRight, Clock, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Todo } from '@/types';
import { formatDateToLocal } from '@/utils/dateUtils';

export default function Todos() {
  const { todos, addTodo, updateTodo, deleteTodo, toggleComplete, getOverdueTodos } = useTodos();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [todoForm, setTodoForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    dueTime: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  // Get todos for each day - use local timezone
  const getTodosForDate = (date: Date) => {
    const dateStr = formatDateToLocal(date);
    return todos.filter(t => t.dueDate === dateStr);
  };

  // Calendar month navigation
  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Get month days for calendar
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);
  const dayNames = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get todos for selected date
  const selectedDateTodos = selectedDate ? getTodosForDate(selectedDate) : [];
  
  // Overdue todos
  const overdueTodos = getOverdueTodos();

  const priorityColors = {
    low: 'bg-secondary/50 text-muted-foreground border-secondary',
    medium: 'bg-primary/10 text-primary border-primary/30',
    high: 'bg-warning/10 text-warning border-warning/30',
  };

  const priorityLabels = {
    low: 'Alacsony',
    medium: 'Közepes',
    high: 'Magas',
  };

  const resetForm = () => {
    setTodoForm({
      title: '',
      description: '',
      dueDate: '',
      dueTime: '',
      priority: 'medium',
    });
  };

  const openAddDialog = (date?: Date) => {
    resetForm();
    if (date) {
      setTodoForm(prev => ({
        ...prev,
        dueDate: formatDateToLocal(date),
      }));
    }
    setIsAddOpen(true);
  };

  const openEditDialog = (todo: Todo) => {
    setEditingTodo(todo);
    setTodoForm({
      title: todo.title,
      description: todo.description || '',
      dueDate: todo.dueDate || '',
      dueTime: todo.dueTime || '',
      priority: todo.priority,
    });
    setIsEditOpen(true);
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
    setIsAddOpen(false);
    resetForm();
  };

  const handleEditTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo || !todoForm.title.trim()) {
      toast.error('A cím kötelező!');
      return;
    }
    updateTodo(editingTodo.id, {
      title: todoForm.title,
      description: todoForm.description || undefined,
      dueDate: todoForm.dueDate || undefined,
      dueTime: todoForm.dueTime || undefined,
      priority: todoForm.priority,
    });
    toast.success('Teendő frissítve!');
    setIsEditOpen(false);
    setEditingTodo(null);
    resetForm();
  };

  const handleDeleteTodo = (id: string) => {
    deleteTodo(id);
    toast.success('Teendő törölve!');
  };

  const renderTodoForm = (onSubmit: (e: React.FormEvent) => void) => (
    <form onSubmit={onSubmit} className="space-y-4">
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
  );

  const renderTodoItem = (todo: Todo, showDate = false) => (
    <div 
      key={todo.id}
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border',
        todo.completed ? 'opacity-50 bg-secondary/30' : priorityColors[todo.priority]
      )}
    >
      <div className="flex-1 min-w-0">
        <p className={cn('font-medium text-sm truncate', todo.completed && 'line-through')}>
          {todo.title}
        </p>
        {todo.description && (
          <p className="text-xs text-muted-foreground truncate">{todo.description}</p>
        )}
        {showDate && todo.dueDate && (
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(todo.dueDate).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
            {todo.dueTime && ` ${todo.dueTime}`}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-2">
        {todo.dueTime && !showDate && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {todo.dueTime}
          </span>
        )}
        <span className={cn(
          'text-xs px-1.5 py-0.5 rounded',
          priorityColors[todo.priority]
        )}>
          {priorityLabels[todo.priority]}
        </span>
        {!todo.completed && (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:bg-secondary"
              onClick={() => openEditDialog(todo)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:bg-success/20"
              onClick={() => {
                toggleComplete(todo.id);
                toast.success('Teendő elvégezve!');
              }}
            >
              <Check className="h-3 w-3 text-success" />
            </Button>
          </>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-destructive/20">
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="mx-4 max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Teendő törlése</AlertDialogTitle>
              <AlertDialogDescription>
                Biztosan törölni szeretnéd ezt a teendőt?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Mégse</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeleteTodo(todo.id)}>
                Törlés
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

  return (
    <>
      <Header 
        title="Teendők" 
        action={
          <Button size="sm" className="h-9 bg-gradient-to-r from-primary to-primary/80" onClick={() => openAddDialog()}>
            <Plus className="h-4 w-4 mr-1" />
            Új
          </Button>
        }
      />
      <PageContainer>
        <div className="p-4 space-y-4 animate-fade-in">
          {/* Overdue Todos */}
          {overdueTodos.length > 0 && (
            <Card className="border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <Clock className="h-4 w-4" />
                  Lejárt határidejű ({overdueTodos.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {overdueTodos.map(todo => renderTodoItem(todo, true))}
              </CardContent>
            </Card>
          )}

          {/* Calendar */}
          <Card className="border-primary/20">
            <CardContent className="p-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium">
                  {currentDate.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' })}
                </span>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Day Names */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((date, index) => {
                  if (!date) return <div key={index} className="aspect-square" />;
                  
                  const dayTodos = getTodosForDate(date);
                  const incompleteTodos = dayTodos.filter(t => !t.completed);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isPast = date < today;
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  const hasHighPriority = incompleteTodos.some(t => t.priority === 'high');
                  
                  return (
                    <div 
                      key={index}
                      onClick={() => setSelectedDate(isSelected ? null : date)}
                      className={cn(
                        'aspect-square p-1 border border-border rounded-md flex flex-col cursor-pointer transition-all hover:scale-105',
                        isToday && 'bg-primary/10 border-primary',
                        isPast && !isToday && 'opacity-60',
                        isSelected && 'ring-2 ring-primary',
                        incompleteTodos.length > 0 && !isSelected && 'hover:bg-secondary/50'
                      )}
                    >
                      <span className={cn(
                        'text-xs font-medium',
                        isToday && 'text-primary'
                      )}>
                        {date.getDate()}
                      </span>
                      {incompleteTodos.length > 0 && (
                        <div className="flex-1 flex items-center justify-center">
                          <span className={cn(
                            'inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-medium',
                            hasHighPriority 
                              ? 'bg-warning text-warning-foreground' 
                              : 'bg-primary text-primary-foreground'
                          )}>
                            {incompleteTodos.length}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Date Todos */}
          {selectedDate && (
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {selectedDate.toLocaleDateString('hu-HU', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </CardTitle>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => openAddDialog(selectedDate)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Új
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedDateTodos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nincs teendő erre a napra
                  </p>
                ) : (
                  selectedDateTodos.map(todo => renderTodoItem(todo))
                )}
              </CardContent>
            </Card>
          )}

          {/* All Todos Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Összes teendő</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-lg bg-warning/10">
                  <p className="text-2xl font-bold text-warning">
                    {todos.filter(t => !t.completed).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Aktív</p>
                </div>
                <div className="p-3 rounded-lg bg-success/10">
                  <p className="text-2xl font-bold text-success">
                    {todos.filter(t => t.completed).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Kész</p>
                </div>
                <div className="p-3 rounded-lg bg-destructive/10">
                  <p className="text-2xl font-bold text-destructive">
                    {overdueTodos.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Lejárt</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Todo Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="mx-4 max-w-md">
            <DialogHeader>
              <DialogTitle>Új teendő</DialogTitle>
            </DialogHeader>
            {renderTodoForm(handleAddTodo)}
          </DialogContent>
        </Dialog>

        {/* Edit Todo Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="mx-4 max-w-md">
            <DialogHeader>
              <DialogTitle>Teendő szerkesztése</DialogTitle>
            </DialogHeader>
            {renderTodoForm(handleEditTodo)}
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
