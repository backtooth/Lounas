import test from "node:test";
import assert from "node:assert/strict";
import { getHelsinkiDateKey, selectTodayData } from "../menu-date.js";
import { getWeekDateKeys } from "../scripts/menu-lib.mjs";

const day = (date, generatedAt = "2026-10-28T08:00:00Z") => ({ date, generatedAt, restaurants: [] });

test("Päivä vaihtuu Helsingissä, vaikka päivän ajastettu päivitys ei käynnisty", () => {
  const today = day("2026-10-28");
  const thursday = day("2026-10-29");
  const week = { days: { "2026-10-29": thursday } };
  const date = getHelsinkiDateKey(new Date("2026-10-28T22:01:00Z"));
  assert.equal(date, "2026-10-29");
  assert.equal(selectTodayData(today, week, date), thursday);
});

test("Puuttuva tai vanhentunut viikko ei näytä väärän päivän listaa", () => {
  assert.equal(selectTodayData(day("2026-10-28"), { days: { "2026-10-29": day("2026-10-28") } }, "2026-10-29"), null);
  assert.equal(selectTodayData(null, null, "2026-10-29"), null);
});

test("Tuorein päivälista valitaan ja viikkotiedoston virhe ei estä päivän listaa", () => {
  const current = day("2026-10-29", "2026-10-29T08:00:00Z");
  assert.equal(selectTodayData(current, { days: { "2026-10-29": day("2026-10-29") } }, "2026-10-29"), current);
  assert.equal(selectTodayData(current, null, "2026-10-29"), current);
});

test("Viikko kattaa maanantaista sunnuntaihin myös vuodenvaihteen", () => {
  const dates = getWeekDateKeys("2027-01-01");
  assert.equal(dates.length, 7);
  assert.equal(dates[0], "2026-12-28");
  assert.equal(dates[6], "2027-01-03");
});
