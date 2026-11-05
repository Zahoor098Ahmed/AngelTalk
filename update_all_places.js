const https = require('https');
const fs = require('fs');
const path = require('path');

const targetJsonPath = path.resolve('./frontend/src/modules/uniquePictures.json');
const p = JSON.parse(fs.readFileSync(targetJsonPath, 'utf8'));

const placesMap = {
  "airport": 3053,
  "bakery": 2864,
  "barber shop": 2850,
  "book store": 2941,
  "butcher shop": 3007,
  "cafe": 28889,
  "cafeteria": 4587,
  "castle": 5422,
  "cemetery": 4591,
  "children's farm": 3337,
  "church": 3118,
  "circus": 6450,
  "city": 2704,
  "coffee shop": 28889,
  "community": 26529,
  "corridor": 16315,
  "drive through": 39753, // shopping/drive-through service
  "factory": 35393,
  "gurdwara": 8231,
  "hair salon": 6587,
  "hotel": 9895,
  "kindergarten": 39661,
  "library": 3065,
  "lighthouse": 4646,
  "locker room": 14693,
  "main hall": 38427,
  "mall": 15551,
  "market": 32942,
  "mosque": 24177,
  "museum": 3132,
  "plant room": 7135,
  "preschool": 31470,
  "savannah": 5567,
  "sensory room": 8218,
  "shops": 35695,
  "shrine": 8231,
  "store": 9117,
  "street market": 38297,
  "supermarket": 3389,
  "swimming pool": 3142,
  "synagogue": 24408,
  "temple": 8231,
  "tennis court": 5068,
  "train station": 3099
};

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function run() {
  console.log("Downloading 44 Places pictograms from ARASAAC...");
  let count = 0;
  for (const [word, id] of Object.entries(placesMap)) {
    try {
      const url = `https://static.arasaac.org/pictograms/${id}/${id}_500.png`;
      const buf = await fetchBuffer(url);
      const b64 = `data:image/png;base64,${buf.toString('base64')}`;
      p[word] = b64;
      count++;
      console.log(`[${count}/44] Saved ${word} (ID ${id}, size ${buf.length} bytes)`);
    } catch (e) {
      console.error(`Error fetching for ${word} (ID ${id}):`, e.message);
    }
  }

  fs.writeFileSync(targetJsonPath, JSON.stringify(p, null, 2), 'utf8');
  console.log(`\nDONE! Successfully updated ${count} places cards in uniquePictures.json!`);
}

run();

