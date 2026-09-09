import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from '../config/index';

let db: any;

export async function configureDatabase(): Promise<any> {
  const dbPath = config.databasePath;
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  return db;
}

export async function runMigrations(): Promise<void> {
  const migrationPath = path.join(__dirname, 'migrations', '001_init.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  db.exec(sql);
}

export function getDatabase(): any {
  return db;
}

export async function runAsync(sql: string, params: any[] = []): Promise<{ id?: string; changes?: number }> {
  const stmt = db.prepare(sql);
  const info = stmt.run(...params) as any;
  return { id: info.lastInsertRowid as string, changes: info.changes };
}

export async function getAsync(sql: string, params: any[] = []): Promise<any> {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
}

export async function allAsync(sql: string, params: any[] = []): Promise<any[]> {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}
