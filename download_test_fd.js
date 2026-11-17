const https = require('https');
const fs = require('fs');

async function downloadArasaac(id, filename) {
  return new Promise((resolve) => {
    https.get(`https://static.arasaac.org/pictograms/${id}/${id}_500.png`, (res) => {
      if (res.statusCode !== 200) return resolve(false);
      const f = fs.createWriteStream(filename);
      res.pipe(f);
      f.on('finish', () => { f.close(); resolve(true); });
    }).on('error', () => resolve(false));
  });
}

(async () => {
  const artDir = 'C:/Users/Zahoor/.gemini/antigravity/brain/df1543ec-f51c-462a-93bd-2beca8b87e59';
  // strawberry: 2400
  await downloadArasaac(2400, `${artDir}/arasaac_strawberry.png`);
  // orange juice: 2624
  await downloadArasaac(2624, `${artDir}/arasaac_orange_juice.png`);
  // coffee: 2296
  await downloadArasaac(2296, `${artDir}/arasaac_coffee.png`);
  // grapes: 3247
  await downloadArasaac(3247, `${artDir}/arasaac_grapes.png`);
  // water: 2816
  await downloadArasaac(2816, `${artDir}/arasaac_water.png`);
  console.log('Downloaded test arasaac images');
})();
