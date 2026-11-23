export type Priority = 'none' | 'low' | 'medium' | 'high';

export interface Todo {
  id: string;
  title: string;
  notes: string;
  priority: Priority;
  /** Due day as YYYY-MM-DD (local), or null. */
  due: string | null;
  tags: string[];
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TodoInput = Pick<Todo, 'title' | 'notes' | 'priority' | 'due' | 'tags'>;
