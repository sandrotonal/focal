/**
 * Calculate the ISO Monday date string (YYYY-MM-DD) in local time
 * for the week containing the given date.
 * Monday is treated as the first day of the week (ISO 8601).
 *
 * Local date getters (getFullYear, getMonth, getDate) are strictly used
 * instead of toISOString() to prevent UTC timezone boundary shifts (e.g. UTC+3).
 */
export function getMondayOfWeek(d: Date = new Date()): string {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);

  const day = date.getDay();
  // day: 0 (Sun) to 6 (Sat). If Sunday (0), go back 6 days to Monday. Otherwise, go to Monday (1).
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${dayOfMonth}`;
}
