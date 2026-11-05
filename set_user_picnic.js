const fs = require('fs');
const path = require('path');

const imgPath = "C:/Users/Zahoor/.gemini/antigravity/brain/df1543ec-f51c-462a-93bd-2beca8b87e59/.user_uploaded/media_1793866423007_cb0f9904.png";
const targetJsonPath = path.resolve('./frontend/src/modules/uniquePictures.json');

const p = JSON.parse(fs.readFileSync(targetJsonPath, 'utf8'));

if (!fs.existsSync(imgPath)) {
  console.error("Image file not found:", imgPath);
  process.exit(1);
}

const buf = fs.readFileSync(imgPath);
const b64 = `data:image/png;base64,${buf.toString('base64')}`;

p["picnic"] = b64;

fs.writeFileSync(targetJsonPath, JSON.stringify(p, null, 2), 'utf8');

console.log("Successfully set picnic to user's 2nd uploaded image! Base64 length:", b64.length);

