import {useSyncExternalStore} from 'react';
import type {OfflineTransactionItem} from './sa-data';

const STORAGE_KEY = 'varda_sa_offline_ledger_v1';

let memoryCache: OfflineTransactionItem[] | null = null;
let rawSavedString: string | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeLedger(callback: () => void): () => void {
  listeners.add(callback);
  if (typeof window === 'undefined') {
    return () => {
      listeners.delete(callback);
    };
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      memoryCache = null;
      rawSavedString = null;
      emitChange();
    }
  };

  window.addEventListener('storage', handleStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', handleStorage);
  };
}

export function getLedgerSnapshot(
  initialLedger: OfflineTransactionItem[]
): OfflineTransactionItem[] {
  if (typeof window === 'undefined') return initialLedger;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== rawSavedString) {
      rawSavedString = saved;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryCache = parsed;
          return memoryCache;
        }
      }
      memoryCache = initialLedger;
    }
    return memoryCache ?? initialLedger;
  } catch {
    return initialLedger;
  }
}

export function saveLedger(items: OfflineTransactionItem[]) {
  try {
    const serialized = JSON.stringify(items);
    localStorage.setItem(STORAGE_KEY, serialized);
    rawSavedString = serialized;
    memoryCache = items;
  } catch {
    memoryCache = items;
  }
  emitChange();
}

let isLedgerMounted = false;
const ledgerMountListeners = new Set<() => void>();

function subscribeLedgerMount(callback: () => void): () => void {
  ledgerMountListeners.add(callback);
  if (typeof window !== 'undefined' && !isLedgerMounted) {
    const timer = setTimeout(() => {
      isLedgerMounted = true;
      ledgerMountListeners.forEach((l) => l());
    }, 0);
    return () => {
      clearTimeout(timer);
      ledgerMountListeners.delete(callback);
    };
  }
  return () => {
    ledgerMountListeners.delete(callback);
  };
}

/**
 * Persistent offline ledger data.
 * Returns initialLedger during SSR and initial hydration to guarantee zero hydration mismatch,
 * then safely synchronizes with localStorage once mounted.
 */
export function useOfflineLedger(initialLedger: OfflineTransactionItem[]) {
  const mounted = useSyncExternalStore(
    subscribeLedgerMount,
    () => isLedgerMounted,
    () => false
  );

  const ledger = useSyncExternalStore(
    subscribeLedger,
    () => (mounted ? getLedgerSnapshot(initialLedger) : initialLedger),
    () => initialLedger
  );

  return [ledger, saveLedger] as const;
}
