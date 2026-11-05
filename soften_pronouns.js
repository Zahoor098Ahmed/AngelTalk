const https = require('https');
const fs = require('fs');
const path = require('path');
const { PNG } = require('./frontend/node_modules/pngjs');

const targetJsonPath = path.resolve('./frontend/src/modules/uniquePictures.json');
const p = JSON.parse(fs.readFileSync(targetJsonPath, 'utf8'));

// Map of all pronouns with their ARASAAC ID
const pronounMap = {
  "hers": 12272,
  "his": 12272,
  "i": 2617,
  "it": 31670,
  "me": 7309, // or 2617
  "mine": 8630,
  "my": 12264,
  "she": 7028,
  "our": 12268,
  "ours": 12270,
  "theirs": 12274,
  "your": 12281,
  "yours": 12281,
  "we": 7183,
  "us": 7185
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

function softenRed(pngBuffer) {
  const png = PNG.sync.read(pngBuffer);
  let changed = 0;

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (png.width * y + x) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const a = png.data[idx + 3];

      // Detect sharp/harsh red (R is dominant, G and B are low)
      if (a > 30 && r > 140 && r > g * 1.4 && r > b * 1.4) {
        changed++;
        // Soften to gentle calming sensory-friendly pastel rose/coral (#f8a5a5)
        const factor = r / 255;
        png.data[idx] = Math.round(248 * factor);      // Soft rose R
        png.data[idx + 1] = Math.round(165 * factor);  // Gentle peach G
        png.data[idx + 2] = Math.round(165 * factor);  // Gentle peach B
      }
    }
  }

  // Composite over pure solid white background if transparent
  const whitePng = new PNG({ width: png.width, height: png.height });
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (png.width * y + x) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const a = png.data[idx + 3] / 255;

      whitePng.data[idx] = Math.round(r * a + 255 * (1 - a));
      whitePng.data[idx + 1] = Math.round(g * a + 255 * (1 - a));
      whitePng.data[idx + 2] = Math.round(b * a + 255 * (1 - a));
      whitePng.data[idx + 3] = 255;
    }
  }

  return { buffer: PNG.sync.write(whitePng), changed };
}

async function run() {
  console.log("Downloading and softening red in Pronouns to gentle child-friendly pastel colors...");
  
  // Cache by ARASAAC ID so we don't re-download duplicate IDs
  const idCache = {};

  for (const [word, id] of Object.entries(pronounMap)) {
    try {
      if (!idCache[id]) {
        const url = `https://static.arasaac.org/pictograms/${id}/${id}_500.png`;
        const rawBuf = await fetchBuffer(url);
        idCache[id] = softenRed(rawBuf);
      }

      const { buffer, changed } = idCache[id];
      p[word] = `data:image/png;base64,${buffer.toString('base64')}`;
      console.log(`Updated [${word}] (ID ${id}): softened ${changed} red pixels, saved to uniquePictures!`);
    } catch (e) {
      console.error(`Error updating [${word}] (ID ${id}):`, e.message);
    }
  }

  fs.writeFileSync(targetJsonPath, JSON.stringify(p, null, 2), 'utf8');
  console.log("\nSUCCESS! All pronoun cards updated with soft, gentle, child-friendly colors!");
}

run();

