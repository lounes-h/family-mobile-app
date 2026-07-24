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
   - After adding an item the input stays open (focused) so several items
     can be added in a row. It hides again — leaving just the "Add item"
     button — only when the keyboard is dismissed.

2. **Update an item**
   - Tapping an item's text makes it editable in place.
   - Confirming saves the new name. Saving an empty name is not allowed
     (keep the old name or cancel the edit).

3. **Mark an item bought**
   - Tapping the circle to the left of an item marks it as bought
     (filled circle + strikethrough). Tapping again un-marks it.
   - A bought item moves to the bottom of the list. Un-marking it returns
     it to its original place (unbought items keep their created order).
   - Bought items cannot be edited or deleted — only un-marked. Their name
     is plain text and the delete control is hidden.
   - When the LAST unbought item is marked bought (everything is checked
     off), a dialog titled "Done shopping?" appears:
     - **Yes** archives the list (the active list empties).
     - **Still shopping** un-marks the item that was just checked.
   - Stored as a `bought_at` timestamp (null = not bought), following the
     same sync-ready shape as `deleted_at`. Archiving sets a separate
     `archived_at` timestamp: archived rows are PRESERVED in the DB (not
     deleted), just excluded from the active list. A dedicated "archived
     lists" view that reads them back is future work.

4. **Delete an item**
   - Each item has a small delete control (an "x" or trash icon).
   - Deleting removes just that item. No confirmation dialog needed —
     keep it fast.

5. **Clear the whole list**
   - A "Clear" button is visible somewhere on the page (top of the list
     is fine).
   - Tapping it removes ALL items so the user can start a new list from
     scratch.
   - Show one simple confirmation ("Have you done shopping?") because this
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

## Future versions (not now — ideas for later)

These are NOT part of v1. Listed here so the direction is captured; do
not build them until the roadmap explicitly says so.

### Advanced shopping list

An optional "advanced" mode that adds two things to each item:

1. **Store** — the shop the item is for (e.g. "Costco", "Trader Joe's").
   Lets one list group items by where you're going, or be filtered to a
   single store while you're there.
2. **Quantity** — an amount plus a unit. Units cover both counts and
   weights/volumes: `count`, `lbs`, `oz`, `kg`, `g`, `L`, `ml`, etc.
   (e.g. "Bananas × 6", "Flour 2 lbs").

Sketch of the extra fields (still following the sync-ready rules — UUIDs,
`created_at`/`updated_at`, soft delete):

| Field       | Type            | Notes                                   |
|-------------|-----------------|-----------------------------------------|
| store       | string or null  | which shop; null = unassigned           |
| quantity    | number or null  | the amount; null = unspecified          |
| unit        | string or null  | `count` \| `lbs` \| `oz` \| `kg` \| …    |

Implementation notes for when this is picked up:

- Add the columns as a NEW migration in `src/shared/db/` — never edit the
  v1 migration, which has already run on devices.
- Keep the simple add flow the default; surface store/quantity behind an
  "advanced" toggle or an expanded item editor so the basic list stays
  fast to use.
- Stores could later graduate to their own table if they need reuse
  across items (a picklist of known stores) — decide when building.

### Archived lists (history + reuse)

Archiving a finished list already preserves its rows in the DB
(`archived_at` set, not deleted — see "Mark an item bought" above). Two
planned uses for that preserved data:

1. **History** — a screen that lists past shopping trips (grouped by the
   `archived_at` timestamp) so the user can look back at what they bought
   and when.
2. **Populate a new list** — let the user start a fresh list from an old
   one: "buy these again" copies the items of an archived trip into a new
   active list (new UUIDs, fresh `created_at`, `bought_at`/`archived_at`
   cleared). Handy for recurring/weekly shops.

Implementation notes for when this is picked up:

- The data is already there; this is mainly read paths + a "copy to new
  list" write. No schema change needed for a first cut, though grouping
  trips cleanly may later want an explicit `list_id` / `lists` table
  (each archive = one list) instead of grouping by `archived_at`.
- Reuse should INSERT new rows (never un-archive the originals), so
  history stays intact.
- All of it still goes through the feature's `db.ts` — no component or
  store reaches into SQL directly.
