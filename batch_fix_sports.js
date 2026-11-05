const fs = require('fs');
const https = require('https');
const { PNG } = require('./frontend/node_modules/pngjs');

function searchArasaac(term) {
  return new Promise((resolve) => {
    https.get('https://api.arasaac.org/v1/pictograms/en/search/' + encodeURIComponent(term), (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          resolve(Array.isArray(json) ? json : []);
        } catch(e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

function downloadPngBuffer(id) {
  return new Promise((resolve) => {
    https.get(`https://static.arasaac.org/pictograms/${id}/${id}_500.png`, (res) => {
      if (res.statusCode !== 200) return resolve(null);
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', () => resolve(null));
  });
}

// Convert transparent PNG buffer into base64 with solid #ffffff background
function makePureWhiteBase64(pngBuffer) {
  try {
    const png = PNG.sync.read(pngBuffer);
    for (let y = 0; y < png.height; y++) {
      for (let x = 0; x < png.width; x++) {
        const idx = (y * png.width + x) * 4;
        const a = png.data[idx + 3] / 255;
        if (a < 1) {
          png.data[idx] = Math.round(png.data[idx] * a + 255 * (1 - a));
          png.data[idx + 1] = Math.round(png.data[idx + 1] * a + 255 * (1 - a));
          png.data[idx + 2] = Math.round(png.data[idx + 2] * a + 255 * (1 - a));
          png.data[idx + 3] = 255;
        }
      }
    }
    const out = PNG.sync.write(png);
    return 'data:image/png;base64,' + out.toString('base64');
  } catch(e) {
    return 'data:image/png;base64,' + pngBuffer.toString('base64');
  }
}

// Map of words in Sports to search queries / best ARASAAC terms
const customQueries = {
  "australian football": "rugby",
  "footy": "rugby",
  "baseball diamond": "baseball",
  "beach paddles": "tennis racket",
  "bear walk": "bear",
  "bicycle pump": "pump",
  "bow and arrow": "archery",
  "bowling pins": "bowling",
  "butterfly stretch": "stretch",
  "chin ups": "pull up",
  "crab walk": "crab",
  "cricket ball": "cricket",
  "cricket bat": "cricket",
  "dart board": "darts",
  "darts game": "darts",
  "dragon pose": "yoga",
  "exercise bike": "stationary bicycle",
  "face mask": "mask",
  "figure skates": "ice skates",
  "final cheer": "cheer",
  "fish hook": "hook",
  "fishing pole": "fishing rod",
  "fitness tracker": "smart watch",
  "football net": "soccer goal",
  "frisbee-play": "frisbee",
  "frog pose": "frog",
  "golf tee": "golf",
  "groin stretch": "stretch",
  "group warm-up": "warm up",
  "hockey goal": "goal",
  "hockey puck": "ice hockey",
  "hockey skates": "ice skates",
  "hockey stick": "hockey",
  "hop ball": "gym ball",
  "ice skates - figure": "ice skates",
  "ice skates - hockey": "ice skates",
  "ice skating rink": "ice rink",
  "leg extension": "exercise",
  "obstacle course": "circuit",
  "olympics": "olympic games",
  "overhead arm stretch": "stretch",
  "plank pose": "gymnastics",
  "pool ball": "billiards",
  "pool billiards": "billiards",
  "pool cue": "cue",
  "punch ball": "punching bag",
  "reverse warrior pose": "yoga",
  "ring toss": "hoopla",
  "rope net": "net",
  "score basket": "basketball",
  "score soccer": "soccer",
  "seated toe stretch": "stretch",
  "side bend": "stretch",
  "side leg lift": "gymnastics",
  "sit-up": "gymnastics",
  "skee ball": "bowling",
  "skipping rope": "jump rope",
  "snake crawl": "snake",
  "snake pose": "yoga",
  "soccer net": "goal",
  "standing side leg lift": "gymnastics",
  "step exercise": "aerobics",
  "straight leg stretch": "stretch",
  "t-ball": "baseball",
  "tae kwon do": "taekwondo",
  "three legged dog pose": "yoga",
  "touchdown": "american football",
  "weight lifting": "weightlifting",
  "wheelbarrow walk": "gymnastics",
  "yoga mat": "mat"
};

async function main() {
  const sportsList = JSON.parse(fs.readFileSync('sports_words_info.json', 'utf8'));
  const uniquePictures = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

  console.log(`Processing ${sportsList.length} sports items...`);

  let updatedCount = 0;
  for (const item of sportsList) {
    const rawWord = item.word.toLowerCase();
    const query = customQueries[rawWord] || rawWord;

    console.log(`Searching for "${rawWord}" (query: "${query}")...`);
    let results = await searchArasaac(query);

    if (results.length === 0 && query !== rawWord) {
      results = await searchArasaac(rawWord);
    }

    if (results.length > 0) {
      // Pick best result
      const best = results[0];
      const buffer = await downloadPngBuffer(best._id);
      if (buffer) {
        const base64 = makePureWhiteBase64(buffer);
        uniquePictures[rawWord] = base64;
        uniquePictures[`sports and fitness::${rawWord}`] = base64;
        updatedCount++;
        console.log(`  -> Updated "${rawWord}" with ARASAAC ID ${best._id}`);
      } else {
        console.log(`  -> Failed to download image for ID ${best._id}`);
      }
    } else {
      console.log(`  -> No ARASAAC results for "${rawWord}"`);
    }
  }

  fs.writeFileSync('./frontend/src/modules/uniquePictures.json', JSON.stringify(uniquePictures, null, 2), 'utf8');
  console.log(`\nSuccessfully updated ${updatedCount} sports words to authentic ARASAAC pictograms on pure white background!`);
}

main();

