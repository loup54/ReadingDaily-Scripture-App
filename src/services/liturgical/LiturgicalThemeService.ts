/**
 * LiturgicalThemeService
 *
 * Determines the current liturgical season and how far through it we are,
 * so the UI can apply season-appropriate colours that intensify toward
 * each season's highpoint.
 *
 * Seasons and highpoints:
 *   Advent        → Christmas (Dec 25)
 *   Christmas     → Epiphany / Baptism of the Lord (flat — celebration sustained)
 *   Lent          → Holy Week / Easter Vigil
 *   Holy Week     → Easter Sunday (peak intensity)
 *   Easter        → Pentecost (flat — sustained joy, then ignites at Pentecost)
 *   Ordinary Time → No highpoint — deliberately flat and restful
 *   Pentecost     → single day, full intensity
 */

export type LiturgicalSeason =
  | 'advent'
  | 'christmas'
  | 'ordinary-time-early'
  | 'lent'
  | 'holy-week'
  | 'easter'
  | 'pentecost'
  | 'ordinary-time';

export interface LiturgicalMoment {
  season: LiturgicalSeason;
  /** 0.0 (start of season) → 1.0 (at the highpoint / end) */
  intensity: number;
  /** Human-readable label e.g. "Week 3 of Advent" */
  label: string;
}

// ─── Easter calculation (Computus algorithm) ───────────────────────────────

function easterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 1-based
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ─── Advent start: 4th Sunday before Christmas ─────────────────────────────

function adventStart(year: number): Date {
  const christmas = new Date(year, 11, 25);
  const dayOfWeek = christmas.getDay(); // 0 = Sunday
  // Days back to the Sunday on or before Nov 27 (earliest Advent start)
  const daysToSunday = (dayOfWeek === 0 ? 0 : dayOfWeek);
  const fourthSundayBefore = addDays(christmas, -(daysToSunday + 21));
  return startOfDay(fourthSundayBefore);
}

// ─── Main export ───────────────────────────────────────────────────────────

export function getLiturgicalMoment(date: Date = new Date()): LiturgicalMoment {
  const today = startOfDay(date);
  const year = today.getFullYear();

  const easter = startOfDay(easterDate(year));
  const ashWednesday = addDays(easter, -46);
  const palmSunday = addDays(easter, -7);
  const pentecost = addDays(easter, 49);
  const advent = adventStart(year);
  const christmas = new Date(year, 11, 25);
  const baptismOfTheLord = (() => {
    // Sunday after Jan 6 (Epiphany), or Jan 13 if Jan 6 is Sunday
    const epiphany = new Date(year, 0, 6);
    const dow = epiphany.getDay();
    return dow === 0 ? new Date(year, 0, 13) : addDays(epiphany, 7 - dow);
  })();

  const prevEaster = startOfDay(easterDate(year - 1));
  const prevPentecost = addDays(prevEaster, 49);
  const prevAdvent = adventStart(year - 1);
  const prevChristmas = new Date(year - 1, 11, 25);
  const prevBaptism = (() => {
    const epiphany = new Date(year, 0, 6);
    const dow = epiphany.getDay();
    return dow === 0 ? new Date(year, 0, 13) : addDays(epiphany, 7 - dow);
  })();

  // ── Advent (current year) ───────────────────────────────────────────────
  if (today >= advent && today < christmas) {
    const total = daysBetween(advent, christmas);
    const elapsed = daysBetween(advent, today);
    const intensity = clamp(elapsed / total, 0, 1);
    const weekNum = Math.floor(elapsed / 7) + 1;
    return { season: 'advent', intensity, label: `Week ${weekNum} of Advent` };
  }

  // ── Christmas (Dec 25 → Baptism of the Lord) ───────────────────────────
  if (today >= christmas || today <= baptismOfTheLord) {
    // Sustained celebration — flat intensity
    const elapsed = today >= christmas
      ? daysBetween(christmas, today)
      : daysBetween(prevChristmas, today);
    const dayNum = elapsed + 1;
    return { season: 'christmas', intensity: 0.8, label: `Day ${dayNum} of Christmas` };
  }

  // ── Lent ────────────────────────────────────────────────────────────────
  if (today >= ashWednesday && today < palmSunday) {
    const total = daysBetween(ashWednesday, palmSunday);
    const elapsed = daysBetween(ashWednesday, today);
    const intensity = clamp(elapsed / total, 0, 1);
    const weekNum = Math.floor(elapsed / 7) + 1;
    return { season: 'lent', intensity, label: `Week ${weekNum} of Lent` };
  }

  // ── Holy Week (Palm Sunday → Holy Saturday) ────────────────────────────
  if (today >= palmSunday && today < easter) {
    const total = daysBetween(palmSunday, easter);
    const elapsed = daysBetween(palmSunday, today);
    const intensity = clamp(0.7 + (elapsed / total) * 0.3, 0.7, 1); // already intense, deepens to 1
    const days = ['Palm Sunday', 'Monday of Holy Week', 'Tuesday of Holy Week',
      'Wednesday of Holy Week', 'Holy Thursday', 'Good Friday', 'Holy Saturday'];
    return { season: 'holy-week', intensity, label: days[elapsed] ?? 'Holy Week' };
  }

  // ── Pentecost Sunday ───────────────────────────────────────────────────
  if (daysBetween(today, pentecost) === 0) {
    return { season: 'pentecost', intensity: 1.0, label: 'Pentecost Sunday' };
  }

  // ── Easter (Easter Sunday → Pentecost) ────────────────────────────────
  if (today >= easter && today < pentecost) {
    const total = daysBetween(easter, pentecost);
    const elapsed = daysBetween(easter, today);
    const weekNum = Math.floor(elapsed / 7) + 1;
    // Sustained joy (0.8) that builds to full intensity in the final week
    const intensity = elapsed >= total - 7
      ? clamp(0.8 + ((elapsed - (total - 7)) / 7) * 0.2, 0.8, 1)
      : 0.8;
    return { season: 'easter', intensity, label: `Week ${weekNum} of Easter` };
  }

  // ── Ordinary Time ──────────────────────────────────────────────────────
  // Early Ordinary Time: Baptism of the Lord → Ash Wednesday
  if (today > baptismOfTheLord && today < ashWednesday) {
    const total = daysBetween(baptismOfTheLord, ashWednesday);
    const elapsed = daysBetween(baptismOfTheLord, today);
    const weekNum = Math.floor(elapsed / 7) + 1;
    return { season: 'ordinary-time-early', intensity: 0.5, label: `Week ${weekNum} in Ordinary Time` };
  }

  // Late Ordinary Time: Pentecost → Advent
  const total = daysBetween(pentecost, advent);
  const elapsed = daysBetween(pentecost, today);
  const weekNum = Math.floor(elapsed / 7) + 1;
  return { season: 'ordinary-time', intensity: 0.5, label: `Week ${weekNum} in Ordinary Time` };
}
