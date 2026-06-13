import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Dead-simple file cache at ~/.surflow/cache. A personal tool refreshes a few
 * times a day across ~6 spots in one Open-Meteo grid cell, so this fully
 * replaces Redis. The interface is small enough to swap for a Redis impl later
 * (the deferred scale-up path).
 */
const CACHE_DIR = join(homedir(), '.surflow', 'cache');

export interface CacheEntry<T> {
  savedAt: number; // epoch ms
  data: T;
}

function keyToPath(key: string): string {
  const safe = key.replace(/[^a-z0-9._-]/gi, '_');
  return join(CACHE_DIR, `${safe}.json`);
}

export async function getCached<T>(key: string, ttlMs: number): Promise<T | null> {
  try {
    const raw = await fs.readFile(keyToPath(key), 'utf8');
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.savedAt > ttlMs) return null;
    return entry.data;
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, data: T): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const entry: CacheEntry<T> = { savedAt: Date.now(), data };
    await fs.writeFile(keyToPath(key), JSON.stringify(entry), 'utf8');
  } catch {
    // Cache is best-effort; never fail a plan because the disk write failed.
  }
}
