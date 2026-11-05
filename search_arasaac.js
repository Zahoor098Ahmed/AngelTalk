const https = require('https');

async function searchArasaac(term) {
  return new Promise((resolve) => {
    https.get(`https://api.arasaac.org/api/pictograms/en/search/${encodeURIComponent(term)}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

async function run() {
  const terms = [
    "3d glasses", "glasses",
    "action figure", "superhero", "toy",
    "ball popper", "popper",
    "water balloon", "balloon",
    "water snake", "tube",
    "spinning top", "top",
    "tornado", "vortex",
    "pen", "pencil",
    "zip line", "zipline", "cable car",
    "splash pad", "sprinkler", "water park",
    "picnic", "picnic basket",
    "picnic table", "bench",
    "pond", "lake",
    "roundabout", "carousel", "merry-go-round",
    "lamp post", "street lamp", "lantern"
  ];

  for (const t of terms) {
    const res = await searchArasaac(t);
    const hits = (Array.isArray(res) ? res : []).slice(0, 3).map(x => ({ id: x._id, keywords: x.keywords?.map(k => k.keyword).slice(0, 3) }));
    console.log(t, "->", JSON.stringify(hits));
  }
}

run();

