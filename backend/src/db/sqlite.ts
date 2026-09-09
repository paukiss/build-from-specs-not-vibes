import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function openDb(path = './data/dev.sqlite') {
  const db = await open({
    filename: path,
    driver: sqlite3.Database,
  });
  return db;
}
