import { execFile } from 'node:child_process';

/**
 * Minimal resilient JSON fetch: timeout + exponential-backoff retry.
 * Reuses the /external-api skill's pattern (timeout, 3 retries, 1/2/4s backoff)
 * without the Redis/Drizzle/cron weight — this is a personal tool.
 *
 * Falls back to the system `curl` when `fetch` cannot establish a connection
 * (some sandboxed/proxied environments allow curl egress but block undici).
 */
export interface FetchOpts {
  timeoutMs?: number;
  retries?: number;
}

export async function fetchJson<T = unknown>(url: string, opts: FetchOpts = {}): Promise<T> {
  const { timeoutMs = 10_000, retries = 3 } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchOnce<T>(url, timeoutMs);
    } catch (err) {
      lastErr = err;
      if (isConnectError(err)) {
        try {
          return await curlJson<T>(url, timeoutMs);
        } catch (curlErr) {
          lastErr = curlErr;
        }
      }
      if (attempt < retries) await sleep(1000 * 2 ** attempt);
    }
  }
  throw new Error(`fetchJson failed after ${retries + 1} attempts: ${String(lastErr)}`);
}

async function fetchOnce<T>(url: string, timeoutMs: number): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return (await res.json()) as T;
}

function isConnectError(err: unknown): boolean {
  const code = (err as { cause?: { code?: string }; code?: string })?.cause?.code ?? (err as { code?: string })?.code;
  const name = (err as { name?: string })?.name;
  return (
    code === 'UND_ERR_CONNECT_TIMEOUT' ||
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'EAI_AGAIN' ||
    name === 'TimeoutError' ||
    /fetch failed/i.test(String((err as Error)?.message))
  );
}

function curlJson<T>(url: string, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    execFile(
      'curl',
      ['-s', '--fail', '--max-time', String(Math.ceil(timeoutMs / 1000) + 5), url],
      { maxBuffer: 32 * 1024 * 1024 },
      (err, stdout) => {
        if (err) return reject(err);
        try {
          resolve(JSON.parse(stdout) as T);
        } catch (parseErr) {
          reject(parseErr);
        }
      },
    );
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
