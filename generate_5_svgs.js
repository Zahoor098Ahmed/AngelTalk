const fs = require('fs');

// 1. GURDWARA: Authentic Sikh Gurdwara with golden dome and Nishan Sahib flag on pure white
const svgGurdwara = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#ffffff"/>
  
  <!-- Ground soft shadow -->
  <ellipse cx="250" cy="445" rx="195" ry="20" fill="#cbd5e1" opacity="0.6"/>

  <!-- Main Gurdwara Building Structure (White Marble & Gold) -->
  <!-- Base Plinth -->
  <polygon points="75,440 425,440 405,405 95,405" fill="#e2e8f0" stroke="#0f172a" stroke-width="7" stroke-linejoin="round"/>
  <!-- Front Steps -->
  <polygon points="195,440 305,440 295,410 205,410" fill="#f8fafc" stroke="#0f172a" stroke-width="5"/>

  <!-- Main Lower Building Body -->
  <rect x="95" y="270" width="310" height="135" rx="6" fill="#ffffff" stroke="#0f172a" stroke-width="8"/>
  <rect x="110" y="280" width="280" height="14" fill="#fef08a" stroke="#ca8a04" stroke-width="4"/>

  <!-- Central Arched Grand Entrance (Darshani Deorhi) -->
  <path d="M 205 405 L 205 320 C 205 285 295 285 295 320 L 295 405 Z" 
        fill="#1e293b" stroke="#0f172a" stroke-width="7"/>
  <!-- Gold inner arch framing -->
  <path d="M 215 405 L 215 325 C 215 300 285 300 285 325 L 285 405 Z" 
        fill="#facc15" stroke="#ca8a04" stroke-width="4"/>
  <!-- Doorway dark interior -->
  <path d="M 225 405 L 225 330 C 225 315 275 315 275 330 L 275 405 Z" fill="#0f172a"/>

  <!-- Side Windows (Jharokha Arched Windows) -->
  <path d="M 125 365 L 125 320 C 125 305 170 305 170 320 L 170 365 Z" fill="#fef08a" stroke="#0f172a" stroke-width="6"/>
  <line x1="147" y1="308" x2="147" y2="365" stroke="#0f172a" stroke-width="4"/>
  <path d="M 330 365 L 330 320 C 330 305 375 305 375 320 L 375 365 Z" fill="#fef08a" stroke="#0f172a" stroke-width="6"/>
  <line x1="352" y1="308" x2="352" y2="365" stroke="#0f172a" stroke-width="4"/>

  <!-- Upper Story / Terrace -->
  <rect x="145" y="195" width="210" height="75" rx="4" fill="#f8fafc" stroke="#0f172a" stroke-width="7"/>
  <!-- Parapet / Jali railing -->
  <rect x="135" y="255" width="230" height="15" fill="#facc15" stroke="#ca8a04" stroke-width="4"/>
  <!-- Upper central arched window -->
  <path d="M 225 255 L 225 220 C 225 210 275 210 275 220 L 275 255 Z" fill="#38bdf8" stroke="#0f172a" stroke-width="5"/>

  <!-- Corner Cupolas / Chhatris with mini golden domes -->
  <!-- Left Chhatri -->
  <rect x="115" y="210" width="24" height="45" fill="#ffffff" stroke="#0f172a" stroke-width="5"/>
  <path d="M 110 210 C 110 185 144 185 144 210 Z" fill="#facc15" stroke="#ca8a04" stroke-width="5"/>
  <line x1="127" y1="185" x2="127" y2="175" stroke="#ca8a04" stroke-width="3"/>
  <circle cx="127" cy="175" r="3" fill="#ca8a04"/>

  <!-- Right Chhatri -->
  <rect x="361" y="210" width="24" height="45" fill="#ffffff" stroke="#0f172a" stroke-width="5"/>
  <path d="M 356 210 C 356 185 390 185 390 210 Z" fill="#facc15" stroke="#ca8a04" stroke-width="5"/>
  <line x1="373" y1="185" x2="373" y2="175" stroke="#ca8a04" stroke-width="3"/>
  <circle cx="373" cy="175" r="3" fill="#ca8a04"/>

  <!-- Central Magnificent Golden Fluted Dome (Gumbad) -->
  <!-- Dome Base Drum -->
  <rect x="195" y="175" width="110" height="20" fill="#fde047" stroke="#ca8a04" stroke-width="5"/>
  <!-- Onion/Fluted Dome Curve -->
  <path d="M 190 175 C 180 120 220 90 250 80 C 280 90 320 120 310 175 Z" 
        fill="#facc15" stroke="#ca8a04" stroke-width="8" stroke-linejoin="round"/>
  <!-- Dome flute highlights -->
  <path d="M 230 175 C 225 130 240 100 250 80" stroke="#fef08a" stroke-width="4" fill="none"/>
  <path d="M 270 175 C 275 130 260 100 250 80" stroke="#f59e0b" stroke-width="4" fill="none"/>
  <!-- Golden Finial (Kalash) -->
  <line x1="250" y1="80" x2="250" y2="50" stroke="#ca8a04" stroke-width="6" stroke-linecap="round"/>
  <circle cx="250" cy="50" r="7" fill="#facc15" stroke="#ca8a04" stroke-width="4"/>
  <line x1="250" y1="45" x2="250" y2="35" stroke="#ca8a04" stroke-width="4" stroke-linecap="round"/>

  <!-- Saffron Nishan Sahib Flag Mast (Iconic Sikh Symbol) -->
  <!-- Mast pole -->
  <line x1="70" y1="440" x2="70" y2="60" stroke="#f97316" stroke-width="7" stroke-linecap="round"/>
  <!-- Triangular Saffron Flag -->
  <polygon points="70,65 140,95 70,125" fill="#ea580c" stroke="#c2410c" stroke-width="4"/>
  <!-- Khanda symbol silhouette on flag -->
  <circle cx="92" cy="95" r="7" fill="#facc15"/>
  <line x1="92" y1="80" x2="92" y2="110" stroke="#facc15" stroke-width="3"/>
</svg>`;

// 2. TEMPLE: Traditional Mandir / Sacred Eastern Temple with Shikhara and Kalash on pure white
const svgTemple = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#ffffff"/>
  
  <!-- Ground soft shadow -->
  <ellipse cx="250" cy="450" rx="190" ry="20" fill="#cbd5e1" opacity="0.6"/>

  <!-- Temple Plinth / Foundation Steps -->
  <polygon points="70,445 430,445 410,410 90,410" fill="#f97316" stroke="#0f172a" stroke-width="7" stroke-linejoin="round"/>
  <polygon points="100,410 400,410 385,385 115,385" fill="#fb923c" stroke="#0f172a" stroke-width="6" stroke-linejoin="round"/>
  <!-- Center steps -->
  <polygon points="195,445 305,445 295,385 205,385" fill="#fef08a" stroke="#0f172a" stroke-width="5"/>

  <!-- Mandapa (Main Temple Hall & Pillars) -->
  <rect x="115" y="275" width="270" height="110" fill="#fff7ed" stroke="#0f172a" stroke-width="7"/>
  
  <!-- Ornate Carved Pillars -->
  <rect x="130" y="280" width="22" height="105" rx="3" fill="#ea580c" stroke="#0f172a" stroke-width="5"/>
  <rect x="185" y="280" width="22" height="105" rx="3" fill="#ea580c" stroke="#0f172a" stroke-width="5"/>
  <rect x="293" y="280" width="22" height="105" rx="3" fill="#ea580c" stroke="#0f172a" stroke-width="5"/>
  <rect x="348" y="280" width="22" height="105" rx="3" fill="#ea580c" stroke="#0f172a" stroke-width="5"/>

  <!-- Sanctum Archway Entrance with Temple Bell -->
  <path d="M 215 385 L 215 305 C 215 280 285 280 285 305 L 285 385 Z" fill="#facc15" stroke="#0f172a" stroke-width="6"/>
  <path d="M 225 385 L 225 315 C 225 295 275 295 275 315 L 275 385 Z" fill="#7c2d12"/>
  <!-- Brass Temple Bell hanging in arch -->
  <line x1="250" y1="285" x2="250" y2="305" stroke="#facc15" stroke-width="4"/>
  <path d="M 240 318 L 260 318 L 255 305 L 245 305 Z" fill="#eab308" stroke="#0f172a" stroke-width="3"/>
  <circle cx="250" cy="322" r="3" fill="#ca8a04"/>

  <!-- Tiered Shikhara / Sacred Spire -->
  <!-- Level 1 (Wide base above hall) -->
  <polygon points="125,275 375,275 350,225 150,225" fill="#f97316" stroke="#0f172a" stroke-width="7" stroke-linejoin="round"/>
  <!-- Level 2 -->
  <polygon points="160,225 340,225 320,175 180,175" fill="#ea580c" stroke="#0f172a" stroke-width="7" stroke-linejoin="round"/>
  <!-- Level 3 -->
  <polygon points="190,175 310,175 290,125 210,125" fill="#f97316" stroke="#0f172a" stroke-width="7" stroke-linejoin="round"/>
  <!-- Top Spire Pyramid -->
  <polygon points="215,125 285,125 250,75" fill="#ea580c" stroke="#0f172a" stroke-width="7" stroke-linejoin="round"/>

  <!-- Amalaka (Fluted stone disc) -->
  <ellipse cx="250" cy="72" rx="28" ry="12" fill="#facc15" stroke="#0f172a" stroke-width="5"/>
  <!-- Golden Kalash Urn Finial -->
  <circle cx="250" cy="55" r="10" fill="#facc15" stroke="#ca8a04" stroke-width="4"/>
  <line x1="250" y1="45" x2="250" y2="30" stroke="#ca8a04" stroke-width="5" stroke-linecap="round"/>

  <!-- Saffron Temple Pennant Flag -->
  <polygon points="252,32 305,45 252,58" fill="#ef4444" stroke="#b91c1c" stroke-width="3"/>
</svg>`;

// 3. STORE: Vibrant, classic storefront on pure white with awning, display windows and door
const svgStore = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#ffffff"/>
  
  <!-- Ground soft shadow -->
  <ellipse cx="250" cy="445" rx="195" ry="20" fill="#cbd5e1" opacity="0.6"/>

  <!-- Store Building Body -->
  <rect x="85" y="140" width="330" height="295" rx="6" fill="#f8fafc" stroke="#0f172a" stroke-width="8" stroke-linejoin="round"/>

  <!-- Store Roof Parapet & Signboard -->
  <rect x="75" y="80" width="350" height="60" rx="6" fill="#1e293b" stroke="#0f172a" stroke-width="8"/>
  <rect x="90" y="90" width="320" height="40" rx="4" fill="#0284c7" stroke="#38bdf8" stroke-width="3"/>
  <text x="250" y="118" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="4">STORE</text>

  <!-- Red-and-White Striped Awning -->
  <defs>
    <pattern id="awningStripes" width="50" height="60" patternUnits="userSpaceOnUse">
      <rect width="25" height="60" fill="#ef4444"/>
      <rect x="25" width="25" height="60" fill="#ffffff"/>
    </pattern>
  </defs>
  <polygon points="65,185 435,185 410,140 90,140" fill="url(#awningStripes)" stroke="#0f172a" stroke-width="8" stroke-linejoin="round"/>
  <!-- Scalloped Awning Valance -->
  <path d="M 65 185 Q 85 205 105 185 Q 125 205 145 185 Q 165 205 185 185 Q 205 205 225 185 Q 245 205 265 185 Q 285 205 305 185 Q 325 205 345 185 Q 365 205 385 185 Q 405 205 435 185" 
        stroke="#0f172a" stroke-width="6" fill="none"/>

  <!-- Left Display Showcase Window -->
  <rect x="110" y="235" width="135" height="155" rx="6" fill="#e0f2fe" stroke="#0f172a" stroke-width="7"/>
  <rect x="120" y="245" width="115" height="90" fill="#bae6fd" stroke="#0284c7" stroke-width="3"/>
  <!-- Goods in window: apples, basket, bread -->
  <rect x="115" y="340" width="125" height="45" fill="#f1f5f9" stroke="#0f172a" stroke-width="4"/>
  <circle cx="145" cy="325" r="14" fill="#ef4444" stroke="#991b1b" stroke-width="3"/>
  <circle cx="170" cy="325" r="14" fill="#22c55e" stroke="#15803d" stroke-width="3"/>
  <circle cx="195" cy="323" r="15" fill="#facc15" stroke="#ca8a04" stroke-width="3"/>

  <!-- Glass Entrance Door -->
  <rect x="275" y="235" width="115" height="195" rx="4" fill="#ffffff" stroke="#0f172a" stroke-width="7"/>
  <!-- Door Glass Pane -->
  <rect x="290" y="250" width="85" height="110" fill="#e0f2fe" stroke="#0f172a" stroke-width="5"/>
  <!-- OPEN Sign on door -->
  <rect x="305" y="270" width="55" height="26" rx="4" fill="#22c55e" stroke="#15803d" stroke-width="3"/>
  <text x="332" y="288" font-family="Arial, sans-serif" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">OPEN</text>
  <!-- Door Handle -->
  <rect x="365" y="335" width="8" height="35" rx="3" fill="#ca8a04" stroke="#0f172a" stroke-width="3"/>
</svg>`;

// 4. PLANT ROOM: Bright, sunlit botanical solarium / plant room on pure white with zero green ground blocks
const svgPlantRoom = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#ffffff"/>
  
  <!-- Ground soft shadow -->
  <ellipse cx="250" cy="450" rx="195" ry="22" fill="#cbd5e1" opacity="0.6"/>

  <!-- Modern Glass Greenhouse / Solarium Frame -->
  <!-- Glass Panels Fill -->
  <polygon points="90,430 410,430 380,210 250,110 120,210" fill="#e0f2fe" fill-opacity="0.85" stroke="#0f172a" stroke-width="8" stroke-linejoin="round"/>

  <!-- Roof Beams & Mullions -->
  <line x1="250" y1="110" x2="250" y2="430" stroke="#0f172a" stroke-width="7"/>
  <line x1="120" y1="210" x2="380" y2="210" stroke="#0f172a" stroke-width="7"/>
  <line x1="185" y1="160" x2="185" y2="430" stroke="#0f172a" stroke-width="6"/>
  <line x1="315" y1="160" x2="315" y2="430" stroke="#0f172a" stroke-width="6"/>

  <!-- Hanging Flower Baskets from ceiling -->
  <!-- Left Basket -->
  <line x1="185" y1="160" x2="185" y2="200" stroke="#64748b" stroke-width="3"/>
  <path d="M 170 200 C 170 220 200 220 200 200 Z" fill="#b45309" stroke="#0f172a" stroke-width="4"/>
  <!-- Trailing vines & flowers -->
  <circle cx="178" cy="195" r="7" fill="#ec4899"/>
  <circle cx="192" cy="195" r="7" fill="#f43f5e"/>
  <circle cx="185" cy="190" r="8" fill="#fb7185"/>

  <!-- Right Basket -->
  <line x1="315" y1="160" x2="315" y2="200" stroke="#64748b" stroke-width="3"/>
  <path d="M 300 200 C 300 220 330 220 330 200 Z" fill="#b45309" stroke="#0f172a" stroke-width="4"/>
  <circle cx="308" cy="195" r="7" fill="#a855f7"/>
  <circle cx="322" cy="195" r="7" fill="#3b82f6"/>
  <circle cx="315" cy="190" r="8" fill="#c084fc"/>

  <!-- Multi-Tier Plant Shelves with Potted Plants inside -->
  <!-- Big Monstera / Palm in center -->
  <g transform="translate(250, 415)">
    <!-- Terracotta Pot -->
    <polygon points="-35,0 35,0 28,-50 -28,-50" fill="#d97706" stroke="#0f172a" stroke-width="6"/>
    <!-- Lush Tropical Monstera Leaves -->
    <path d="M 0,-50 Q -50,-100 -70,-80 Q -60,-60 0,-50" fill="#15803d" stroke="#0f172a" stroke-width="5"/>
    <path d="M 0,-50 Q 50,-100 70,-80 Q 60,-60 0,-50" fill="#15803d" stroke="#0f172a" stroke-width="5"/>
    <path d="M 0,-50 Q -30,-140 0,-150 Q 30,-140 0,-50" fill="#16a34a" stroke="#0f172a" stroke-width="5"/>
    <path d="M 0,-50 Q -60,-120 -35,-130" stroke="#0f172a" stroke-width="3" fill="none"/>
    <path d="M 0,-50 Q 60,-120 35,-130" stroke="#0f172a" stroke-width="3" fill="none"/>
  </g>

  <!-- Left Flower Pots (Sunflowers / Ferns) -->
  <g transform="translate(145, 420)">
    <polygon points="-25,0 25,0 20,-35 -20,-35" fill="#ea580c" stroke="#0f172a" stroke-width="5"/>
    <!-- Green fern foliage -->
    <path d="M 0,-35 C -35,-60 -20,-80 0,-35" fill="#22c55e" stroke="#0f172a" stroke-width="4"/>
    <path d="M 0,-35 C 35,-60 20,-80 0,-35" fill="#22c55e" stroke="#0f172a" stroke-width="4"/>
    <circle cx="0" cy="-60" r="10" fill="#facc15" stroke="#ca8a04" stroke-width="3"/>
  </g>

  <!-- Right Plant Pot + Watering Can -->
  <g transform="translate(355, 420)">
    <!-- Pot -->
    <polygon points="-25,0 25,0 20,-35 -20,-35" fill="#b45309" stroke="#0f172a" stroke-width="5"/>
    <!-- Cactus / Succulent -->
    <path d="M 0,-35 L 0,-80 C -15,-80 -15,-35 0,-35" fill="#15803d" stroke="#0f172a" stroke-width="4"/>
    <path d="M 0,-35 L 0,-80 C 15,-80 15,-35 0,-35" fill="#16a34a" stroke="#0f172a" stroke-width="4"/>
  </g>

  <!-- Bright Blue Watering Can (Forefront right) -->
  <g transform="translate(305, 415)">
    <rect x="-15" y="-20" width="30" height="20" rx="3" fill="#0284c7" stroke="#0f172a" stroke-width="4"/>
    <path d="M -15,-15 Q -25,-10 -20,0" stroke="#0f172a" stroke-width="4" fill="none"/>
    <line x1="15" y1="-10" x2="30" y2="-20" stroke="#0f172a" stroke-width="4"/>
  </g>
</svg>`;

// 5. SAVANNAH: True African Savannah symbol floating on pure white background (No blue box, no orange box)
const svgSavannah = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#ffffff"/>
  
  <!-- Subtle warm ground baseline on pure white -->
  <ellipse cx="250" cy="430" rx="205" ry="24" fill="#fed7aa" opacity="0.6"/>
  <path d="M 60 430 Q 150 422 250 430 Q 350 438 440 430" stroke="#ea580c" stroke-width="6" stroke-linecap="round" fill="none"/>

  <!-- Golden Savanna Grass Tufts -->
  <path d="M 120 430 L 115 405 M 125 430 L 128 400 M 130 430 L 138 410" stroke="#d97706" stroke-width="5" stroke-linecap="round"/>
  <path d="M 370 430 L 365 405 M 375 430 L 378 395 M 382 430 L 390 410" stroke="#d97706" stroke-width="5" stroke-linecap="round"/>
  <path d="M 230 435 L 225 415 M 235 435 L 240 410" stroke="#d97706" stroke-width="4" stroke-linecap="round"/>

  <!-- Iconic Flat-Topped African Acacia Tortilis Tree -->
  <!-- Tree Trunk & Gnarled Branches -->
  <g stroke="#3f2314" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
    <!-- Main gnarled trunk -->
    <path d="M 195 425 Q 190 350 205 300 Q 215 260 210 220" fill="none" stroke-width="16"/>
    <!-- Trunk highlight -->
    <path d="M 195 425 Q 190 350 205 300 Q 215 260 210 220" fill="none" stroke="#78350f" stroke-width="10"/>

    <!-- Left main branch spreading out horizontally -->
    <path d="M 205 280 Q 155 240 120 200" fill="none" stroke-width="11"/>
    <path d="M 160 245 Q 120 225 90 210" fill="none" stroke-width="7"/>

    <!-- Center/Right branch spreading high -->
    <path d="M 210 230 Q 255 190 310 170" fill="none" stroke-width="11"/>
    <path d="M 260 200 Q 295 180 345 160" fill="none" stroke-width="8"/>
    <path d="M 210 220 Q 215 170 235 150" fill="none" stroke-width="8"/>
  </g>

  <!-- Broad, Flat Horizontal Canopy Leaf Clusters (Umbrella Tree silhouette) -->
  <!-- Main upper flat canopy -->
  <ellipse cx="230" cy="140" rx="140" ry="32" fill="#2d5016" stroke="#0f172a" stroke-width="8"/>
  <ellipse cx="230" cy="135" rx="125" ry="25" fill="#3f6c20"/>

  <!-- Left secondary flat canopy -->
  <ellipse cx="115" cy="195" rx="75" ry="24" fill="#2d5016" stroke="#0f172a" stroke-width="7"/>
  <ellipse cx="115" cy="192" rx="65" ry="18" fill="#3f6c20"/>

  <!-- Right extended flat canopy -->
  <ellipse cx="325" cy="155" rx="95" ry="28" fill="#2d5016" stroke="#0f172a" stroke-width="7"/>
  <ellipse cx="325" cy="152" rx="85" ry="20" fill="#3f6c20"/>

  <!-- Elegant African Giraffe in the Savannah -->
  <g transform="translate(315, 230)">
    <!-- Legs -->
    <line x1="25" y1="130" x2="25" y2="195" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
    <line x1="38" y1="130" x2="38" y2="195" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
    <line x1="65" y1="130" x2="65" y2="195" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
    <line x1="75" y1="130" x2="75" y2="195" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
    <!-- Tail -->
    <path d="M 80 120 Q 90 145 85 165" stroke="#0f172a" stroke-width="4" fill="none"/>
    <circle cx="85" cy="165" r="4" fill="#0f172a"/>

    <!-- Body -->
    <ellipse cx="50" cy="120" rx="35" ry="22" fill="#f59e0b" stroke="#0f172a" stroke-width="7"/>

    <!-- Long Graceful Neck -->
    <path d="M 22 115 L 0 25 L 18 20 L 38 105 Z" fill="#f59e0b" stroke="#0f172a" stroke-width="6"/>

    <!-- Head and Ossicones (Horns) -->
    <ellipse cx="5" cy="22" rx="14" ry="9" fill="#f59e0b" stroke="#0f172a" stroke-width="5"/>
    <circle cx="2" cy="19" r="2.5" fill="#0f172a"/>
    <line x1="7" y1="16" x2="8" y2="9" stroke="#0f172a" stroke-width="4"/>
    <circle cx="8" cy="8" r="3" fill="#78350f"/>
    <!-- Mane -->
    <path d="M 18 24 L 38 105" stroke="#78350f" stroke-width="5" stroke-dasharray="4,4"/>

    <!-- Distinctive Giraffe Spots -->
    <circle cx="12" cy="45" r="5" fill="#9a3412"/>
    <circle cx="18" cy="70" r="6" fill="#9a3412"/>
    <circle cx="25" cy="95" r="7" fill="#9a3412"/>
    <circle cx="42" cy="118" r="8" fill="#9a3412"/>
    <circle cx="62" cy="118" r="7" fill="#9a3412"/>
    <circle cx="52" cy="130" r="6" fill="#9a3412"/>
  </g>
</svg>`;

fs.writeFileSync('svg_gurdwara.svg', svgGurdwara, 'utf8');
fs.writeFileSync('svg_temple.svg', svgTemple, 'utf8');
fs.writeFileSync('svg_store.svg', svgStore, 'utf8');
fs.writeFileSync('svg_plant_room.svg', svgPlantRoom, 'utf8');
fs.writeFileSync('svg_savannah.svg', svgSavannah, 'utf8');

console.log("Successfully generated all 5 SVGs with pure white background!");

