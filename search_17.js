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
  const words = [
    { w: "cafeteria", t: ["cafeteria", "canteen", "dining hall"] },
    { w: "factory", t: ["factory", "industrial plant"] },
    { w: "drive through", t: ["drive through", "take away", "drive thru", "fast food"] },
    { w: "coffee shop", t: ["coffee shop", "coffee", "cafe"] },
    { w: "hair salon", t: ["hair salon", "barber", "hairdresser"] },
    { w: "hotel", t: ["hotel", "motel", "hostel"] },
    { w: "mall", t: ["shopping mall", "shopping center", "mall"] },
    { w: "locker room", t: ["locker room", "changing room", "dressing room"] },
    { w: "market", t: ["market", "grocery", "produce market"] },
    { w: "museum", t: ["museum", "gallery", "art gallery"] },
    { w: "plant room", t: ["greenhouse", "plants", "plant nursery", "garden center"] },
    { w: "savannah", t: ["savannah", "savanna", "safari"] },
    { w: "shops", t: ["shops", "boutique", "commercial street"] },
    { w: "store", t: ["store", "convenience store", "general store"] },
    { w: "supermarket", t: ["supermarket", "hypermarket", "grocery store"] },
    { w: "temple", t: ["temple", "hindu temple", "buddhist temple"] },
    { w: "shrine", t: ["shrine", "altar", "sanctuary"] }
  ];

  for (const item of words) {
    const resList = [];
    for (const q of item.t) {
      const res = await searchArasaac(q, "en");
      if (Array.isArray(res)) {
        res.slice(0, 3).forEach(x => resList.push({ id: x._id, kw: x.keywords?.map(k => k.keyword).slice(0, 2).join(", ") }));
      }
    }
    console.log(`=== ${item.w} ===`);
    console.log(JSON.stringify(resList.slice(0, 5)));
  }
}

run();

