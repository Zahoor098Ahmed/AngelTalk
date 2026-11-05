const https = require('https');

async function searchArasaac(term) {
  return new Promise((resolve) => {
    https.get(`https://api.arasaac.org/api/pictograms/es/search/${encodeURIComponent(term)}`, (res) => {
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
  const terms = ["lanzador", "pelotas", "pompas", "bolas", "canicas", "circuito", "muelle"];
  for (const t of terms) {
    const res = await searchArasaac(t);
    const hits = (Array.isArray(res) ? res : []).slice(0, 3).map(x => ({ id: x._id, keywords: x.keywords?.map(k => k.keyword).slice(0, 3) }));
    console.log(t, "->", JSON.stringify(hits));
  }
}

run();

