import type { SQLiteDatabase } from 'expo-sqlite';

// Ordered list of migrations. Each runs exactly once; the array index + 1 is
// the schema version tracked by SQLite's PRAGMA user_version.
//
// Every feature adds its own tables here (prefixed with the feature name) as a
// NEW entry appended to the end — never edit an existing migration, since it
// has already run on real devices. See docs/architecture.md.
const migrations: ((db: SQLiteDatabase) => void)[] = [
  // v1 — shopping list. All rows follow the sync-ready rules: UUID id,
  // created_at/updated_at, and a deleted_at soft-delete column.
  (db) => {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS shopping_items (
        id         TEXT PRIMARY KEY NOT NULL,
        name       TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_shopping_items_active
        ON shopping_items (deleted_at, created_at);
    `);
  },

  // v2 — mark items as bought. bought_at is a timestamp (null = not bought),
  // following the same nullable-timestamp shape as deleted_at so sync can
  // reason about it. Existing rows get NULL automatically.
  (db) => {
    db.execSync(`ALTER TABLE shopping_items ADD COLUMN bought_at TEXT`);
  },
];

// Applies any migrations the database hasn't seen yet, in order, inside a
// transaction, then advances user_version. Safe to call on every app start.
export function runMigrations(db: SQLiteDatabase): void {
  const { user_version: current } =
    db.getFirstSync<{ user_version: number }>('PRAGMA user_version') ?? {
      user_version: 0,
    };

  if (current >= migrations.length) return;

  db.withTransactionSync(() => {
    for (let version = current; version < migrations.length; version++) {
      migrations[version](db);
    }
    // PRAGMA doesn't accept bind params, and version is a number we control.
    db.execSync(`PRAGMA user_version = ${migrations.length}`);
  });
}
