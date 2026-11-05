const https = require('https');

async function searchCommons(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' filetype:bitmap|drawing')}&srlimit=5&format=json`;
  return new Promise(resolve => {
    https.get(url, { headers: { 'User-Agent': 'AngelTalk/1.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.query?.search?.map(s => s.title) || []);
        } catch {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

async function getImageUrl(title) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json`;
  return new Promise(resolve => {
    https.get(url, { headers: { 'User-Agent': 'AngelTalk/1.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query?.pages;
          const first = Object.values(pages)[0];
          resolve(first?.imageinfo?.[0]?.url || null);
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function run() {
  const searches = [
    "3D glasses svg",
    "water balloon svg",
    "water snake toy",
    "ball popper toy",
    "vibrating pen",
    "tornado in a bottle",
    "picnic table svg",
    "playground roundabout svg"
  ];

  for (const s of searches) {
    const titles = await searchCommons(s);
    console.log(s, "->", titles[0]);
    if (titles[0]) {
      const u = await getImageUrl(titles[0]);
      console.log("   URL:", u);
    }
  }
}

run();

