import { getDatabase } from '@/shared/db';
import { id } from '@/shared/utils/id';
import { now } from '@/shared/utils/time';
import type { ShoppingItem } from './types';

// The only place shopping-list SQL lives. Store and components call these
// functions and never touch the database directly — so v2 (Supabase sync) can
// swap the insides here without changing anything above.
//
// Every write is a soft delete or an update to updated_at; rows are never
// removed. Every read filters WHERE deleted_at IS NULL, so the UI behaves as
// if deleted items are gone.

function db() {
  return getDatabase();
}

// Active items, oldest first (created_at sort).
export function listItems(): ShoppingItem[] {
  return db().getAllSync<ShoppingItem>(
    `SELECT * FROM shopping_items
     WHERE deleted_at IS NULL
     ORDER BY created_at ASC`,
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
  };

  db().runSync(
    `INSERT INTO shopping_items (id, name, created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, NULL)`,
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
     WHERE id = ? AND deleted_at IS NULL`,
    trimmed,
    now(),
    itemId,
  );
}

// Soft-delete a single item.
export function softDeleteItem(itemId: string): void {
  const ts = now();
  db().runSync(
    `UPDATE shopping_items
     SET deleted_at = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
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
     WHERE deleted_at IS NULL`,
    ts,
    ts,
  );
}
