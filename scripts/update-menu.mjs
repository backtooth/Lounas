import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createTodayData, fetchRestaurantDays, getHelsinkiDateKey, getWeekDateKeys } from "./menu-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(root, "data", "today.json");
const weekPath = resolve(root, "data", "week.json");
const dateKey = getHelsinkiDateKey();
const restaurantDays = await fetchRestaurantDays(getWeekDateKeys(dateKey));
const restaurants = restaurantDays[dateKey];
const successful = restaurants.filter((restaurant) => restaurant.status !== "error").length;
if (successful === 0) throw new Error("Yksikään ravintolalähde ei vastannut. Aiemmat tiedostot säilytetään.");
let generatedAt = new Date().toISOString();

try {
  const previous = JSON.parse(await readFile(weekPath, "utf8"));
  const previousComparable = JSON.stringify(Object.fromEntries(Object.entries(previous.days).map(([date, day]) => [date, day.restaurants])));
  const nextComparable = JSON.stringify(restaurantDays);
  if (previousComparable === nextComparable) generatedAt = previous.generatedAt;
} catch {
  // Ensimmäinen ajo luo tiedoston.
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(createTodayData(dateKey, restaurants, generatedAt), null, 2)}\n`, "utf8");
const days = Object.fromEntries(Object.entries(restaurantDays).map(([date, items]) => [date, createTodayData(date, items, generatedAt)]));
await writeFile(weekPath, `${JSON.stringify({ generatedAt, days }, null, 2)}\n`, "utf8");
console.log(`Päivitetty ${dateKey}: ${successful}/${restaurants.length} ravintolaa.`);
