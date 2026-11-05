const https = require('https');

async function searchArasaac(term) {
  return new Promise((resolve) => {
    https.get(`https://api.arasaac.org/api/pictograms/en/search/${encodeURIComponent(term)}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

async function run() {
  const terms = [
    "3D", "cinema", "film", "movie",
    "doll", "action", "robot", "figure", "superhero", "hero",
    "ball", "popper", "pop",
    "water", "balloon", "balloons",
    "snake", "spiral", "sensory", "tube", "pipe",
    "top", "spin", "gyroscope",
    "tornado", "whirlwind", "funnel",
    "vibrate", "vibration", "shake", "wiggle"
  ];

  for (const t of terms) {
    const res = await searchArasaac(t);
    const hits = (Array.isArray(res) ? res : []).slice(0, 4).map(x => ({ id: x._id, keywords: x.keywords?.map(k => k.keyword).slice(0, 3) }));
    console.log(t, "->", JSON.stringify(hits));
  }
}

run();

