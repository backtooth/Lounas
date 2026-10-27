const restaurantsElement = document.querySelector("#restaurants");
const restaurantTemplate = document.querySelector("#restaurant-template");
const menuItemTemplate = document.querySelector("#menu-item-template");

function setText(root, selector, value) {
  root.querySelector(selector).textContent = value || "";
}

function renderMenuItem(item) {
  const fragment = menuItemTemplate.content.cloneNode(true);
  setText(fragment, ".menu-type", item.type);
  setText(fragment, ".menu-price", item.price);
  setText(fragment, ".menu-title", item.title);
  setText(fragment, ".menu-description", item.description);
  setText(fragment, ".menu-diet", item.diet);
  return fragment;
}

function renderRestaurant(restaurant, index) {
  const fragment = restaurantTemplate.content.cloneNode(true);
  const article = fragment.querySelector(".restaurant-card");
  const sourceLink = fragment.querySelector(".source-link");
  const menuList = fragment.querySelector(".menu-list");

  article.setAttribute("aria-labelledby", `restaurant-${index}`);
  setText(fragment, ".restaurant-number", `Ravintola ${String(index + 1).padStart(2, "0")}`);
  setText(fragment, ".restaurant-name", restaurant.name);
  fragment.querySelector(".restaurant-name").id = `restaurant-${index}`;
  setText(fragment, ".hours", restaurant.hours);
  setText(fragment, ".address", restaurant.address);
  sourceLink.href = restaurant.sourceUrl;
  sourceLink.setAttribute("aria-label", `Avaa ravintolan ${restaurant.name} oma sivu`);

  if (restaurant.status === "ok" && restaurant.items.length > 0) {
    restaurant.items.forEach((item) => menuList.append(renderMenuItem(item)));
  } else {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    const heading = document.createElement("strong");
    heading.textContent = restaurant.status === "closed" ? "Ei lounastarjoilua tänään" : "Lista ei ole saatavilla";
    empty.append(heading, document.createTextNode(restaurant.message || "Tarkista ajantasainen tieto ravintolan omalta sivulta."));
    menuList.append(empty);
  }

  return fragment;
}

function formatUpdated(timestamp) {
  if (!timestamp) return "";
  const formatted = new Intl.DateTimeFormat("fi-FI", {
    timeZone: "Europe/Helsinki",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
  return `Päivitetty klo ${formatted}`;
}

async function init() {
  try {
    const response = await fetch(`data/today.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    document.querySelector("#weekday").textContent = data.weekday;
    document.querySelector("#date").textContent = data.displayDate;
    document.querySelector("#updated").textContent = formatUpdated(data.generatedAt);
    document.title = `${data.weekday}: päivän lounaat`;
    restaurantsElement.replaceChildren();
    data.restaurants.forEach((restaurant, index) => restaurantsElement.append(renderRestaurant(restaurant, index)));
  } catch (error) {
    restaurantsElement.innerHTML = "";
    const message = document.createElement("p");
    message.className = "error-message";
    message.textContent = "Lounaslistoja ei saatu juuri nyt ladattua. Yritä hetken kuluttua uudelleen.";
    restaurantsElement.append(message);
    console.error(error);
  } finally {
    restaurantsElement.setAttribute("aria-busy", "false");
  }
}

init();
