"use strict";

/**
 * Build dashboard stats for a period.
 * ranges: today | 7d | 30d | all
 */
function aggregate(records, range = "30d", nowMs = Date.now()) {
  const filtered = filterByRange(records, range, nowMs);
  const totals = emptyTotals();
  const byDay = new Map();
  const byModel = new Map();

  for (const r of filtered) {
    addTo(totals, r);
    const day = dayKey(r.time);
    if (!byDay.has(day)) byDay.set(day, emptyTotals());
    addTo(byDay.get(day), r);

    // Group by raw model id so provider/model variants stay distinct
    const mk = r.model || r.modelDisplay || "unknown";
    if (!byModel.has(mk)) {
      byModel.set(mk, {
        model: r.model,
        modelDisplay: r.modelDisplay || r.model,
        modelResolved: r.modelResolved,
        priceId: r.priceId,
        costEstimated: r.costEstimated,
        ...emptyTotals(),
      });
    }
    const m = byModel.get(mk);
    addTo(m, r);
    if (r.costEstimated) m.costEstimated = true;
  }

  const totalInput = totals.inputOther + totals.inputCacheRead + totals.inputCacheCreation;
  const cacheHitRate = totalInput > 0 ? totals.inputCacheRead / totalInput : 0;

  const daily = [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, t]) => ({ date, ...t, cacheHitRate: hitRate(t) }));

  const models = [...byModel.values()]
    .map((m) => ({ ...m, cacheHitRate: hitRate(m) }))
    .sort((a, b) => b.totalTokens - a.totalTokens);

  // Keep a generous recent window for UI pagination/scroll (not just top 50).
  const RECENT_LIMIT = 500;
  const recent = filtered.slice(0, RECENT_LIMIT).map((r) => ({
    time: r.time,
    model: r.model,
    modelDisplay: r.modelDisplay,
    modelResolved: r.modelResolved,
    inputOther: r.inputOther,
    output: r.output,
    inputCacheRead: r.inputCacheRead,
    inputCacheCreation: r.inputCacheCreation,
    totalTokens:
      r.inputOther + r.output + r.inputCacheRead + r.inputCacheCreation,
    costUsd: r.costUsd,
    costEstimated: r.costEstimated,
    priceId: r.priceId,
    sessionHint: r.sessionHint,
    fromEnv: r.fromEnv,
  }));

  return {
    range,
    totals: {
      ...totals,
      cacheHitRate,
      totalTokens: totals.inputOther + totals.output + totals.inputCacheRead + totals.inputCacheCreation,
    },
    daily,
    models,
    recent,
    recentTotal: filtered.length,
    recentLimit: RECENT_LIMIT,
  };
}

function filterByRange(records, range, nowMs) {
  if (range === "all") return records;
  const start = rangeStart(range, nowMs);
  return records.filter((r) => r.time >= start);
}

function rangeStart(range, nowMs) {
  const d = new Date(nowMs);
  if (range === "today") {
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 0;
  return nowMs - days * 24 * 60 * 60 * 1000;
}

function emptyTotals() {
  return {
    requests: 0,
    inputOther: 0,
    output: 0,
    inputCacheRead: 0,
    inputCacheCreation: 0,
    costUsd: 0,
    totalTokens: 0,
  };
}

function addTo(t, r) {
  t.requests += 1;
  t.inputOther += r.inputOther;
  t.output += r.output;
  t.inputCacheRead += r.inputCacheRead;
  t.inputCacheCreation += r.inputCacheCreation;
  t.costUsd += r.costUsd || 0;
  t.totalTokens =
    t.inputOther + t.output + t.inputCacheRead + t.inputCacheCreation;
}

function hitRate(t) {
  const denom = t.inputOther + t.inputCacheRead + t.inputCacheCreation;
  return denom > 0 ? t.inputCacheRead / denom : 0;
}

function dayKey(ms) {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function summaryAllRanges(records, nowMs = Date.now()) {
  const ranges = ["today", "7d", "30d", "all"];
  const out = {};
  for (const r of ranges) {
    out[r] = aggregate(records, r, nowMs);
  }
  return out;
}

/**
 * GitHub-style contribution heatmap for the last `weeks` weeks (default 53).
 * Cells are local calendar days with totalTokens / cost / requests.
 */
function buildHeatmap(records, nowMs = Date.now(), weeks = 53) {
  const byDay = new Map();
  for (const r of records) {
    if (!r.time) continue;
    const key = dayKey(r.time);
    if (!byDay.has(key)) byDay.set(key, emptyTotals());
    addTo(byDay.get(key), r);
  }

  const end = new Date(nowMs);
  end.setHours(0, 0, 0, 0);
  // Align end to local week end (Saturday) so grid is complete
  // Columns = weeks, rows = Sun..Sat (0..6)
  const endDow = end.getDay(); // 0 Sun
  // start = end - (weeks*7 - 1) days, then snap start to Sunday of that week
  const start = new Date(end);
  start.setDate(start.getDate() - (weeks * 7 - 1));
  start.setDate(start.getDate() - start.getDay());

  const cells = [];
  const cursor = new Date(start);
  let maxTokens = 0;
  while (cursor.getTime() <= end.getTime() + 24 * 3600_000 - 1) {
    const key = dayKey(cursor.getTime());
    const t = byDay.get(key) || emptyTotals();
    const totalTokens =
      t.totalTokens ||
      t.inputOther + t.output + t.inputCacheRead + t.inputCacheCreation;
    if (totalTokens > maxTokens) maxTokens = totalTokens;
    cells.push({
      date: key,
      dow: cursor.getDay(),
      weekIndex: Math.floor((cursor.getTime() - start.getTime()) / (7 * 24 * 3600_000)),
      requests: t.requests || 0,
      totalTokens,
      costUsd: t.costUsd || 0,
      cacheHitRate: hitRate(t),
    });
    cursor.setDate(cursor.getDate() + 1);
    if (cells.length > weeks * 7 + 7) break;
  }

  // Intensity levels 0-4
  const levels = cells.map((c) => {
    if (!c.totalTokens || maxTokens <= 0) return { ...c, level: 0 };
    const ratio = c.totalTokens / maxTokens;
    let level = 1;
    if (ratio > 0.75) level = 4;
    else if (ratio > 0.5) level = 3;
    else if (ratio > 0.25) level = 2;
    else level = 1;
    return { ...c, level };
  });

  const monthLabels = [];
  let lastMonth = "";
  for (const c of levels) {
    const m = c.date.slice(0, 7);
    if (m !== lastMonth) {
      monthLabels.push({ weekIndex: c.weekIndex, label: c.date.slice(5, 7) });
      lastMonth = m;
    }
  }

  return {
    weeks,
    start: dayKey(start.getTime()),
    end: dayKey(end.getTime()),
    maxTokens,
    cells: levels,
    monthLabels,
  };
}

module.exports = {
  aggregate,
  filterByRange,
  summaryAllRanges,
  buildHeatmap,
  dayKey,
  rangeStart,
};
