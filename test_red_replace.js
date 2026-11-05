const https = require('https');
const fs = require('fs');
const { PNG } = require('./frontend/node_modules/pngjs');

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function testRedReplace() {
  const buf = await fetchBuffer('https://static.arasaac.org/pictograms/31670/31670_500.png');
  const png = PNG.sync.read(buf);

  let redCount = 0;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (png.width * y + x) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const a = png.data[idx + 3];

      // Detect red
      if (a > 30 && r > 150 && r > g * 1.5 && r > b * 1.5) {
        redCount++;
        // Replace with gentle calming soft pastel rose/coral (#f8a5a5)
        // Maintain the shading/luminosity:
        const factor = r / 255;
        png.data[idx] = Math.round(248 * factor);      // R: soft rose
        png.data[idx + 1] = Math.round(165 * factor);  // G: soft peach
        png.data[idx + 2] = Math.round(165 * factor);  // B: soft peach
      }
    }
  }

  console.log("Red pixels replaced in 31670:", redCount);
  const outBuf = PNG.sync.write(png);
  fs.writeFileSync("test_soft_it.png", outBuf);
  console.log("Saved test_soft_it.png!");
}

testRedReplace();

