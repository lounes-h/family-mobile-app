/**
 * @jest-environment node
 *
 * Integration tests for the shopping-list data layer.
 *
 * expo-sqlite is replaced with a better-sqlite3 (real, in-memory SQLite) engine
 * exposing the same sync API, so these tests run the ACTUAL migrations and SQL
 * — including the bought-to-bottom ordering and soft-delete filtering.
 */
// Replace expo-sqlite with an in-memory better-sqlite3 exposing the same sync
// API. Self-contained so the hoisted factory references no outer variables.
jest.mock('expo-sqlite', () => {
  const BetterSqlite3 = require('better-sqlite3');
  const makeAdapter = (sqlite: any) => ({
    execSync: (sql: string) => sqlite.exec(sql),
    runSync: (sql: string, ...params: unknown[]) =>
      sqlite.prepare(sql).run(...params),
    getAllSync: (sql: string, ...params: unknown[]) =>
      sqlite.prepare(sql).all(...params),
    getFirstSync: (sql: string, ...params: unknown[]) =>
      sqlite.prepare(sql).get(...params) ?? null,
    withTransactionSync: (fn: () => void) => sqlite.transaction(fn)(),
  });
  return { openDatabaseSync: () => makeAdapter(new BetterSqlite3(':memory:')) };
});

// Deterministic, strictly-increasing timestamps so created_at / bought_at
// ordering is stable across inserts.
jest.mock('@/shared/utils/time', () => {
  let n = 0;
  return { now: () => new Date(1_700_000_000_000 + n++ * 1000).toISOString() };
});

// Imported after the mocks above are registered.
import {
  archiveAll,
  insertItem,
  listItems,
  renameItem,
  setBought,
  softDeleteAll,
  softDeleteItem,
} from '../db';
import { getDatabase } from '@/shared/db';

// Count of ALL rows physically present (regardless of deleted/archived state).
const totalRows = () =>
  getDatabase().getFirstSync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM shopping_items',
  )?.n ?? 0;

afterEach(() => {
  // Hard-delete everything between tests (the singleton DB is shared).
  getDatabase().runSync('DELETE FROM shopping_items');
});

const names = () => listItems().map((i) => i.name);

describe('shopping-list db', () => {
  it('runs migrations to the latest version with bought/archived columns', () => {
    const version = getDatabase().getFirstSync<{ user_version: number }>(
      'PRAGMA user_version',
    );
    expect(version?.user_version).toBe(3);

    const item = insertItem('Milk');
    expect(item.bought_at).toBeNull();
    expect(item.archived_at).toBeNull();
    const listed = listItems()[0];
    expect(listed).toHaveProperty('bought_at', null);
    expect(listed).toHaveProperty('archived_at', null);
  });

  it('inserts items and lists them oldest-first', () => {
    insertItem('Milk');
    insertItem('Eggs');
    insertItem('Bread');
    expect(names()).toEqual(['Milk', 'Eggs', 'Bread']);
  });

  it('trims names and rejects empty inserts', () => {
    const item = insertItem('  Cheese  ');
    expect(item.name).toBe('Cheese');
    expect(() => insertItem('   ')).toThrow();
  });

  it('renames an item and rejects an empty rename', () => {
    const item = insertItem('Milk');
    renameItem(item.id, 'Oat milk');
    expect(names()).toEqual(['Oat milk']);
    expect(() => renameItem(item.id, '  ')).toThrow();
  });

  it('soft-deletes a single item, leaving the rest', () => {
    const milk = insertItem('Milk');
    insertItem('Eggs');
    softDeleteItem(milk.id);
    expect(names()).toEqual(['Eggs']);
  });

  it('soft-deletes all items on clear/archive', () => {
    insertItem('Milk');
    insertItem('Eggs');
    softDeleteAll();
    expect(listItems()).toEqual([]);
  });

  it('moves a bought item to the bottom and back on un-mark', () => {
    const milk = insertItem('Milk');
    insertItem('Eggs');
    insertItem('Bread');

    setBought(milk.id, true);
    // Milk drops below the still-unbought items.
    expect(names()).toEqual(['Eggs', 'Bread', 'Milk']);

    setBought(milk.id, false);
    // Un-marking returns Milk to its original (created_at) position.
    expect(names()).toEqual(['Milk', 'Eggs', 'Bread']);
  });

  it('orders multiple bought items by when they were bought', () => {
    const milk = insertItem('Milk');
    const eggs = insertItem('Eggs');
    const bread = insertItem('Bread');

    setBought(bread.id, true); // bought first
    setBought(milk.id, true); // bought second
    // Unbought (Eggs) first; bought section in the order they were bought.
    expect(names()).toEqual(['Eggs', 'Bread', 'Milk']);
    void eggs;
  });

  it('excludes soft-deleted items even when bought', () => {
    const milk = insertItem('Milk');
    setBought(milk.id, true);
    softDeleteItem(milk.id);
    expect(listItems()).toEqual([]);
  });

  it('archiveAll() empties the active list but preserves the rows', () => {
    insertItem('Milk');
    insertItem('Eggs');

    archiveAll();

    // Gone from the active list...
    expect(listItems()).toEqual([]);
    // ...but still in the database, marked archived (not deleted).
    expect(totalRows()).toBe(2);
    const rows = getDatabase().getAllSync<{
      archived_at: string | null;
      deleted_at: string | null;
    }>('SELECT archived_at, deleted_at FROM shopping_items');
    expect(rows.every((r) => r.archived_at !== null)).toBe(true);
    expect(rows.every((r) => r.deleted_at === null)).toBe(true);
  });

  it('archiveAll() leaves already-archived rows untouched', () => {
    insertItem('Milk');
    archiveAll();
    // A second archive with a fresh item only touches the still-active one.
    insertItem('Eggs');
    archiveAll();
    expect(listItems()).toEqual([]);
    expect(totalRows()).toBe(2);
  });
});
