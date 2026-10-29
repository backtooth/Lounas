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

GitHub Actions yrittää päivittää listan puolen tunnin välein ympäri vuorokauden, tallentaa muuttuneet listat ja julkaisee `dist`-hakemiston GitHub Pagesiin. Päivityskomento säilyttää edellisen päivitysajan, jos viikon sisältö ei ole muuttunut, ja keskeyttää tallentamatta, jos yksikään ravintolalähde ei vastaa.

Julkaisu sisältää myös koko kuluvan viikon listat tiedostossa `data/week.json`. Selain valitsee oikean päivän Helsingin ajan mukaan, vaikka päivän ajastettu ajo viivästyisi. Jokainen ravintolalähde haetaan kerran päivitystä kohti. Ajastus toimii ympäri vuorokauden, mutta GitHub voi viivästyttää tai ohittaa ajoja.

Selain tarkistaa datan viiden minuutin välein ja aina sivulle palattaessa. Eilistä listaa ei näytetä uuden päivän listana. Jos päivän tietoja ei löydy kummastakaan tiedostosta, näytetään saatavuusilmoitus ja linkit ravintoloiden omille sivuille. Päivitysaika sisältää päivämäärän, jos tiedot haettiin aiempana päivänä.
