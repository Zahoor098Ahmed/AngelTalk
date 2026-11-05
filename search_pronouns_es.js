const https = require('https');

async function searchArasaac(term, lang='es') {
  return new Promise((resolve) => {
    https.get(`https://api.arasaac.org/api/pictograms/${lang}/search/${encodeURIComponent(term)}`, (res) => {
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
  const terms = ["yo", "mi", "mio", "nosotros", "ella", "el", "ellos", "vosotros"];
  for (const t of terms) {
    const res = await searchArasaac(t, "es");
    console.log(t, "->", res.slice(0, 3).map(x => ({ id: x._id, kw: x.keywords?.map(k => k.keyword).slice(0, 2).join(", ") })));
  }
}

run();

