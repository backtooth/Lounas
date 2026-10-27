# Lounas

Yhden sivun lounasnäkymä, joka näyttää vain tämän päivän tarjonnan:

- Dylan Vaisala
- Lunch Hub
- Fuudii

Päivä päätellään aina `Europe/Helsinki`-aikavyöhykkeellä. Dylanin ja Lunch Hubin listat luetaan ravintoloiden käyttämästä julkisesta Lounastaja-rajapinnasta, Fuudiin lista ravintolan omalta verkkosivulta.

## Käyttö

Projekti ei tarvitse ulkoisia npm-riippuvuuksia. Node.js 24 riittää.

```sh
node scripts/update-menu.mjs
node --test
node scripts/build.mjs
```

`update-menu.mjs` kirjoittaa päivän listan tiedostoon `data/today.json`. `build.mjs` kokoaa julkaistavat tiedostot `dist`-hakemistoon. Palvele projektin juurta tai `dist`-hakemistoa millä tahansa staattisia tiedostoja tarjoavalla palvelimella.

## Automaattinen päivitys

Ajasta palvelimella tai CI-palvelussa komento `node scripts/update-menu.mjs` ennen sivun buildia. Komento säilyttää edellisen päivitysajan, jos päivän sisältö ei ole muuttunut, ja palauttaa virhekoodin vain, jos yksikään ravintolalähde ei vastaa.
