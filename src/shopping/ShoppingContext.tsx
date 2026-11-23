import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readJSON, writeJSON } from '../lib/storage';
import type { HistoryRecord, ItemInput, ShoppingItem } from './types';

const ITEMS_KEY = 'daybook.shopping.items.v1';
const HISTORY_KEY = 'daybook.shopping.history.v1';

const nameKey = (name: string) => name.trim().toLowerCase();

function loadItems(): ShoppingItem[] {
  const raw = readJSON<Partial<ShoppingItem>[]>(ITEMS_KEY, []);
  if (!Array.isArray(raw)) return [];
  const now = new Date().toISOString();
  return raw
    .filter((i): i is Partial<ShoppingItem> & { id: string; name: string } => !!i?.id && typeof i.name === 'string')
    .map((i) => ({
      quantity: '',
      category: 'other',
      note: '',
      checked: false,
      checkedAt: null,
      createdAt: now,
      updatedAt: now,
      ...i,
    }));
}

function loadHistory(): Record<string, HistoryRecord> {
  const raw = readJSON<Record<string, HistoryRecord>>(HISTORY_KEY, {});
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
}

interface ShoppingContextValue {
  items: ShoppingItem[];
  history: Record<string, HistoryRecord>;
  /** True if an unchecked item with this name is already on the list. */
  isOnList: (name: string) => boolean;
  /** Adds items, skipping names already on the list. Returns the ids actually added. */
  addItems: (inputs: ItemInput[]) => string[];
  updateItem: (id: string, patch: Partial<ItemInput>) => void;
  toggleItem: (id: string) => void;
  deleteItems: (ids: string[]) => void;
  restoreItems: (items: ShoppingItem[]) => void;
  /** Removes everything in the cart and records it in the purchase history. Returns what was removed. */
  finishTrip: () => ShoppingItem[];
  /** Undoes the history part of finishTrip. */
  forgetPurchases: (items: ShoppingItem[]) => void;
}

const ShoppingContext = createContext<ShoppingContextValue | null>(null);

export function ShoppingProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ShoppingItem[]>(loadItems);
  const [history, setHistory] = useState<Record<string, HistoryRecord>>(loadHistory);

  useEffect(() => writeJSON(ITEMS_KEY, items), [items]);
  useEffect(() => writeJSON(HISTORY_KEY, history), [history]);

  const isOnList = useCallback(
    (name: string) => items.some((i) => !i.checked && nameKey(i.name) === nameKey(name)),
    [items],
  );

  const addItems = useCallback(
    (inputs: ItemInput[]) => {
      const now = new Date().toISOString();
      const taken = new Set(items.filter((i) => !i.checked).map((i) => nameKey(i.name)));
      const fresh: ShoppingItem[] = [];
      for (const input of inputs) {
        const key = nameKey(input.name);
        if (!key || taken.has(key)) continue;
        taken.add(key);
        fresh.push({
          ...input,
          name: input.name.trim(),
          id: crypto.randomUUID(),
          checked: false,
          checkedAt: null,
          createdAt: now,
          updatedAt: now,
        });
      }
      if (fresh.length) setItems((prev) => [...prev, ...fresh]);
      return fresh.map((i) => i.id);
    },
    [items],
  );

  const updateItem = useCallback((id: string, patch: Partial<ItemInput>) => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: now } : i)));
  }, []);

  const toggleItem = useCallback((id: string) => {
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, checked: !i.checked, checkedAt: i.checked ? null : now, updatedAt: now } : i,
      ),
    );
  }, []);

  const deleteItems = useCallback((ids: string[]) => {
    const set = new Set(ids);
    setItems((prev) => prev.filter((i) => !set.has(i.id)));
  }, []);

  const restoreItems = useCallback((restored: ShoppingItem[]) => {
    setItems((prev) => {
      const ids = new Set(prev.map((i) => i.id));
      return [...prev, ...restored.filter((i) => !ids.has(i.id))];
    });
  }, []);

  const finishTrip = useCallback(() => {
    const bought = items.filter((i) => i.checked);
    if (!bought.length) return [];
    const now = new Date().toISOString();
    setItems((prev) => prev.filter((i) => !i.checked));
    setHistory((prev) => {
      const next = { ...prev };
      for (const i of bought) {
        const key = nameKey(i.name);
        next[key] = {
          name: i.name,
          category: i.category,
          quantity: i.quantity || undefined,
          count: (prev[key]?.count ?? 0) + 1,
          lastBought: now,
        };
      }
      return next;
    });
    return bought;
  }, [items]);

  const forgetPurchases = useCallback((bought: ShoppingItem[]) => {
    setHistory((prev) => {
      const next = { ...prev };
      for (const i of bought) {
        const key = nameKey(i.name);
        const rec = next[key];
        if (!rec) continue;
        if (rec.count <= 1) delete next[key];
        else next[key] = { ...rec, count: rec.count - 1 };
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ items, history, isOnList, addItems, updateItem, toggleItem, deleteItems, restoreItems, finishTrip, forgetPurchases }),
    [items, history, isOnList, addItems, updateItem, toggleItem, deleteItems, restoreItems, finishTrip, forgetPurchases],
  );

  return <ShoppingContext.Provider value={value}>{children}</ShoppingContext.Provider>;
}

export function useShopping(): ShoppingContextValue {
  const ctx = useContext(ShoppingContext);
  if (!ctx) throw new Error('useShopping must be used inside <ShoppingProvider>');
  return ctx;
}
