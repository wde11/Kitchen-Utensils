import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import * as api from '@/lib/api';
import type { ImageChange, Utensil, UtensilInput } from '@/lib/api';

type Status = 'loading' | 'ready' | 'error';

type UtensilsContextValue = {
  utensils: Utensil[];
  status: Status;
  error: string | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
  create: (input: UtensilInput, image: ImageChange) => Promise<Utensil>;
  update: (id: number, input: UtensilInput, image: ImageChange) => Promise<Utensil>;
  remove: (id: number) => Promise<void>;
  /** Keeps the list in sync with a record fetched elsewhere (e.g. a deep-linked detail screen). */
  upsertLocal: (utensil: Utensil) => void;
};

const UtensilsContext = createContext<UtensilsContextValue | null>(null);

export function UtensilsProvider({ children }: { children: ReactNode }) {
  const [utensils, setUtensils] = useState<Utensil[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  function fetchList() {
    return api
      .listUtensils()
      .then((list) => {
        setUtensils(list);
        setError(null);
        setStatus('ready');
      })
      .catch((e: Error) => {
        setError(e.message);
        // A failed pull-to-refresh keeps showing the list we already have.
        setStatus((current) => (current === 'ready' ? current : 'error'));
      })
      .finally(() => setRefreshing(false));
  }

  useEffect(() => {
    fetchList();
  }, []);

  function refresh() {
    if (status === 'ready') setRefreshing(true);
    else setStatus('loading');
    return fetchList();
  }

  function upsertLocal(utensil: Utensil) {
    setUtensils((list) =>
      list.some((u) => u.id === utensil.id)
        ? list.map((u) => (u.id === utensil.id ? utensil : u))
        : [utensil, ...list],
    );
  }

  const value: UtensilsContextValue = {
    utensils,
    status,
    error,
    refreshing,
    refresh,
    async create(input, image) {
      const created = await api.createUtensil(input, image);
      setUtensils((list) => [created, ...list]);
      return created;
    },
    async update(id, input, image) {
      const updated = await api.updateUtensil(id, input, image);
      upsertLocal(updated);
      return updated;
    },
    async remove(id) {
      await api.deleteUtensil(id);
      setUtensils((list) => list.filter((u) => u.id !== id));
    },
    upsertLocal,
  };

  return <UtensilsContext value={value}>{children}</UtensilsContext>;
}

export function useUtensils() {
  const context = use(UtensilsContext);
  if (!context) {
    throw new Error('useUtensils must be used inside <UtensilsProvider>');
  }
  return context;
}
