import { useLocalStorage } from './useLocalStorage';
import { Todo } from '@/types';

export function useTodos() {
  const [todos, setTodos] = useLocalStorage<Todo[]>('workshop-todos', []);

  const addTodo = (todo: Omit<Todo, 'id' | 'createdAt' | 'completed'>) => {
    const newTodo: Todo = {
      ...todo,
      id: crypto.randomUUID(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTodos((prev) => [...prev, newTodo]);
    return newTodo;
  };

  const updateTodo = (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, ...updates } : todo))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const toggleComplete = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const getTodayTodos = () => {
    const today = new Date().toISOString().split('T')[0];
    return todos.filter((t) => !t.completed && t.dueDate === today);
  };

  const getTomorrowTodos = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    return todos.filter((t) => !t.completed && t.dueDate === tomorrowStr);
  };

  const getUpcomingTodos = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return todos
      .filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) >= today)
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  };

  const getOverdueTodos = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return todos.filter(
      (t) => !t.completed && t.dueDate && new Date(t.dueDate) < today
    );
  };

  return {
    todos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    getTodayTodos,
    getTomorrowTodos,
    getUpcomingTodos,
    getOverdueTodos,
  };
}
