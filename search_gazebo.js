const https = require('https');

async function searchArasaac(term, lang='en') {
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
  const terms = [
    { t: "gazebo", l: "en" },
    { t: "pavilion", l: "en" },
    { t: "pergola", l: "en" },
    { t: "glorieta", l: "es" },
    { t: "cenador", l: "es" },
    { t: "kiosko", l: "es" }
  ];

  for (const item of terms) {
    const res = await searchArasaac(item.t, item.l);
    const hits = (Array.isArray(res) ? res : []).slice(0, 5).map(x => ({ id: x._id, keywords: x.keywords?.map(k => k.keyword).slice(0, 3) }));
    console.log(item.t, "->", JSON.stringify(hits));
  }
}

run();

