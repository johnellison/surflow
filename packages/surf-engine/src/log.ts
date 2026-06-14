import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Personal session log at ~/.surflow/sessions.json. Records what actually
 * happened so the knowledge base can be refined against reality — especially
 * Klotok's swell-dependent tide ceiling (exit felt fine vs sketchy vs dangerous).
 */
const DIR = join(homedir(), '.surflow');
const FILE = join(DIR, 'sessions.json');

export type ExitFeel = 'fine' | 'sketchy' | 'dangerous';

export interface SessionLog {
  loggedAt: string; // ISO
  date: string; // YYYY-MM-DD
  spot: string; // slug
  swellM?: number;
  tideM?: number;
  exitFeel?: ExitFeel;
  note?: string;
}

export async function readSessions(): Promise<SessionLog[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8')) as SessionLog[];
  } catch {
    return [];
  }
}

export async function logSession(entry: SessionLog): Promise<void> {
  const all = await readSessions();
  all.push(entry);
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(all, null, 2), 'utf8');
}
