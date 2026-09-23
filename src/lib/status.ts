export type Status = "Upcoming" | "Current" | "Completed";

export interface YearMonth {
  year: number;
  /** 1-12. */
  month: number;
}

export interface Dated {
  start?: YearMonth;
  /** null means the role is ongoing. */
  end?: YearMonth | null;
}

/** Last instant of a month, so an end month counts as worked through its end. */
export function endOfMonth({ year, month }: YearMonth): Date {
  return new Date(year, month, 0, 23, 59, 59, 999);
}

/**
 * Upcoming / Current / Completed derived from the dates alone, so nothing has
 * to be edited by hand as time passes. Undated entries have no status.
 */
export function statusOf(entry: Dated, now: Date = new Date()): Status | null {
  if (!entry.start) return null;
  if (new Date(entry.start.year, entry.start.month - 1, 1) > now)
    return "Upcoming";
  if (entry.end && endOfMonth(entry.end) < now) return "Completed";
  return "Current";
}
