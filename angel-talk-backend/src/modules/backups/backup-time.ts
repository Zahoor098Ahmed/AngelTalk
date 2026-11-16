/** Dates are calculated in the device's IANA time zone, including daylight saving changes. */
export function localDay(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", calendar: "iso8601", numberingSystem: "latn" }).formatToParts(date);
  const value = (type: string) => parts.find(p => p.type === type)!.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
export function nextLocalMidnight(now: Date, timeZone: string): Date {
  const today = localDay(now, timeZone);
  let low = now.getTime(), high = low + 36 * 60 * 60 * 1000;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (localDay(new Date(middle), timeZone) === today) low = middle; else high = middle;
  }
  return new Date(high);
}
