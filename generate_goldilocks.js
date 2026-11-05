const fs = require('fs');

// GOLDILOCKS AND THE THREE BEARS SVG:
// Goldilocks (blonde pigtails) + 3 Bears (Papa Bear, Mama Bear, Baby Bear) on pure solid white background
const svgGoldilocks3Bears = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#ffffff"/>
  
  <!-- Subtle ground shadow -->
  <ellipse cx="250" cy="450" rx="220" ry="20" fill="#e2e8f0"/>

  <!-- Character 1: Goldilocks (Left side) -->
  <g transform="translate(15, 60)">
    <!-- Legs / Green Pants -->
    <path d="M 50 300 L 45 385 L 62 385 L 68 300 Z" fill="#84cc16" stroke="#0f172a" stroke-width="6" stroke-linejoin="round"/>
    <path d="M 72 300 L 78 385 L 95 385 L 90 300 Z" fill="#84cc16" stroke="#0f172a" stroke-width="6" stroke-linejoin="round"/>
    <!-- Shoes -->
    <ellipse cx="53" cy="385" rx="12" ry="7" fill="#1e293b"/>
    <ellipse cx="87" cy="385" rx="12" ry="7" fill="#1e293b"/>

    <!-- Red Sweater / Torso -->
    <path d="M 40 180 L 100 180 L 105 300 L 35 300 Z" fill="#ef4444" stroke="#0f172a" stroke-width="7" stroke-linejoin="round"/>
    
    <!-- Arms -->
    <path d="M 40 180 L 22 265 L 35 268 L 50 200 Z" fill="#ef4444" stroke="#0f172a" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="28" cy="272" r="8" fill="#fed7aa" stroke="#0f172a" stroke-width="4"/>
    <path d="M 100 180 L 118 265 L 105 268 L 90 200 Z" fill="#ef4444" stroke="#0f172a" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="112" cy="272" r="8" fill="#fed7aa" stroke="#0f172a" stroke-width="4"/>

    <!-- Head -->
    <ellipse cx="70" cy="140" rx="26" ry="28" fill="#fed7aa" stroke="#0f172a" stroke-width="6"/>
    <!-- Face: eyes and smile -->
    <circle cx="61" cy="135" r="3.5" fill="#0f172a"/>
    <circle cx="79" cy="135" r="3.5" fill="#0f172a"/>
    <path d="M 63 150 Q 70 158 77 150" stroke="#0f172a" stroke-width="4" stroke-linecap="round" fill="none"/>

    <!-- Golden Blonde Hair with Pigtails -->
    <!-- Bangs / Main Hair -->
    <path d="M 44 135 C 44 95 96 95 96 135 C 90 120 70 120 44 135 Z" fill="#facc15" stroke="#0f172a" stroke-width="6"/>
    <!-- Left Pigtail & Ribbon -->
    <path d="M 46 125 C 28 120 25 155 42 165 C 32 185 52 180 50 160 Z" fill="#facc15" stroke="#0f172a" stroke-width="5"/>
    <circle cx="48" cy="135" r="5" fill="#3b82f6"/>
    <!-- Right Pigtail & Ribbon -->
    <path d="M 94 125 C 112 120 115 155 98 165 C 108 185 88 180 90 160 Z" fill="#facc15" stroke="#0f172a" stroke-width="5"/>
    <circle cx="92" cy="135" r="5" fill="#3b82f6"/>
  </g>

  <!-- Bear Helper Function Template rendered in SVG -->
  <!-- Character 2: Big Papa Bear (Center-Left) -->
  <g transform="translate(145, 145) scale(0.95)">
    <!-- Back legs -->
    <rect x="55" y="210" width="22" height="70" rx="8" fill="#92400e" stroke="#0f172a" stroke-width="6"/>
    <rect x="155" y="210" width="22" height="70" rx="8" fill="#92400e" stroke="#0f172a" stroke-width="6"/>
    <!-- Main Body -->
    <ellipse cx="115" cy="175" rx="75" ry="55" fill="#b45309" stroke="#0f172a" stroke-width="8"/>
    <!-- Tail -->
    <circle cx="38" cy="155" r="12" fill="#b45309" stroke="#0f172a" stroke-width="6"/>
    <!-- Front legs -->
    <rect x="75" y="210" width="24" height="75" rx="8" fill="#b45309" stroke="#0f172a" stroke-width="7"/>
    <rect x="175" y="210" width="24" height="75" rx="8" fill="#b45309" stroke="#0f172a" stroke-width="7"/>
    <!-- Neck & Head -->
    <path d="M 160 145 C 180 120 215 125 225 150 C 235 170 205 195 180 190 Z" fill="#b45309" stroke="#0f172a" stroke-width="8"/>
    <!-- Snout / Muzzle -->
    <ellipse cx="228" cy="158" rx="14" ry="10" fill="#d97706" stroke="#0f172a" stroke-width="5"/>
    <circle cx="236" cy="155" r="4" fill="#0f172a"/>
    <!-- Eye & Ear -->
    <circle cx="205" cy="142" r="3.5" fill="#0f172a"/>
    <circle cx="188" cy="125" r="9" fill="#b45309" stroke="#0f172a" stroke-width="5"/>
    <circle cx="188" cy="125" r="4" fill="#d97706"/>
  </g>

  <!-- Character 3: Medium Mama Bear (Center-Right) -->
  <g transform="translate(285, 205) scale(0.72)">
    <!-- Back legs -->
    <rect x="55" y="210" width="22" height="70" rx="8" fill="#a16207" stroke="#0f172a" stroke-width="6"/>
    <rect x="155" y="210" width="22" height="70" rx="8" fill="#a16207" stroke="#0f172a" stroke-width="6"/>
    <!-- Main Body -->
    <ellipse cx="115" cy="175" rx="70" ry="50" fill="#ca8a04" stroke="#0f172a" stroke-width="8"/>
    <!-- Tail -->
    <circle cx="42" cy="155" r="11" fill="#ca8a04" stroke="#0f172a" stroke-width="6"/>
    <!-- Front legs -->
    <rect x="75" y="210" width="22" height="75" rx="8" fill="#ca8a04" stroke="#0f172a" stroke-width="7"/>
    <rect x="175" y="210" width="22" height="75" rx="8" fill="#ca8a04" stroke="#0f172a" stroke-width="7"/>
    <!-- Neck & Head -->
    <path d="M 160 145 C 180 120 215 125 225 150 C 235 170 205 195 180 190 Z" fill="#ca8a04" stroke="#0f172a" stroke-width="8"/>
    <!-- Snout / Muzzle -->
    <ellipse cx="228" cy="158" rx="13" ry="9" fill="#eab308" stroke="#0f172a" stroke-width="5"/>
    <circle cx="236" cy="155" r="3.5" fill="#0f172a"/>
    <!-- Eye & Ear -->
    <circle cx="205" cy="142" r="3.5" fill="#0f172a"/>
    <circle cx="188" cy="125" r="8" fill="#ca8a04" stroke="#0f172a" stroke-width="5"/>
  </g>

  <!-- Character 4: Cute Little Baby Bear (Far Right) -->
  <g transform="translate(390, 265) scale(0.48)">
    <!-- Back legs -->
    <rect x="55" y="210" width="24" height="65" rx="8" fill="#b45309" stroke="#0f172a" stroke-width="7"/>
    <rect x="155" y="210" width="24" height="65" rx="8" fill="#b45309" stroke="#0f172a" stroke-width="7"/>
    <!-- Main Body -->
    <ellipse cx="115" cy="175" rx="65" ry="48" fill="#d97706" stroke="#0f172a" stroke-width="9"/>
    <!-- Tail -->
    <circle cx="48" cy="155" r="10" fill="#d97706" stroke="#0f172a" stroke-width="6"/>
    <!-- Front legs -->
    <rect x="75" y="210" width="24" height="70" rx="8" fill="#d97706" stroke="#0f172a" stroke-width="8"/>
    <rect x="175" y="210" width="24" height="70" rx="8" fill="#d97706" stroke="#0f172a" stroke-width="8"/>
    <!-- Neck & Head -->
    <path d="M 160 145 C 180 120 215 125 225 150 C 235 170 205 195 180 190 Z" fill="#d97706" stroke="#0f172a" stroke-width="9"/>
    <!-- Snout / Muzzle -->
    <ellipse cx="228" cy="158" rx="14" ry="10" fill="#fde047" stroke="#0f172a" stroke-width="6"/>
    <circle cx="236" cy="155" r="4" fill="#0f172a"/>
    <!-- Eye & Ear -->
    <circle cx="205" cy="142" r="4" fill="#0f172a"/>
    <circle cx="188" cy="125" r="10" fill="#d97706" stroke="#0f172a" stroke-width="6"/>
  </g>
</svg>`;

fs.writeFileSync('svg_goldilocks_3_bears.svg', svgGoldilocks3Bears, 'utf8');
console.log("Created svg_goldilocks_3_bears.svg!");

