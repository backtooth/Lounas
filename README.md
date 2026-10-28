# Lounas

Yhden sivun lounasnäkymä, joka näyttää vain tämän päivän tarjonnan:

- Dylan Vaisala
- Lunch Hub
- Fuudii
- Ravintola Sapusca
- Koto Kaivoksela

Päivä päätellään aina `Europe/Helsinki`-aikavyöhykkeellä. Dylanin, Lunch Hubin ja Sapuscan listat luetaan ravintoloiden käyttämästä julkisesta Lounastaja-rajapinnasta. Fuudiin ja Koto Kaivokselan listat luetaan ravintoloiden omilta verkkosivuilta.

## Käyttö

Projekti ei tarvitse ulkoisia npm-riippuvuuksia. Node.js 24 riittää.

```sh
node scripts/update-menu.mjs
node --test
node scripts/build.mjs
```

`update-menu.mjs` kirjoittaa päivän listan tiedostoon `data/today.json`. `build.mjs` kokoaa julkaistavat tiedostot `dist`-hakemistoon. Palvele projektin juurta tai `dist`-hakemistoa millä tahansa staattisia tiedostoja tarjoavalla palvelimella.

## Automaattinen päivitys ja julkaisu

GitHub Actions päivittää listan puolen tunnin välein ravintoloiden aukioloaikojen ympärillä, tallentaa muuttuneen päivän datan ja julkaisee `dist`-hakemiston GitHub Pagesiin. Päivityskomento säilyttää edellisen päivitysajan, jos päivän sisältö ei ole muuttunut, ja palauttaa virhekoodin vain, jos yksikään ravintolalähde ei vastaa.

Selain tarkistaa datan päivämäärän Helsingin aikavyöhykkeellä viiden minuutin välein ja aina, kun sivulle palataan. Eilistä listaa ei näytetä uuden päivän listana, vaan sivu odottaa automaattisesti seuraavaa onnistunutta päivitystä.
