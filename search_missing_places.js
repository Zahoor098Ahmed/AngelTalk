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
  const missing = [
    { t: "hairdresser", l: "en" },
    { t: "peluqueria", l: "es" },
    { t: "bookstore", l: "en" },
    { t: "libreria", l: "es" },
    { t: "farm", l: "en" },
    { t: "neighborhood", l: "en" },
    { t: "barrio", l: "es" },
    { t: "shopping mall", l: "en" },
    { t: "centro comercial", l: "es" },
    { t: "greenhouse", l: "en" },
    { t: "invernadero", l: "es" },
    { t: "hall", l: "en" },
    { t: "drive thru", l: "en" },
    { t: "mercadillo", l: "es" },
    { t: "santuario", l: "es" },
    { t: "tienda", l: "es" },
    { t: "templo", l: "es" }
  ];

  for (const item of missing) {
    const res = await searchArasaac(item.t, item.l);
    const hits = (Array.isArray(res) ? res : []).slice(0, 3).map(x => ({ id: x._id, keywords: x.keywords?.map(k => k.keyword).slice(0, 3) }));
    console.log(item.t, "->", JSON.stringify(hits));
  }
}

run();

