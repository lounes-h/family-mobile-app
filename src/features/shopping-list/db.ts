import { getDatabase } from '@/shared/db';
import { id } from '@/shared/utils/id';
import { now } from '@/shared/utils/time';
import type { ShoppingItem } from './types';

// The only place shopping-list SQL lives. Store and components call these
// functions and never touch the database directly — so v2 (Supabase sync) can
// swap the insides here without changing anything above.
//
// Rows are never physically removed. "Active" means not deleted and not
// archived — every read and mutation filters
// `deleted_at IS NULL AND archived_at IS NULL`.

function db() {
  return getDatabase();
}

// Only active rows are eligible for reads and single-item mutations.
const ACTIVE = 'deleted_at IS NULL AND archived_at IS NULL';

// Active items. Unbought first (in original created_at order), then bought
// items at the bottom (in the order they were bought). This gives "mark bought
// → moves to the bottom" and "un-mark → returns to its original place" for free.
export function listItems(): ShoppingItem[] {
  return db().getAllSync<ShoppingItem>(
    `SELECT * FROM shopping_items
     WHERE ${ACTIVE}
     ORDER BY
       CASE WHEN bought_at IS NULL THEN 0 ELSE 1 END,
       CASE WHEN bought_at IS NULL THEN created_at ELSE bought_at END ASC`,
  );
}

// Insert a new item. Caller is responsible for trimming/validating the name;
// this asserts non-empty as a last line of defence.
export function insertItem(name: string): ShoppingItem {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Cannot insert an item with an empty name');

  const item: ShoppingItem = {
    id: id(),
    name: trimmed,
    created_at: now(),
    updated_at: now(),
    deleted_at: null,
    bought_at: null,
    archived_at: null,
  };

  db().runSync(
    `INSERT INTO shopping_items
       (id, name, created_at, updated_at, deleted_at, bought_at, archived_at)
     VALUES (?, ?, ?, ?, NULL, NULL, NULL)`,
    item.id,
    item.name,
    item.created_at,
    item.updated_at,
  );

  return item;
}

// Rename an item, bumping updated_at. Empty names are rejected.
export function renameItem(itemId: string, name: string): void {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Cannot rename an item to an empty name');

  db().runSync(
    `UPDATE shopping_items
     SET name = ?, updated_at = ?
     WHERE id = ? AND ${ACTIVE}`,
    trimmed,
    now(),
    itemId,
  );
}

// Mark an item bought (bought_at = now) or un-bought (bought_at = null).
export function setBought(itemId: string, bought: boolean): void {
  const ts = now();
  db().runSync(
    `UPDATE shopping_items
     SET bought_at = ?, updated_at = ?
     WHERE id = ? AND ${ACTIVE}`,
    bought ? ts : null,
    ts,
    itemId,
  );
}

// Soft-delete a single item.
export function softDeleteItem(itemId: string): void {
  const ts = now();
  db().runSync(
    `UPDATE shopping_items
     SET deleted_at = ?, updated_at = ?
     WHERE id = ? AND ${ACTIVE}`,
    ts,
    ts,
    itemId,
  );
}

// Soft-delete every active item (the "Clear" action).
export function softDeleteAll(): void {
  const ts = now();
  db().runSync(
    `UPDATE shopping_items
     SET deleted_at = ?, updated_at = ?
     WHERE ${ACTIVE}`,
    ts,
    ts,
  );
}

// Archive every active item (the "Done shopping" flow). Unlike delete, this
// PRESERVES the rows — they leave the active list but stay in the DB, ready for
// a future "archived lists" view.
export function archiveAll(): void {
  const ts = now();
  db().runSync(
    `UPDATE shopping_items
     SET archived_at = ?, updated_at = ?
     WHERE ${ACTIVE}`,
    ts,
    ts,
  );
}
