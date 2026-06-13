#!/usr/bin/env tsx
/**
 * surf — thin CLI adapter over @surflow/surf-engine. No surf logic lives here;
 * it parses args, calls the engine, and prints. The future openclaw/WhatsApp
 * wrapper is the same shape: parse → planSessions/scoreWindow → format.
 */
import {
  planSessions,
  scoreWindow,
  getSpot,
  loadKnowledgeBase,
  formatPlan,
  formatWindow,
  calibrateSource,
  DEFAULT_SURFER,
  type NormalizedForecastHour,
  type TideSourceName,
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
  surf spots
  surf calibrate
`;

async function main(): Promise<void> {
  const cmd = process.argv[2];
  switch (cmd) {
    case 'plan': return cmdPlan();
    case 'check': return cmdCheck();
    case 'spots': return cmdSpots();
    case 'calibrate': return cmdCalibrate();
    default:
      process.stdout.write(USAGE);
  }
}

main().catch((err) => fail(String(err?.stack ?? err)));
