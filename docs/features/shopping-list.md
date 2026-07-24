# Feature: Shopping List

## Goal

A simple, straightforward shopping list. No accounts, no categories, no
extras. Add items, check them off mentally, clear the list, start again.

## What the user can do

1. **Add an item**
   - An "Add item" button sits fixed at the bottom of the app.
   - Tapping it reveals a text input (focused, keyboard open on mobile).
   - Typing a name and confirming (Enter or a confirm button) adds the
     item to the list.
   - Empty or whitespace-only input is ignored (nothing is added).
   - After adding, the input stays open so the user can add several
     items in a row.

2. **Update an item**
   - Tapping an item's text makes it editable in place.
   - Confirming saves the new name. Saving an empty name is not allowed
     (keep the old name or cancel the edit).

3. **Delete an item**
   - Each item has a small delete control (an "x" or trash icon).
   - Deleting removes just that item. No confirmation dialog needed —
     keep it fast.

4. **Clear the whole list**
   - A "Clear" button is visible somewhere on the page (top of the list
     is fine).
   - Tapping it removes ALL items so the user can start a new list from
     scratch.
   - Show one simple confirmation ("Clear the whole list?") because this
     deletes everything.
   - The button is hidden or disabled when the list is empty.

## Empty state

- When there are no items, show the text: **"tap to add item"** in the
  middle of the page.
- Tapping this text does the same thing as the "Add item" button
  (opens the input).

## Data shape

A shopping item has (follows the sync-ready rules in
docs/architecture.md — sharing arrives in v2):

| Field       | Type          | Notes                                |
|-------------|---------------|--------------------------------------|
| id          | string (UUID) | generated on the device              |
| name        | string        | required, trimmed, non-empty         |
| created_at  | date          | for sorting (oldest first)           |
| updated_at  | date          | set on every change                  |
| deleted_at  | date or null  | soft delete; null = active           |

- "Delete" and "Clear" set `deleted_at` — rows are never removed.
- All reads filter `WHERE deleted_at IS NULL`, so the UI behaves
  exactly as if items were truly deleted.

Table/store name: `shopping_items` (follows the feature-prefix
convention in docs/conventions.md).

## UI layout (top to bottom)

```
┌─────────────────────────────┐
│  Shopping List      [Clear] │  ← header with Clear button
├─────────────────────────────┤
│  ○ Milk                  x  │
│  ○ Eggs                  x  │  ← list of items
│  ○ Bread                 x  │
│                             │
│      (if empty:             │
│      "tap to add item")     │
│                             │
├─────────────────────────────┤
│        [ + Add item ]       │  ← fixed at the bottom
└─────────────────────────────┘
```

## Out of scope for v1

Do NOT build these yet, even if they seem easy or useful:

- Checking items off / marking as bought
- Quantities, prices, or units
- Categories or sorting options
- Sharing lists or multiple lists (sharing is planned for v2 — the
  data shape above is already ready for it, but build ZERO sync,
  backend, or login code in v1)
- Undo after clear

## Where the code lives

- All code goes in `src/features/shopping-list/`.
- Only import from `src/shared/` — never from other features.
  (See docs/architecture.md.)

## Done means

- [ ] Can add an item from the bottom button
- [ ] Can edit an item's name in place
- [ ] Can delete a single item
- [ ] Clear button empties the whole list (with confirmation)
- [ ] Empty list shows "tap to add item" and it opens the input
- [ ] Items persist after a page refresh
