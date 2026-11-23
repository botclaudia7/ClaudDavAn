import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readJSON, writeJSON } from '../lib/storage';
import type { Todo, TodoInput } from './types';

const STORAGE_KEY = 'daybook.todos.v1';

function loadTodos(): Todo[] {
  const raw = readJSON<Partial<Todo>[]>(STORAGE_KEY, []);
  if (!Array.isArray(raw)) return [];
  const now = new Date().toISOString();
  return raw
    .filter((t): t is Partial<Todo> & { id: string; title: string } => !!t?.id && typeof t.title === 'string')
    .map((t) => ({
      notes: '',
      priority: 'none',
      due: null,
      tags: [],
      completed: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      ...t,
    }));
}

interface TodoContextValue {
  todos: Todo[];
  addTodo: (input: TodoInput) => string;
  updateTodo: (id: string, patch: Partial<TodoInput>) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  clearCompleted: () => void;
  /** Puts previously removed tasks back (used for undo). */
  restoreTodos: (items: Todo[]) => void;
}

const TodoContext = createContext<TodoContextValue | null>(null);

export function TodoProvider({ children }: { children: ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);

  useEffect(() => {
    writeJSON(STORAGE_KEY, todos);
  }, [todos]);

  const addTodo = useCallback((input: TodoInput) => {
    const now = new Date().toISOString();
    const todo: Todo = {
      ...input,
      id: crypto.randomUUID(),
      completed: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    setTodos((prev) => [...prev, todo]);
    return todo.id;
  }, []);

  const updateTodo = useCallback((id: string, patch: Partial<TodoInput>) => {
    const now = new Date().toISOString();
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: now } : t)));
  }, []);

  const toggleTodo = useCallback((id: string) => {
    const now = new Date().toISOString();
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, completed: !t.completed, completedAt: t.completed ? null : now, updatedAt: now }
          : t,
      ),
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setTodos((prev) => prev.filter((t) => !t.completed));
  }, []);

  const restoreTodos = useCallback((items: Todo[]) => {
    setTodos((prev) => {
      const ids = new Set(prev.map((t) => t.id));
      return [...prev, ...items.filter((t) => !ids.has(t.id))];
    });
  }, []);

  const value = useMemo(
    () => ({ todos, addTodo, updateTodo, toggleTodo, deleteTodo, clearCompleted, restoreTodos }),
    [todos, addTodo, updateTodo, toggleTodo, deleteTodo, clearCompleted, restoreTodos],
  );

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
}

export function useTodos(): TodoContextValue {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error('useTodos must be used inside <TodoProvider>');
  return ctx;
}
