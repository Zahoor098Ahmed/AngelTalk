const fs = require('fs');

const p = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));
const pecs = JSON.parse(fs.readFileSync('./frontend/src/modules/pecsPictograms.json', 'utf8'));
const dict = JSON.parse(fs.readFileSync('./frontend/src/modules/arasaacDict.json', 'utf8'));

const words = [
  "airport", "bakery", "barber shop", "book store", "butcher shop", "cafe",
  "cafeteria", "castle", "cemetery", "children's farm", "church", "circus",
  "city", "coffee shop", "community", "corridor", "drive through", "factory",
  "gurdwara", "hair salon", "hotel", "kindergarten", "library", "lighthouse",
  "locker room", "main hall", "mall", "market", "mosque", "museum",
  "plant room", "preschool", "savannah", "sensory room", "shops", "shrine",
  "store", "street market", "supermarket", "swimming pool", "synagogue",
  "temple", "tennis court", "train station"
];

const report = {};
words.forEach(w => {
  report[w] = {
    uniquePictures: !!p[w],
    uniqueLength: p[w] ? p[w].length : 0,
    uniqueIsBear: p[w] && p[w].length === 25562,
    pecs: pecs[w],
    dict: dict[w]
  };
});

console.log(JSON.stringify(report, null, 2));

