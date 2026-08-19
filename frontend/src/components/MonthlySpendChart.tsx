import { useMemo, useState } from 'react';
import { fmt$ } from '../api/client';
import type { LogEntry } from '../api/client';

/** Don't bother drawing a trend for a provider used once or twice. */
const MIN_MONTHS_WITH_DATA = 3;
/** Above this many bars the per-bar value labels stop fitting. */
const MAX_LABELLED_BARS = 14;

type Bucket = {
  key: string;
  cost: number | null;
  usage: number | null;
};

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** usage_unit is free text — 'kWh' and 'kwh' are the same unit. */
const normUnit = (u: string) => u.trim().toLowerCase();

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

/** Bucket log entries into consecutive calendar months, gap-filling months with no
 *  entries so an irregular provider isn't drawn as if its visits were adjacent. */
function bucketByMonth(entries: LogEntry[], unitKey: string | null, months: number): Bucket[] {
  const totals = new Map<string, Bucket>();
  for (const e of entries) {
    if (!e.entry_date) continue;
    const key = e.entry_date.slice(0, 7);
    const b = totals.get(key) ?? { key, cost: null, usage: null };
    if (e.amount != null) b.cost = (b.cost ?? 0) + e.amount;
    if (e.usage_value != null && e.usage_unit && normUnit(e.usage_unit) === unitKey) {
      b.usage = (b.usage ?? 0) + e.usage_value;
    }
    totals.set(key, b);
  }

  const keys = [...totals.keys()].sort();
  if (keys.length === 0) return [];

  // Anchor the window on the latest month with data, not today — trailing empty
  // months just eat width. Clamp the start so short histories don't get padded either.
  const [ey, em] = keys[keys.length - 1].split('-').map(Number);
  const out: Bucket[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const key = monthKey(new Date(ey, em - 1 - i, 1));
    if (key < keys[0]) continue;
    out.push(totals.get(key) ?? { key, cost: null, usage: null });
  }
  return out;
}

export default function MonthlySpendChart({ entries }: { entries: LogEntry[] }) {
  const [months, setMonths] = useState(12);
  const [metric, setMetric] = useState<'cost' | 'usage'>('cost');

  // A provider's entries should share a unit, but chart only the dominant one if not.
  // Group case-insensitively and display whichever spelling is most common.
  const unit = useMemo(() => {
    const groups = new Map<string, { count: number; spellings: Map<string, number> }>();
    for (const e of entries) {
      if (e.usage_value == null || !e.usage_unit) continue;
      const key = normUnit(e.usage_unit);
      const g = groups.get(key) ?? { count: 0, spellings: new Map<string, number>() };
      g.count += 1;
      g.spellings.set(e.usage_unit, (g.spellings.get(e.usage_unit) ?? 0) + 1);
      groups.set(key, g);
    }
    const top = [...groups.entries()].sort((a, b) => b[1].count - a[1].count)[0];
    if (!top) return null;
    const label = [...top[1].spellings.entries()].sort((a, b) => b[1] - a[1])[0][0];
    return { key: top[0], label };
  }, [entries]);

  const buckets = useMemo(() => bucketByMonth(entries, unit?.key ?? null, months), [entries, unit, months]);

  const withCost = buckets.filter(b => b.cost != null);
  const withUsage = buckets.filter(b => b.usage != null);
  const hasUsage = unit != null && withUsage.length >= 2;
  const showing = metric === 'usage' && hasUsage ? 'usage' : 'cost';

  if (withCost.length < MIN_MONTHS_WITH_DATA) return null;

  const value = (b: Bucket) => (showing === 'usage' ? b.usage : b.cost);
  /** Bare number for the cramped label above each bar. */
  const fmtShort = (n: number) =>
    showing === 'usage' ? n.toLocaleString('en-US', { maximumFractionDigits: 0 }) : fmt$(n, 0);
  /** Full value with its unit, for tooltips and the average. */
  const fmtFull = (n: number, decimals = 2) =>
    showing === 'usage'
      ? `${n.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${unit?.label ?? ''}`
      : fmt$(n, decimals);

  const present = showing === 'usage' ? withUsage : withCost;
  const max = Math.max(...present.map(b => value(b) ?? 0), 1);
  const avg = present.reduce((s, b) => s + (value(b) ?? 0), 0) / present.length;
  const showLabels = buckets.length <= MAX_LABELLED_BARS;
  const barCls = showing === 'usage' ? 'bg-sage-600 hover:bg-sage-700' : 'bg-accent-600 hover:bg-accent-700';
  const toggleCls = (on: boolean) =>
    `px-2.5 py-1 rounded-md transition-colors ${on ? 'bg-warm-200 text-warm-800 font-medium' : 'text-warm-500 hover:text-warm-700'}`;

  return (
    <div className="bg-white rounded-xl border border-warm-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-1 gap-4">
        <h2 className="font-heading text-lg text-warm-800">
          {showing === 'usage' ? 'Monthly Usage' : 'Monthly Spend'}
        </h2>
        <div className="flex items-center gap-3 text-xs">
          {hasUsage && (
            <div className="flex items-center gap-0.5">
              <button onClick={() => setMetric('cost')} className={toggleCls(showing === 'cost')}>Cost</button>
              <button onClick={() => setMetric('usage')} className={toggleCls(showing === 'usage')}>Usage</button>
            </div>
          )}
          <div className="flex items-center gap-0.5">
            <button onClick={() => setMonths(12)} className={toggleCls(months === 12)}>12m</button>
            <button onClick={() => setMonths(24)} className={toggleCls(months === 24)}>24m</button>
          </div>
        </div>
      </div>
      <p className="text-sm text-warm-500 mb-4">
        avg <span className="font-semibold text-warm-700">{fmtFull(avg)}</span> / month
        {present.length < buckets.length && ` over ${present.length} of ${buckets.length} months`}
      </p>

      <div className="flex items-end gap-1" style={{ height: '176px' }}>
        {buckets.map(b => {
          const v = value(b);
          return (
            <div key={b.key} className="flex-1 flex flex-col items-center h-full">
              {/* Fixed-height label row so every column reserves the same space and
                  a full-height bar can't overflow the chart. */}
              {showLabels && (
                <div className="h-4 leading-4 text-[10px] text-warm-600 whitespace-nowrap">
                  {v == null ? '' : fmtShort(v)}
                </div>
              )}
              <div className="w-full flex-1 min-h-0 flex items-end">
                {v == null ? (
                  <div className="w-full h-0.5 bg-warm-200 rounded-full" title={`${monthLabel(b.key)} — no data`} />
                ) : (
                  <div
                    className={`w-full ${barCls} transition-colors rounded-t-md min-h-[2px]`}
                    style={{ height: `${(v / max) * 100}%` }}
                    title={`${monthLabel(b.key)} — ${fmtFull(v)}`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-1.5">
        {buckets.map((b, i) => (
          <div key={b.key} className="flex-1 text-center text-[10px] text-warm-400 truncate">
            {showLabels || i % 2 === 0 ? monthLabel(b.key) : ''}
          </div>
        ))}
      </div>
    </div>
  );
}
