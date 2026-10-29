export function getHelsinkiDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Helsinki",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function selectTodayData(today, week, dateKey) {
  const candidates = [today, week?.days?.[dateKey]]
    .filter((day) => day?.date === dateKey && Array.isArray(day.restaurants));
  return candidates.sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt))[0] || null;
}
