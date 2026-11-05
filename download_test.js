const https = require('https');
const fs = require('fs');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode} for ${url}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function test() {
  const ids = [
    { name: "3d_cinema_34997", id: 34997 },
    { name: "3d_image_34995", id: 34995 },
    { name: "superhero_36728", id: 36728 },
    { name: "spinning_top_8663", id: 8663 },
    { name: "tornado_5598", id: 5598 },
    { name: "zipline_28141", id: 28141 },
    { name: "zipline_36077", id: 36077 },
    { name: "splash_30979", id: 30979 },
    { name: "sprinkler_6915", id: 6915 },
    { name: "picnic_10236", id: 10236 },
    { name: "picnic_28361", id: 28361 },
    { name: "picnic_table_38415", id: 38415 },
    { name: "pond_39264", id: 39264 },
    { name: "roundabout_38554", id: 38554 },
    { name: "roundabout_4757", id: 4757 },
    { name: "lamp_post_2393", id: 2393 }
  ];

  for (const item of ids) {
    try {
      await download(`https://static.arasaac.org/pictograms/${item.id}/${item.id}_500.png`, `test_${item.name}.png`);
      console.log("Downloaded", item.name);
    } catch (e) {
      console.error("Error", item.name, e.message);
    }
  }
}

test();

