'use client';

import { create } from 'zustand';

interface UnsavedChangesEntry {
  id: string;
  onDiscard?: () => void;
}

interface UnsavedChangesState {
  entries: Map<string, UnsavedChangesEntry>;
  showDialog: boolean;
  pendingNavigation: (() => void) | null;
}

interface UnsavedChangesActions {
  register: (id: string, onDiscard?: () => void) => void;
  unregister: (id: string) => void;
  openDialog: (navigate: () => void) => void;
  closeDialog: () => void;
  discardAndNavigate: () => void;
}

type UnsavedChangesStore = UnsavedChangesState & UnsavedChangesActions;

export const useUnsavedChangesStore = create<UnsavedChangesStore>(
  (set, get) => ({
    // State
    entries: new Map(),
    showDialog: false,
    pendingNavigation: null,

    // Actions
    register: (id, onDiscard) =>
      set((state) => {
        const newEntries = new Map(state.entries);
        newEntries.set(id, { id, onDiscard });
        return { entries: newEntries };
      }),

    unregister: (id) =>
      set((state) => {
        const newEntries = new Map(state.entries);
        newEntries.delete(id);
        return { entries: newEntries };
      }),

    openDialog: (navigate) =>
      set({ showDialog: true, pendingNavigation: navigate }),

    closeDialog: () => set({ showDialog: false, pendingNavigation: null }),

    discardAndNavigate: () => {
      const { entries, pendingNavigation } = get();

      // 全てのonDiscardを実行
      entries.forEach((entry) => entry.onDiscard?.());

      // エントリをクリア
      set({ entries: new Map(), showDialog: false, pendingNavigation: null });

      // ナビゲーション実行
      pendingNavigation?.();
    },
  }),
);

// セレクター
export const selectHasUnsavedChanges = (state: UnsavedChangesStore) =>
  state.entries.size > 0;
