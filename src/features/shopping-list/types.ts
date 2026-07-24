// Shape of a shopping item. Mirrors the shopping_items table and follows the
// sync-ready rules in docs/architecture.md (UUID id, timestamps, soft delete).
export type ShoppingItem = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  bought_at: string | null; // null = not yet bought
};
