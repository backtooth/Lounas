import test from "node:test";
import assert from "node:assert/strict";
import { getFinnishWeekday, getHelsinkiDateKey, parseFuudiiHtml, parseLounastajaPayload } from "../scripts/menu-lib.mjs";

const restaurant = { name: "Testiravintola", address: "Testikatu 1", hours: "10–14", sourceUrl: "https://example.com" };

test("Helsingin päivämäärä huomioi aikavyöhykkeen", () => {
  assert.equal(getHelsinkiDateKey(new Date("2026-10-26T22:30:00Z")), "2026-10-27");
  assert.equal(getFinnishWeekday("2026-10-27"), "tiistai");
});

test("Lounastaja-parseri valitsee vain annetun päivän", () => {
  const payload = {
    success: true,
    data: { week: { days: [
      { dateString: "2026-10-26", lunches: [{ title: { fi: "Maanantain ruoka" } }] },
      { dateString: "2026-10-27", lunches: [{
        lunchType: "Kasvisruoka",
        title: { fi: "Kikhernepata" },
        description: { fi: "Paahdettua bataattia" },
        allergens: [{ abbreviation: { fi: "G" } }],
        normalPrice: { price: "11,20", unit: { fi: "€" } },
      }] },
    ] } },
  };

  const result = parseLounastajaPayload(payload, restaurant, "2026-10-27");
  assert.equal(result.status, "ok");
  assert.deepEqual(result.items, [{
    type: "Kasvisruoka", title: "Kikhernepata", description: "Paahdettua bataattia", diet: "G", price: "11,20 €",
  }]);
});

test("Fuudii-parseri valitsee oikean päivälohkon ja purkaa entiteetit", () => {
  const html = `
    <div class="restaurant_menuheading">Lounaslista&nbsp;Maanantai</div>
    <div class="restaurant_menu"><div class="restaurant_menuitemname">Maanantain ruoka</div></div>
    <div class="restaurant_menuheading">Lounaslista&nbsp;Tiistai</div>
    <div class="restaurant_menu">
      <div class="restaurant_menuitemname"><span class="restaurant_menuitemprice"></span>Lohi &amp; perunaa</div>
      <div class="restaurant_menuitemdescription">Tillill&auml; maustettu</div>
      <div class="restaurant_menuitemtypes">gluteeniton,&nbsp;laktoositon</div>
    </div>
    <div class="restaurant_menuheading">Lounaslista&nbsp;Keskiviikko</div>`;

  const result = parseFuudiiHtml(html, restaurant, "2026-10-27");
  assert.equal(result.status, "ok");
  assert.deepEqual(result.items, [{
    type: "Lounas", title: "Lohi & perunaa", description: "Tillillä maustettu", diet: "gluteeniton, laktoositon", price: "",
  }]);
});
