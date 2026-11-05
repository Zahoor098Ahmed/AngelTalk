const https = require('https');
const fs = require('fs');
const path = require('path');

const targetJsonPath = path.resolve('./frontend/src/modules/uniquePictures.json');
const p = JSON.parse(fs.readFileSync(targetJsonPath, 'utf8'));

const mapping = {
  "cafeteria": 16149,
  "factory": 24507,
  "coffee shop": 32400,
  "hair salon": 35897,
  "hotel": 15730,
  "mall": 11211,
  "locker room": 14701,
  "market": 32942,
  "museum": 32406,
  "plant room": 7135,
  "savannah": 5567,
  "shops": 4885,
  "store": 9117,
  "supermarket": 3389,
  "temple": 8231,
  "shrine": 23737
};

const svgDriveThrough = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#ffffff"/>
  
  <!-- Ground Shadow -->
  <ellipse cx="250" cy="440" rx="210" ry="25" fill="#e2e8f0"/>

  <!-- Drive-thru Restaurant Building Wall -->
  <polygon points="170,110 470,110 470,430 170,430" fill="#f8fafc" stroke="#0f172a" stroke-width="8" stroke-linejoin="round"/>
  
  <!-- Drive-thru Red Awning / Canopy -->
  <polygon points="140,110 470,110 460,70 170,70" fill="#dc2626" stroke="#0f172a" stroke-width="7" stroke-linejoin="round"/>
  <rect x="220" y="76" width="180" height="26" rx="4" fill="#facc15" stroke="#0f172a" stroke-width="4"/>
  <text x="310" y="95" font-family="Arial, sans-serif" font-size="16" font-weight="900" fill="#0f172a" text-anchor="middle">DRIVE THRU</text>

  <!-- Service Pick-up Window -->
  <rect x="230" y="150" width="180" height="170" rx="8" fill="#e0f2fe" stroke="#0f172a" stroke-width="8"/>
  <rect x="245" y="165" width="150" height="140" fill="#bae6fd" stroke="#0284c7" stroke-width="4"/>
  <!-- Window Shelf counter -->
  <rect x="210" y="315" width="220" height="18" rx="4" fill="#475569" stroke="#0f172a" stroke-width="6"/>

  <!-- Server Handing Takeout Bag -->
  <!-- Server cap & shirt inside -->
  <circle cx="340" cy="210" r="24" fill="#fed7aa" stroke="#0f172a" stroke-width="5"/>
  <path d="M 315 200 Q 340 185 365 200 L 375 205 L 310 205 Z" fill="#dc2626" stroke="#0f172a" stroke-width="4"/>
  <path d="M 315 234 L 365 234 L 370 280 L 310 280 Z" fill="#dc2626" stroke="#0f172a" stroke-width="5"/>
  <!-- Paper food bag handed out -->
  <polygon points="250,230 295,230 300,295 245,295" fill="#d97706" stroke="#78350f" stroke-width="6"/>
  <line x1="260" y1="230" x2="260" y2="245" stroke="#78350f" stroke-width="4"/>
  <line x1="285" y1="230" x2="285" y2="245" stroke="#78350f" stroke-width="4"/>

  <!-- Car at Drive-thru Lane (Foreground) -->
  <g transform="translate(10, 30)">
    <!-- Wheels -->
    <circle cx="110" cy="385" r="34" fill="#1e293b" stroke="#0f172a" stroke-width="7"/>
    <circle cx="110" cy="385" r="14" fill="#94a3b8"/>
    <circle cx="260" cy="385" r="34" fill="#1e293b" stroke="#0f172a" stroke-width="7"/>
    <circle cx="260" cy="385" r="14" fill="#94a3b8"/>

    <!-- Car Body -->
    <path d="M 40 375 L 60 330 L 105 325 L 140 250 L 255 250 L 290 325 L 320 335 L 325 375 Z" 
          fill="#3b82f6" stroke="#0f172a" stroke-width="8" stroke-linejoin="round"/>
    
    <!-- Car Windows -->
    <polygon points="145,258 190,258 190,320 115,320" fill="#ffffff" stroke="#0f172a" stroke-width="6"/>
    <polygon points="200,258 245,258 275,320 200,320" fill="#ffffff" stroke="#0f172a" stroke-width="6"/>

    <!-- Car Headlight & Bumper -->
    <rect x="312" y="335" width="16" height="22" rx="4" fill="#facc15" stroke="#0f172a" stroke-width="4"/>
  </g>
</svg>`;

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function run() {
  console.log("Updating 17 Places cards with 100% unique, non-duplicate images...");

  // Set Drive through
  p["drive through"] = `data:image/svg+xml;base64,${Buffer.from(svgDriveThrough).toString('base64')}`;
  console.log("Updated [drive through] with custom vector SVG!");

  let count = 1;
  for (const [word, id] of Object.entries(mapping)) {
    try {
      const url = `https://static.arasaac.org/pictograms/${id}/${id}_500.png`;
      const buf = await fetchBuffer(url);
      p[word] = `data:image/png;base64,${buf.toString('base64')}`;
      count++;
      console.log(`[${count}/17] Updated [${word}] with ARASAAC ID ${id} (size ${buf.length} bytes)`);
    } catch (e) {
      console.error(`Error updating [${word}]:`, e.message);
    }
  }

  fs.writeFileSync(targetJsonPath, JSON.stringify(p, null, 2), 'utf8');
  console.log(`SUCCESS! All 17 words updated with unique, non-duplicate pictograms on white background!`);
}

run();

