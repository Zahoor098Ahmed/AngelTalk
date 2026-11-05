const fs = require('fs');

const imgPath = "C:/Users/Zahoor/.gemini/antigravity/brain/df1543ec-f51c-462a-93bd-2beca8b87e59/.user_uploaded/media_1793866423007_cb0f9904.png";
const buf = fs.readFileSync(imgPath);

// Let's inspect PNG header:
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);
console.log(`Image size: ${width}x${height}`);

