import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createTodayData, fetchRestaurants, getHelsinkiDateKey } from "./menu-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(root, "data", "today.json");
const dateKey = getHelsinkiDateKey();
const restaurants = await fetchRestaurants(dateKey);
let generatedAt = new Date().toISOString();

try {
  const previous = JSON.parse(await readFile(outputPath, "utf8"));
  const previousComparable = JSON.stringify({ date: previous.date, restaurants: previous.restaurants });
  const nextComparable = JSON.stringify({ date: dateKey, restaurants });
  if (previousComparable === nextComparable) generatedAt = previous.generatedAt;
} catch {
  // Ensimmäinen ajo luo tiedoston.
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(createTodayData(dateKey, restaurants, generatedAt), null, 2)}\n`, "utf8");
const successful = restaurants.filter((restaurant) => restaurant.status !== "error").length;
console.log(`Päivitetty ${dateKey}: ${successful}/${restaurants.length} ravintolaa.`);
if (successful === 0) process.exitCode = 1;
