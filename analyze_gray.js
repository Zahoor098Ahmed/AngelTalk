const fs = require('fs');
const zlib = require('zlib');

const imgPath = "C:/Users/Zahoor/.gemini/antigravity/brain/df1543ec-f51c-462a-93bd-2beca8b87e59/.user_uploaded/media_1793866423007_cb0f9904.png";
const buf = fs.readFileSync(imgPath);

// Parse PNG chunks
let pos = 8;
const idatChunks = [];
let width = 0, height = 0, bitDepth = 0, colorType = 0;

while (pos < buf.length) {
  const len = buf.readUInt32BE(pos);
  const type = buf.toString('ascii', pos + 4, pos + 8);
  if (type === 'IHDR') {
    width = buf.readUInt32BE(pos + 8);
    height = buf.readUInt32BE(pos + 12);
    bitDepth = buf.readUInt8(pos + 16);
    colorType = buf.readUInt8(pos + 17);
    console.log({ width, height, bitDepth, colorType });
  } else if (type === 'IDAT') {
    idatChunks.push(buf.slice(pos + 8, pos + 8 + len));
  }
  pos += 12 + len;
}

const idat = Buffer.concat(idatChunks);
zlib.inflate(idat, (err, uncompressed) => {
  if (err) {
    console.error("Inflate err:", err);
    return;
  }
  console.log("Uncompressed len:", uncompressed.length);
  // Scan row by row at y = 100 to find x coordinates where color is NOT white (where gray starts and ends)
  // Assuming RGBA (colorType 6) or RGB (colorType 2)
  const bytesPerPixel = colorType === 6 ? 4 : colorType === 2 ? 3 : 4;
  const rowStride = 1 + width * bytesPerPixel;
  
  const y = 50;
  const rowStart = y * rowStride + 1;
  const colors = [];
  for (let x = 0; x < width; x += 10) {
    const idx = rowStart + x * bytesPerPixel;
    const r = uncompressed[idx];
    const g = uncompressed[idx+1];
    const b = uncompressed[idx+2];
    colors.push({ x, rgb: `${r},${g},${b}` });
  }
  console.log("Samples across width at y=50:");
  console.log(colors);
});

