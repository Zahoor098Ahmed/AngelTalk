const https = require('https');
const fs = require('fs');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function run() {
  await download('https://static.arasaac.org/pictograms/3132/3132_500.png', 'test_museum_3132.png');
  await download('https://static.arasaac.org/pictograms/6566/6566_500.png', 'test_museum_6566.png');
  console.log("Downloaded 3132 and 6566!");
}

run();

