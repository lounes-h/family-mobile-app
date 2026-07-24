import { create } from 'zustand';
import * as db from './db';
import type { ShoppingItem } from './types';

// UI state for the shopping list. Actions call db.ts, then re-read the active
// rows so state always mirrors what's persisted. The list is small enough that
// re-reading after each change is simpler and safer than patching in place.

type ShoppingListState = {
  items: ShoppingItem[];
  loaded: boolean;
  // Id of the most recently added item, so the screen can scroll it into view
  // (a fresh item can otherwise land behind the keyboard). null until an add.
  lastAddedId: string | null;
  load: () => void;
  addItem: (name: string) => void;
  renameItem: (id: string, name: string) => void;
  toggleBought: (id: string) => void;
  deleteItem: (id: string) => void;
  archive: () => void;
  clear: () => void;
};

export const useShoppingList = create<ShoppingListState>((set, get) => {
  const refresh = () => set({ items: db.listItems(), loaded: true });

  return {
    items: [],
    loaded: false,
    lastAddedId: null,

    load: () => refresh(),

    addItem: (name) => {
      if (!name.trim()) return; // ignore empty / whitespace-only
      const item = db.insertItem(name);
      set({ items: db.listItems(), loaded: true, lastAddedId: item.id });
    },

    renameItem: (id, name) => {
      if (!name.trim()) return; // empty rename is a no-op (keeps old name)
      db.renameItem(id, name);
      refresh();
    },

    toggleBought: (id) => {
      const item = get().items.find((i) => i.id === id);
      if (!item) return;
      db.setBought(id, item.bought_at === null);
      refresh();
    },

    deleteItem: (id) => {
      db.softDeleteItem(id);
      refresh();
    },

    // Archive the finished list. Unlike clear, archived rows are preserved in
    // the DB (archived_at set, not deleted_at) — the active view empties but
    // the completed trip is kept for a future "archived lists" view.
    archive: () => {
      db.archiveAll();
      refresh();
    },

    clear: () => {
      db.softDeleteAll();
      refresh();
    },
  };
});
