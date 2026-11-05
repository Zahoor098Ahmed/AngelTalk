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
  const res1 = await searchArasaac("goldilocks", "en");
  const res2 = await searchArasaac("ricitos de oro", "es");
  const res3 = await searchArasaac("tres osos", "es");
  console.log("goldilocks en ->", res1.map(x => ({ id: x._id, kw: x.keywords?.map(k => k.keyword).slice(0, 3) })));
  console.log("ricitos de oro es ->", res2.map(x => ({ id: x._id, kw: x.keywords?.map(k => k.keyword).slice(0, 3) })));
  console.log("tres osos es ->", res3.map(x => ({ id: x._id, kw: x.keywords?.map(k => k.keyword).slice(0, 3) })));
}

run();

