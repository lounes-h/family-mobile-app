import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

// The one on-device database. Features never open their own connection — they
// call getDatabase() and run their queries through their feature db.ts.
//
// In v2 (Supabase sync) only the inside of this module and each feature's
// db.ts change; stores and components stay exactly as they are.

const DB_NAME = 'household.db';

let db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (db) return db;
  db = SQLite.openDatabaseSync(DB_NAME);
  // Foreign keys off by default in SQLite; turn on for future relational rules.
  db.execSync('PRAGMA foreign_keys = ON');
  runMigrations(db);
  return db;
}

export type { SQLiteDatabase } from 'expo-sqlite';
