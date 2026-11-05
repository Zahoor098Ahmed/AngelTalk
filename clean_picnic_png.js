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
  } else if (type === 'IDAT') {
    idatChunks.push(buf.slice(pos + 8, pos + 8 + len));
  }
  pos += 12 + len;
}

const idat = Buffer.concat(idatChunks);
const raw = zlib.inflateSync(idat);

const bytesPerPixel = colorType === 6 ? 4 : 3;
const stride = 1 + width * bytesPerPixel;

// Reconstruct scanlines
const pixels = Buffer.alloc(width * height * 4); // target RGBA

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

const prevRow = Buffer.alloc(width * bytesPerPixel);
const currRow = Buffer.alloc(width * bytesPerPixel);

for (let y = 0; y < height; y++) {
  const rowOffset = y * stride;
  const filter = raw[rowOffset];

  for (let i = 0; i < width * bytesPerPixel; i++) {
    const rawVal = raw[rowOffset + 1 + i];
    const a = i >= bytesPerPixel ? currRow[i - bytesPerPixel] : 0;
    const b = prevRow[i];
    const c = i >= bytesPerPixel ? prevRow[i - bytesPerPixel] : 0;

    let val = 0;
    if (filter === 0) val = rawVal;
    else if (filter === 1) val = (rawVal + a) & 0xff;
    else if (filter === 2) val = (rawVal + b) & 0xff;
    else if (filter === 3) val = (rawVal + Math.floor((a + b) / 2)) & 0xff;
    else if (filter === 4) val = (rawVal + paeth(a, b, c)) & 0xff;
    currRow[i] = val;
  }

  // Copy to RGBA buffer
  for (let x = 0; x < width; x++) {
    const srcIdx = x * bytesPerPixel;
    const destIdx = (y * width + x) * 4;
    const r = currRow[srcIdx];
    const g = currRow[srcIdx + 1];
    const b = currRow[srcIdx + 2];
    const a = colorType === 6 ? currRow[srcIdx + 3] : 255;

    pixels[destIdx] = r;
    pixels[destIdx + 1] = g;
    pixels[destIdx + 2] = b;
    pixels[destIdx + 3] = a;
  }

  currRow.copy(prevRow);
}

console.log("Successfully decoded all pixels! Checking sides:");
// Check color at x = 10, y = 100
const testIdx = (100 * width + 10) * 4;
console.log(`x=10, y=100: rgba(${pixels[testIdx]}, ${pixels[testIdx+1]}, ${pixels[testIdx+2]}, ${pixels[testIdx+3]})`);

// Check color at x = 200, y = 20 (background above heads)
const testIdx2 = (20 * width + 200) * 4;
console.log(`x=200, y=20: rgba(${pixels[testIdx2]}, ${pixels[testIdx2+1]}, ${pixels[testIdx2+2]}, ${pixels[testIdx2+3]})`);

// Now replace any gray sidebar pixels (x < 50 or x > 360) or any non-white background with PURE WHITE (255, 255, 255, 255)
// Notice the gray sidebar color has r ≈ g ≈ b around 230-248, or we can just flood fill from corners or clean x < 55 and x > 355!
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    // If on left bar (x < 55) or right bar (x > 355):
    if (x < 55 || x > 355) {
      pixels[idx] = 255;
      pixels[idx + 1] = 255;
      pixels[idx + 2] = 255;
      pixels[idx + 3] = 255;
    }
  }
}

// Build clean PNG using filter 0 (None)
const newStride = 1 + width * 4;
const newRaw = Buffer.alloc(height * newStride);
for (let y = 0; y < height; y++) {
  newRaw[y * newStride] = 0; // filter None
  pixels.copy(newRaw, y * newStride + 1, y * width * 4, (y + 1) * width * 4);
}

const newIdatData = zlib.deflateSync(newRaw);

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  typeBuf.copy(chunk, 4);
  data.copy(chunk, 8);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// IHDR data
const ihdrData = Buffer.alloc(13);
ihdrData.writeUInt32BE(width, 0);
ihdrData.writeUInt32BE(height, 4);
ihdrData.writeUInt8(8, 8); // bit depth 8
ihdrData.writeUInt8(6, 9); // RGBA
ihdrData.writeUInt8(0, 10); // compression
ihdrData.writeUInt8(0, 11); // filter
ihdrData.writeUInt8(0, 12); // interlace

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const cleanPng = Buffer.concat([
  pngSignature,
  makeChunk('IHDR', ihdrData),
  makeChunk('IDAT', newIdatData),
  makeChunk('IEND', Buffer.alloc(0))
]);

fs.writeFileSync('clean_picnic_family.png', cleanPng);
console.log("Wrote clean_picnic_family.png! Size:", cleanPng.length);

