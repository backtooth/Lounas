const HELSINKI_TIME_ZONE = "Europe/Helsinki";

const RESTAURANTS = {
  dylan: {
    name: "Dylan Vaisala",
    address: "Vanha Nurmijärventie 21, Rak. 3",
    hours: "10.30–13.30",
    sourceUrl: "https://www.dylan.fi/vaisala",
    apiUrl: "https://lounastaja.app/api/v1/widget/4c86fd12-bfe8-4af5-a0ab-873360e69423/3st0AYHD5yxMd4yjNmFS",
  },
  lunchhub: {
    name: "Lunch Hub",
    address: "Vanha Nurmijärventie 21, Rak. 4",
    hours: "10.30–13.30",
    sourceUrl: "https://www.lunchhub.fi/",
    apiUrl: "https://lounastaja.app/api/v1/widget/d522baa3-dbb7-4a32-924a-a5d4cf3e8129/PHVDTiBJrbdsO9KcnTaQ",
  },
  fuudii: {
    name: "Fuudii",
    address: "Ansatie 5",
    hours: "9.45–13.00",
    sourceUrl: "https://www.fuudii.fi/ravintola.html?listtype=lunch&ci=0&showall=true",
  },
  sapusca: {
    name: "Ravintola Sapusca",
    address: "Jönsaksentie 4",
    hours: "ma–pe 10.15–14 · la 11–14",
    sourceUrl: "https://www.sapusca.fi/",
    apiUrl: "https://lounastaja.app/api/v1/widget/30c4a7a9-5404-4671-a599-b1cde6969359/ZaDYLwICDmXxezuLXnVo",
  },
  koto: {
    name: "Koto Kaivoksela",
    address: "Vetokuja 4",
    hours: "10.30–14.00",
    sourceUrl: "https://www.kotoravintolat.fi/kaivoksela",
  },
};

const FINNISH_WEEKDAYS = ["sunnuntai", "maanantai", "tiistai", "keskiviikko", "torstai", "perjantai", "lauantai"];

export function getHelsinkiDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: HELSINKI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function getFinnishWeekday(dateKey) {
  return FINNISH_WEEKDAYS[new Date(`${dateKey}T12:00:00Z`).getUTCDay()];
}

export function getWeekDateKeys(dateKey) {
  const monday = new Date(`${dateKey}T12:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setUTCDate(day.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
}

function capitalize(value) {
  return value ? value[0].toUpperCase() + value.slice(1) : "";
}

function localizedValue(value, language = "fi") {
  if (typeof value === "string") return value.trim();
  return value?.[language]?.trim?.() || value?.en?.trim?.() || "";
}

function getPrice(price) {
  const value = price?.price?.trim?.();
  if (!value) return "";
  return `${value} ${localizedValue(price.unit) || "€"}`.trim();
}

export function parseLounastajaPayload(payload, restaurant, dateKey) {
  if (!payload?.success || !payload?.data?.week?.days) {
    throw new Error(`${restaurant.name}: virheellinen Lounastaja-vastaus`);
  }

  const day = payload.data.week.days.find(
    (candidate) => (candidate.dateString || candidate.date?.slice?.(0, 10)) === dateKey,
  );

  if (!day || day.isHidden || day.isClosed) {
    return {
      ...restaurant,
      status: "closed",
      message: localizedValue(day?.closedText) || "Ravintola on tänään suljettu.",
      items: [],
    };
  }

  const items = (day.lunches || []).map((lunch) => ({
    type: lunch.lunchType?.trim?.() || "Lounas",
    title: localizedValue(lunch.title),
    description: localizedValue(lunch.description),
    diet: (lunch.allergens || []).map((allergen) => localizedValue(allergen.abbreviation)).filter(Boolean).join(" · "),
    price: getPrice(lunch.normalPrice),
  }));

  return {
    ...restaurant,
    status: items.length ? "ok" : "closed",
    message: items.length ? "" : "Päivän listaa ei ole julkaistu.",
    items,
  };
}

const HTML_ENTITIES = {
  amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"',
  auml: "ä", Auml: "Ä", aring: "å", Aring: "Å", eacute: "é", Eacute: "É", ouml: "ö", Ouml: "Ö",
};

export function decodeHtml(value = "") {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-zA-Z]+);/g, (entity, name) => HTML_ENTITIES[name] ?? entity);
}

function stripTags(value = "") {
  return decodeHtml(value.replace(/<br\s*\/?\s*>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();
}

export function parseFuudiiHtml(html, restaurant, dateKey) {
  const weekday = capitalize(getFinnishWeekday(dateKey));
  const headingPattern = /<div\s+class=["']restaurant_menuheading["'][^>]*>([\s\S]*?)<\/div>/gi;
  const headings = [...html.matchAll(headingPattern)];
  const headingIndex = headings.findIndex((match) =>
    stripTags(match[1]).toLocaleLowerCase("fi-FI").includes(weekday.toLocaleLowerCase("fi-FI")),
  );

  if (headingIndex === -1) throw new Error(`${restaurant.name}: päivän ${weekday} listaa ei löytynyt`);

  const start = headings[headingIndex].index + headings[headingIndex][0].length;
  const end = headings[headingIndex + 1]?.index ?? html.length;
  const dayHtml = html.slice(start, end);

  if (/Ei\s+lounastarjoilua/i.test(stripTags(dayHtml))) {
    return { ...restaurant, status: "closed", message: "Ei lounastarjoilua tänään.", items: [] };
  }

  const namePattern = /<div\s+class=["']restaurant_menuitemname["'][^>]*>([\s\S]*?)<\/div>/gi;
  const names = [...dayHtml.matchAll(namePattern)];
  const items = names.map((match, index) => {
    const itemStart = match.index + match[0].length;
    const itemEnd = names[index + 1]?.index ?? dayHtml.length;
    const itemHtml = dayHtml.slice(itemStart, itemEnd);
    const description = itemHtml.match(/<div\s+class=["']restaurant_menuitemdescription["'][^>]*>([\s\S]*?)<\/div>/i);
    const diet = itemHtml.match(/<div\s+class=["']restaurant_menuitemtypes["'][^>]*>([\s\S]*?)<\/div>/i);
    const price = match[1].match(/<span\s+class=["']restaurant_menuitemprice["'][^>]*>([\s\S]*?)<\/span>/i);
    return {
      type: "Lounas",
      title: stripTags(match[1].replace(price?.[0] || "", "")),
      description: stripTags(description?.[1] || ""),
      diet: stripTags(diet?.[1] || ""),
      price: stripTags(price?.[1] || ""),
    };
  });

  return {
    ...restaurant,
    status: items.length ? "ok" : "closed",
    message: items.length ? "" : "Päivän listaa ei ole julkaistu.",
    items,
  };
}

const KOTO_DAY_ABBREVIATIONS = ["SU", "MA", "TI", "KE", "TO", "PE", "LA"];

export function parseKotoHtml(html, restaurant, dateKey) {
  const localDate = new Date(`${dateKey}T12:00:00Z`);
  const dayIndex = localDate.getUTCDay();

  if (dayIndex === 0 || dayIndex === 6) {
    return { ...restaurant, status: "closed", message: "Ei lounastarjoilua tänään.", items: [] };
  }

  const abbreviation = KOTO_DAY_ABBREVIATIONS[dayIndex];
  const dayOfMonth = localDate.getUTCDate();
  const month = localDate.getUTCMonth() + 1;
  const dateLabel = `${dayOfMonth}.${month}.`;
  const paragraphPattern = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  const datePattern = new RegExp(`^${abbreviation}\\s+0?${dayOfMonth}\\.0?${month}\\.`);
  const headings = [...html.matchAll(paragraphPattern)].filter((match) => datePattern.test(stripTags(match[1])));

  if (!headings.length) {
    throw new Error(`${restaurant.name}: päivän ${abbreviation} ${dateLabel} listaa ei löytynyt`);
  }

  const heading = headings.at(-1);
  const afterHeading = html.slice(heading.index + heading[0].length);
  const listMatch = afterHeading.match(/^\s*<ul[^>]*>([\s\S]*?)<\/ul>/i);
  if (!listMatch) throw new Error(`${restaurant.name}: päivän annoslistaa ei löytynyt`);

  const items = [...listMatch[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => stripTags(match[1]))
    .filter(Boolean)
    .map((title) => ({ type: "Lounas", title, description: "", diet: "", price: "" }));

  return {
    ...restaurant,
    status: items.length ? "ok" : "closed",
    message: items.length ? "" : "Päivän listaa ei ole julkaistu.",
    items,
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "Lounaslista/1.0 (+https://github.com/backtooth/Lounas)" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

async function fetchLatin1(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 Lounaslista/1.0" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return new TextDecoder("windows-1252").decode(await response.arrayBuffer());
}

function failedRestaurant(restaurant, error) {
  console.error(error);
  return { ...restaurant, status: "error", message: "Päivän listaa ei saatu haettua. Tarkista ravintolan oma sivu.", items: [] };
}

export async function fetchRestaurantDays(dateKeys) {
  // Hae jokainen lähde vain kerran ja poimi siitä viikon päivät.
  const restaurants = Object.values(RESTAURANTS);
  const sources = await Promise.allSettled(restaurants.map((restaurant) =>
    restaurant.apiUrl ? fetchJson(restaurant.apiUrl) : fetchLatin1(restaurant.sourceUrl),
  ));
  return Object.fromEntries(dateKeys.map((dateKey) => [dateKey, restaurants.map((restaurant, index) => {
    let result;
    try {
      const source = sources[index];
      if (source.status === "rejected") throw source.reason;
      const parse = restaurant.apiUrl ? parseLounastajaPayload
        : restaurant === RESTAURANTS.fuudii ? parseFuudiiHtml : parseKotoHtml;
      result = parse(source.value, restaurant, dateKey);
    } catch (error) {
      result = failedRestaurant(restaurant, error);
    }
    const { apiUrl: _apiUrl, ...publicRestaurant } = result;
    return publicRestaurant;
  })]));
}

export async function fetchRestaurants(dateKey) {
  return (await fetchRestaurantDays([dateKey]))[dateKey];
}

export function createTodayData(dateKey, restaurants, generatedAt = new Date().toISOString()) {
  const localDate = new Date(`${dateKey}T12:00:00Z`);
  return {
    date: dateKey,
    weekday: capitalize(getFinnishWeekday(dateKey)),
    displayDate: new Intl.DateTimeFormat("fi-FI", { timeZone: HELSINKI_TIME_ZONE, day: "numeric", month: "long", year: "numeric" }).format(localDate),
    generatedAt,
    restaurants,
  };
}
