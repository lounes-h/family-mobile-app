# Architecture

## The app in one sentence

A React Native (Expo) mobile app for home life, built as a set of
independent features (shopping list, todos, reminders, cleaning,
money) that all sit on top of one shared foundation.

## The big picture

```
┌───────────────────────────────────────────────┐
│                  app/  (Expo Router)          │
│   screens + navigation. Thin. No logic here.  │
└───────────────┬───────────────────────────────┘
                │ renders
┌───────────────▼───────────────────────────────┐
│              src/features/                    │
│  ┌────────────┐ ┌───────┐ ┌───────────┐       │
│  │ shopping-  │ │ todos │ │ money     │  ...  │
│  │ list       │ │(later)│ │ (later)   │       │
│  └─────┬──────┘ └───┬───┘ └────┬──────┘       │
│        │  features NEVER import each other    │
└────────┼────────────┼──────────┼──────────────┘
         │            │          │
┌────────▼────────────▼──────────▼──────────────┐
│                src/shared/                    │
│   UI components · database · theme · utils    │
└───────────────────────────────────────────────┘
```

Arrows only point DOWN. Screens use features, features use shared,
shared uses nothing above it.

## Folder structure

```
household-app/
├── app/                        # Expo Router — file-based navigation
│   ├── _layout.tsx             # root layout (tabs later)
│   └── index.tsx               # home screen → shows shopping list for now
│
├── src/
│   ├── features/
│   │   └── shopping-list/
│   │       ├── components/     # UI pieces for this feature only
│   │       ├── store.ts        # feature state (Zustand)
│   │       ├── db.ts           # feature's own queries (uses shared/db)
│   │       ├── types.ts        # ShoppingItem, etc.
│   │       └── index.ts        # the ONLY file others may import from
│   │
│   └── shared/
│       ├── components/         # generic UI: Button, Input, EmptyState
│       ├── db/                 # SQLite setup, open/migrate helpers
│       ├── theme/              # colors, spacing, fonts
│       └── utils/              # small helpers (id(), dates, etc.)
│
├── docs/                       # you are here
├── CLAUDE.md
└── package.json
```

## The three rules

1. **Features are islands.** A feature folder never imports from
   another feature folder. If two features need the same thing, that
   thing moves to `src/shared/`.
2. **One public door per feature.** Other code (only the `app/`
   screens, really) imports from `src/features/<name>/index.ts` —
   never from files deep inside the feature.
3. **Screens are thin.** Files in `app/` only do navigation and
   compose feature components. All logic, state, and data code lives
   inside the feature.

These rules are what make "add todos later" a copy-the-recipe job
instead of a rewrite.

## Tech decisions

| Concern      | Choice                     | Why                                        |
|--------------|----------------------------|--------------------------------------------|
| Framework    | Expo (managed workflow)    | easiest React Native setup, OTA updates    |
| Navigation   | Expo Router                | file-based, tabs fit "one tab per feature" |
| Language     | TypeScript (strict)        | catches mistakes early                     |
| State        | Zustand (one store/feature)| tiny, simple, no boilerplate               |
| Storage (v1) | expo-sqlite (local only)   | real local database; app works offline     |
| Backend (v2) | Supabase (planned, NOT yet)| Postgres + realtime + auth; will power     |
|              |                            | shared lists between family members        |
| Styling      | StyleSheet + shared theme  | no extra dependency for now                |

Every feature gets its own tables, prefixed with the feature name:
`shopping_items`, later `todo_tasks`, `money_entries`, etc.
Migrations live in `src/shared/db/` and run at app start.

## Built for sharing later (sync-ready rules)

Sharing with family members arrives in v2. We do NOT build any backend,
login, or sync code in v1 — but every table and every line of data code
follows these rules from day one, so v2 is a plug-in, not a rewrite:

1. **UUIDs for all ids.** Never auto-increment integers. Two phones
   creating item #7 at the same time would collide; UUIDs never do.
2. **Every row has `created_at` and `updated_at`.** Sync engines need
   `updated_at` to answer "which change is newer?".
3. **Soft deletes.** Deleting sets `deleted_at` instead of removing the
   row. Queries filter `WHERE deleted_at IS NULL`. Without this, a
   deleted item on one phone would "come back" from another phone.
4. **All data access goes through the feature's `db.ts`.** Components
   and stores never touch SQL directly. In v2 we swap the inside of
   `db.ts` (local SQLite → local SQLite + Supabase sync) and nothing
   above it changes.

```
v1:  store.ts → db.ts → SQLite (on device)

v2:  store.ts → db.ts → SQLite (on device) ⇄ Supabase (cloud)
                  ▲
        same interface — only the inside of db.ts changes
```

## How data flows (example: adding a shopping item)

```
User taps "Add item"
   │
   ▼
component (features/shopping-list/components/AddItem.tsx)
   │  calls
   ▼
store action (features/shopping-list/store.ts)  → updates UI state
   │  calls
   ▼
db function (features/shopping-list/db.ts)      → INSERT INTO shopping_items
   │  uses
   ▼
shared SQLite helper (src/shared/db/)
```

The screen never talks to the database directly. It renders what the
store gives it.

## Navigation plan

- **Now:** one screen (`app/index.tsx`) that renders the shopping
  list feature.
- **Later:** switch `_layout.tsx` to a tab navigator — one tab per
  feature. Because screens are thin, this change touches `app/` only.

## Recipe: adding a new feature (do this when the roadmap says so)

1. Create `src/features/<name>/` with the same shape as
   shopping-list (components, store.ts, db.ts, types.ts, index.ts).
2. Add the feature's tables (prefixed `<name>_`) as a new migration
   in `src/shared/db/`.
3. Add a screen (or tab) in `app/` that renders the feature.
4. If the feature needs a component that already exists inside
   another feature — stop, move that component to `src/shared/`
   first, then use it from both.
5. Write/extend the feature's doc in `docs/features/<name>.md`
   before writing code.

## Version plan

- **v1 (now):** local-only. No backend, no accounts, no network code.
  Everything lives on the device — but shaped by the sync-ready rules
  above.
- **v2 (planned):** shared shopping lists between family members,
  powered by Supabase (auth + realtime sync). Added inside
  `src/shared/db/` and each feature's `db.ts`; UI and stores stay
  as they are.

## Out of scope (for now)

- No backend, accounts, or sync code yet — v1 must not include any
  Supabase packages or network calls, even "to prepare".
- No cross-feature logic (e.g., "shopping list creates a money
  entry"). When we want that later, it will go through shared,
  never feature-to-feature.
