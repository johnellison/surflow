#!/usr/bin/env tsx
/**
 * surf — thin CLI adapter over @surflow/surf-engine. No surf logic lives here;
 * it parses args, calls the engine, and prints. The future openclaw/WhatsApp
 * wrapper is the same shape: parse → planSessions/scoreWindow → format.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Load the nearest .env (walk up from cwd) so WORLDTIDE(S)_API_KEY etc. are picked up.
(function loadDotenv() {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const p = resolve(dir, '.env');
    if (existsSync(p)) {
      try {
        process.loadEnvFile(p);
      } catch {
        /* ignore malformed/empty .env */
      }
      return;
    }
    dir = resolve(dir, '..');
  }
})();

import {
  planSessions,
  scoreSpotDay,
  scoreWindow,
  getSpot,
  loadKnowledgeBase,
  formatPlan,
  formatWindow,
  formatTideDay,
  formatCompare,
  effectiveTideCeiling,
  logSession,
  readSessions,
  calibrateSource,
  DEFAULT_SURFER,
  type NormalizedForecastHour,
  type TideSourceName,
  type ExitFeel,
} from '@surflow/surf-engine';

function arg(flags: string[], fallback?: string): string | undefined {
  for (const f of flags) {
    const i = process.argv.indexOf(f);
    if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  }
  return fallback;
}
const has = (f: string) => process.argv.includes(f);

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function today(): string {
  // Local (Asia/Makassar) date — the spots' timezone.
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Makassar' }))
    .toISOString()
    .slice(0, 10);
}

async function cmdPlan(): Promise<void> {
  const from = arg(['--from']) ?? today();
  const days = Number(arg(['--days'], '7'));
  const to = arg(['--to']) ?? addDays(from, days - 1);
  const spotsArg = arg(['--spots']);
  const spots = spotsArg ? spotsArg.split(',').map((s) => s.trim()) : undefined;
  process.stderr.write(`Fetching forecast for East Bali ${from} → ${to}…\n`);
  const plan = await planSessions({ dateRange: { from, to }, spots });
  process.stdout.write(formatPlan(plan) + '\n');
}

async function cmdCheck(): Promise<void> {
  const slug = process.argv[3];
  const spot = slug ? getSpot(slug) : undefined;
  if (!spot) {
    fail(`Unknown spot "${slug}". Try: ${loadKnowledgeBase().map((s) => s.spotSlug).join(', ')}`);
    return;
  }
  const tideSource = (arg(['--tide-source']) as TideSourceName) ?? 'open-meteo';
  const hour: NormalizedForecastHour = {
    time: arg(['--time']) ?? `${today()}T07:00`,
    swellHeightM: Number(arg(['--swell'], '1.3')),
    swellPeriodS: Number(arg(['--period'], '12')),
    swellDirDeg: Number(arg(['--swelldir'], '200')),
    windKnots: Number(arg(['--wind'], '6')),
    windGustKnots: Number(arg(['--wind'], '6')) * 1.4,
    windDirDeg: Number(arg(['--winddir'], '300')),
    tideMeters: Number(arg(['--tide'], '1.5')),
    tideState: has('--falling') ? 'falling' : 'rising',
    tideSource,
    tideUncertaintyM: tideSource === 'worldtides' ? 0.05 : calibrateSource('open-meteo')!.rmseM,
    waterTempC: 28,
  };
  const w = scoreWindow(spot, hour, DEFAULT_SURFER);
  const title = spot.section ? `${spot.displayName} — ${spot.section}` : spot.displayName;
  process.stdout.write(`\n${title}  (${slug})\n${formatWindow(w)}\n`);
  if (w.safety.warnings.length) process.stdout.write(`⚠️  ${w.safety.warnings.join('\n⚠️  ')}\n`);
}

async function cmdTide(): Promise<void> {
  const slug = process.argv[3];
  const spot = slug ? getSpot(slug) : undefined;
  if (!spot) {
    fail(`Unknown spot "${slug}". Try: ${loadKnowledgeBase().map((s) => s.spotSlug).join(', ')}`);
    return;
  }
  const date = arg(['--date']) ?? today();
  const all = await scoreSpotDay(slug, date);
  const day = all.filter((w) => {
    const h = Number(w.time.slice(11, 13));
    return h >= 4 && h <= 19; // dawn..dusk window
  });
  process.stdout.write('\n' + formatTideDay(spot, day, date) + '\n');
}

async function cmdCompare(): Promise<void> {
  const a = process.argv[3];
  const b = process.argv[4];
  if (!getSpot(a) || !getSpot(b)) {
    fail(`Usage: surf compare <spot-a> <spot-b> [--date YYYY-MM-DD]\nSpots: ${loadKnowledgeBase().map((s) => s.spotSlug).join(', ')}`);
    return;
  }
  const date = arg(['--date']) ?? today();
  const plan = await planSessions({ dateRange: { from: date, to: date }, spots: [a, b] });
  const ranked = plan.byDay[0]?.ranked ?? [];
  const pa = ranked.find((s) => s.spotSlug === a)!;
  const pb = ranked.find((s) => s.spotSlug === b)!;
  process.stdout.write('\n' + formatCompare(pa, pb, date) + '\n');
}

async function cmdLog(): Promise<void> {
  const spot = process.argv[3];
  // No spot (or a flag) → list recent logs.
  if (!spot || spot.startsWith('--')) {
    const all = await readSessions();
    if (!all.length) {
      process.stdout.write('No sessions logged yet. Log one:\n  surf log <spot> --swell 1.7 --tide 2.0 --exit fine [--note "..."]\n');
      return;
    }
    for (const s of all.slice(-20)) {
      process.stdout.write(
        `${s.date}  ${s.spot.padEnd(16)} swell ${fmt(s.swellM)}m  tide ${fmt(s.tideM)}m  exit:${(s.exitFeel ?? '-').padEnd(9)} ${s.note ?? ''}\n`,
      );
    }
    return;
  }
  if (!getSpot(spot)) {
    fail(`Unknown spot "${spot}". Try: ${loadKnowledgeBase().map((s) => s.spotSlug).join(', ')}`);
    return;
  }
  const exit = arg(['--exit']) as ExitFeel | undefined;
  if (exit && !['fine', 'sketchy', 'dangerous'].includes(exit)) {
    fail(`--exit must be one of: fine, sketchy, dangerous`);
    return;
  }
  const entry = {
    loggedAt: new Date().toISOString(),
    date: arg(['--date']) ?? today(),
    spot,
    swellM: arg(['--swell']) !== undefined ? Number(arg(['--swell'])) : undefined,
    tideM: arg(['--tide']) !== undefined ? Number(arg(['--tide'])) : undefined,
    exitFeel: exit,
    note: arg(['--note']),
  };
  await logSession(entry);
  process.stdout.write(
    `✓ Logged ${entry.date} ${spot}: swell ${fmt(entry.swellM)}m, tide ${fmt(entry.tideM)}m, exit ${entry.exitFeel ?? '-'}\n`,
  );
  // If this is a ceiling-relevant Klotok exit, show how it sits vs the current model.
  const rules = getSpot(spot)!;
  if (entry.exitFeel && entry.tideM !== undefined && entry.swellM !== undefined) {
    const ceil = effectiveTideCeiling(rules, entry.swellM);
    if (ceil !== undefined) {
      const verb = entry.tideM > ceil ? 'above' : 'below';
      process.stdout.write(
        `  model ceiling at ${entry.swellM}m swell ≈ ${ceil.toFixed(1)}m — you exited ${verb} it at ${entry.tideM}m feeling "${entry.exitFeel}".\n`,
      );
      if ((entry.exitFeel === 'fine' && entry.tideM > ceil) || (entry.exitFeel === 'dangerous' && entry.tideM < ceil)) {
        process.stdout.write(`  ⚑ This disagrees with the model — worth recalibrating the ceiling.\n`);
      }
    }
  }
}

function fmt(n?: number): string {
  return n === undefined ? '?' : String(n);
}

function cmdSpots(): void {
  for (const s of loadKnowledgeBase()) {
    const t = s.section ? `${s.displayName} — ${s.section}` : s.displayName;
    process.stdout.write(
      `${s.spotSlug.padEnd(18)} ${t.padEnd(24)} ${s.breakType}/${s.bottomType}  ` +
        `tide≥${s.tide.minMeters}m (${s.tide.optimalBand.join('–')}m ${s.tide.directionPref})  min:${s.minSkill}\n`,
    );
  }
}

function cmdCalibrate(): void {
  for (const src of ['open-meteo', 'worldtides'] as TideSourceName[]) {
    const fit = calibrateSource(src);
    if (!fit) {
      process.stdout.write(`${src.padEnd(12)} — no samples yet\n`);
      continue;
    }
    process.stdout.write(
      `${src.padEnd(12)} a=${fit.a.toFixed(3)} b=${fit.b.toFixed(3)} rmse=${fit.rmseM.toFixed(3)}m max=${fit.maxResidualM.toFixed(3)}m (n=${fit.n})\n`,
    );
  }
}

function fail(msg: string): void {
  process.stderr.write(`${msg}\n`);
  process.exitCode = 1;
}

const USAGE = `surf — East Bali session planner

  surf plan [--days 7] [--from YYYY-MM-DD] [--to YYYY-MM-DD] [--spots a,b,c]
  surf check <spot-slug> --tide 1.3 [--rising|--falling] --swell 1.3 --period 6 [--wind 8 --winddir 300]
  surf compare <spot-a> <spot-b> [--date YYYY-MM-DD]
  surf tide <spot-slug> [--date YYYY-MM-DD]
  surf log [<spot-slug> --swell 1.7 --tide 2.0 --exit fine|sketchy|dangerous [--note "..."]]
  surf spots
  surf calibrate
`;

async function main(): Promise<void> {
  const cmd = process.argv[2];
  switch (cmd) {
    case 'plan': return cmdPlan();
    case 'check': return cmdCheck();
    case 'compare': return cmdCompare();
    case 'tide': return cmdTide();
    case 'log': return cmdLog();
    case 'spots': return cmdSpots();
    case 'calibrate': return cmdCalibrate();
    default:
      process.stdout.write(USAGE);
  }
}

main().catch((err) => fail(String(err?.stack ?? err)));
