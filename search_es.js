const https = require('https');

async function searchArasaacEs(term) {
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
  const terms = [
    "gafas 3d", "gafas de 3d", "gafas", "3d",
    "figura de accion", "superheroe", "muñeco",
    "globo de agua", "pistola de agua", "bomba de agua",
    "peonza", "trompo",
    "tirolina",
    "parque acuatico", "chorros", "fuente",
    "picnic", "merendero", "mesa de picnic",
    "estanque", "charca",
    "tiovivo", "carrusel",
    "farola", "farol"
  ];

  for (const t of terms) {
    const res = await searchArasaacEs(t);
    const hits = (Array.isArray(res) ? res : []).slice(0, 3).map(x => ({ id: x._id, keywords: x.keywords?.map(k => k.keyword).slice(0, 3) }));
    console.log(t, "->", JSON.stringify(hits));
  }
}

run();

