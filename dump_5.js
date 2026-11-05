const fs = require('fs');

const p = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

const targets = ["temple", "store", "savannah", "plant room", "gurdwara"];

targets.forEach(w => {
  const val = p[w];
  if (val) {
    const ext = val.includes("png") ? "png" : val.includes("jpeg") ? "jpg" : "svg";
    const buf = val.includes("svg+xml;base64") 
      ? Buffer.from(val.replace("data:image/svg+xml;base64,", ""), 'base64')
      : Buffer.from(val.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    fs.writeFileSync(`inspect_${w.replace(/\s+/g, '_')}.${ext}`, buf);
    console.log(`Saved inspect_${w.replace(/\s+/g, '_')}.${ext} (size ${buf.length})`);
  } else {
    console.log(`${w} -> MISSING`);
  }
});

