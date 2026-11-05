const fs = require('fs');

// 1. GAZEBO: Park wooden garden pavilion / gazebo on pure solid white background
const svgGazebo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#ffffff"/>
  
  <!-- Ground soft shadow -->
  <ellipse cx="250" cy="445" rx="190" ry="22" fill="#cbd5e1" opacity="0.6"/>

  <!-- Gazebo Base / Elevated Wooden Platform -->
  <!-- Base foundation -->
  <polygon points="70,435 430,435 400,390 100,390" fill="#94a3b8" stroke="#0f172a" stroke-width="7" stroke-linejoin="round"/>
  <!-- Wooden deck floor -->
  <polygon points="90,395 410,395 385,365 115,365" fill="#f59e0b" stroke="#0f172a" stroke-width="7" stroke-linejoin="round"/>
  <!-- Entrance Steps in Center -->
  <polygon points="205,435 295,435 290,405 210,405" fill="#d97706" stroke="#0f172a" stroke-width="6"/>
  <polygon points="210,405 290,405 285,375 215,375" fill="#fbbf24" stroke="#0f172a" stroke-width="6"/>

  <!-- Railings (Cross Lattice X pattern) -->
  <!-- Left Railing -->
  <rect x="110" y="305" width="95" height="60" fill="#f8fafc" stroke="#0f172a" stroke-width="6"/>
  <line x1="110" y1="305" x2="205" y2="365" stroke="#0f172a" stroke-width="5"/>
  <line x1="110" y1="365" x2="205" y2="305" stroke="#0f172a" stroke-width="5"/>
  <!-- Top rail cap -->
  <rect x="105" y="295" width="105" height="12" rx="3" fill="#d97706" stroke="#0f172a" stroke-width="5"/>

  <!-- Right Railing -->
  <rect x="295" y="305" width="95" height="60" fill="#f8fafc" stroke="#0f172a" stroke-width="6"/>
  <line x1="295" y1="305" x2="390" y2="365" stroke="#0f172a" stroke-width="5"/>
  <line x1="295" y1="365" x2="390" y2="305" stroke="#0f172a" stroke-width="5"/>
  <!-- Top rail cap -->
  <rect x="290" y="295" width="105" height="12" rx="3" fill="#d97706" stroke="#0f172a" stroke-width="5"/>

  <!-- Vertical Wooden Pillars / Columns -->
  <!-- Back pillars (darker for depth) -->
  <rect x="155" y="190" width="14" height="180" fill="#94a3b8" stroke="#0f172a" stroke-width="5"/>
  <rect x="330" y="190" width="14" height="180" fill="#94a3b8" stroke="#0f172a" stroke-width="5"/>

  <!-- Front pillars (white polished wood) -->
  <!-- Far Left Pillar -->
  <rect x="105" y="180" width="18" height="190" rx="4" fill="#f1f5f9" stroke="#0f172a" stroke-width="7"/>
  <!-- Center Left Pillar -->
  <rect x="200" y="180" width="18" height="190" rx="4" fill="#f1f5f9" stroke="#0f172a" stroke-width="7"/>
  <!-- Center Right Pillar -->
  <rect x="282" y="180" width="18" height="190" rx="4" fill="#f1f5f9" stroke="#0f172a" stroke-width="7"/>
  <!-- Far Right Pillar -->
  <rect x="377" y="180" width="18" height="190" rx="4" fill="#f1f5f9" stroke="#0f172a" stroke-width="7"/>

  <!-- Decorative arch valance / eave trim under roof -->
  <path d="M 105 190 Q 155 210 205 190 Q 245 210 285 190 Q 335 210 385 190 L 395 180 L 95 180 Z" 
        fill="#e2e8f0" stroke="#0f172a" stroke-width="6"/>

  <!-- Gazebo Roof (Octagonal Pitched Pagoda / Pavilion Roof) -->
  <!-- Left roof panel -->
  <polygon points="90,185 250,75 180,75" fill="#0284c7" stroke="#0f172a" stroke-width="7" stroke-linejoin="round"/>
  <!-- Center main roof panel -->
  <polygon points="90,185 410,185 280,75 220,75" fill="#0ea5e9" stroke="#0f172a" stroke-width="8" stroke-linejoin="round"/>
  <!-- Right roof panel -->
  <polygon points="410,185 250,75 320,75" fill="#38bdf8" stroke="#0f172a" stroke-width="7" stroke-linejoin="round"/>

  <!-- Roof Eave Ridge Line -->
  <rect x="80" y="180" width="340" height="14" rx="4" fill="#0369a1" stroke="#0f172a" stroke-width="6"/>

  <!-- Roof Top Cupola / Turret -->
  <rect x="225" y="55" width="50" height="25" rx="3" fill="#f8fafc" stroke="#0f172a" stroke-width="6"/>
  <!-- Cupola roof cap -->
  <polygon points="215,55 285,55 250,25" fill="#0284c7" stroke="#0f172a" stroke-width="6" stroke-linejoin="round"/>
  <!-- Top Finial Spike / Ball -->
  <line x1="250" y1="25" x2="250" y2="10" stroke="#eab308" stroke-width="5" stroke-linecap="round"/>
  <circle cx="250" cy="10" r="5" fill="#facc15" stroke="#0f172a" stroke-width="3"/>
</svg>`;

// 2. PICNIC: Beautiful classic AAC picnic on pure solid white background
const svgPicnic = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#ffffff"/>
  
  <!-- Soft ground shadow under blanket -->
  <ellipse cx="250" cy="430" rx="210" ry="30" fill="#e2e8f0"/>

  <!-- Red-and-White Checkered Picnic Mat / Blanket -->
  <defs>
    <pattern id="picnicPattern" width="36" height="36" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
      <rect width="36" height="36" fill="#ffffff"/>
      <rect width="18" height="36" fill="#fca5a5" opacity="0.85"/>
      <rect width="36" height="18" fill="#fca5a5" opacity="0.85"/>
      <rect width="18" height="18" fill="#e11d48"/>
    </pattern>
  </defs>

  <!-- Flowing blanket in perspective -->
  <polygon points="65,360 160,200 435,215 380,430" 
           fill="url(#picnicPattern)" stroke="#be123c" stroke-width="7" stroke-linejoin="round"/>

  <!-- Classic Woven Picnic Basket with Open Lids -->
  <g transform="translate(25, -20)">
    <!-- Basket Shadow -->
    <ellipse cx="205" cy="360" rx="90" ry="22" fill="#94a3b8" opacity="0.4"/>

    <!-- Basket Handle -->
    <path d="M 155 235 C 155 130 255 130 255 235" fill="none" stroke="#78350f" stroke-width="15" stroke-linecap="round"/>
    <path d="M 155 235 C 155 130 255 130 255 235" fill="none" stroke="#d97706" stroke-width="9" stroke-linecap="round"/>

    <!-- Open Lid Left -->
    <polygon points="115,250 135,195 200,225 180,265" fill="#b45309" stroke="#78350f" stroke-width="6"/>
    <!-- Open Lid Right -->
    <polygon points="295,250 275,195 210,225 230,265" fill="#b45309" stroke="#78350f" stroke-width="6"/>

    <!-- Basket Body -->
    <path d="M 125 255 L 148 355 C 152 365 258 365 262 355 L 285 255 Z" 
          fill="#d97706" stroke="#78350f" stroke-width="8" stroke-linejoin="round"/>

    <!-- Wicker Weave Texture -->
    <path d="M 130 280 Q 205 295 280 280" stroke="#92400e" stroke-width="5" fill="none"/>
    <path d="M 136 305 Q 205 320 274 305" stroke="#92400e" stroke-width="5" fill="none"/>
    <path d="M 142 330 Q 205 345 268 330" stroke="#92400e" stroke-width="5" fill="none"/>

    <!-- Basket Top Rim -->
    <ellipse cx="205" cy="255" rx="80" ry="16" fill="#f59e0b" stroke="#78350f" stroke-width="7"/>

    <!-- White linen cloth draping over rim -->
    <polygon points="175,250 200,240 215,280 185,285" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
  </g>

  <!-- Picnic Delicacies on the Blanket -->
  <!-- Slice of Juicy Watermelon -->
  <g transform="translate(230, 260) rotate(-10)">
    <!-- Green Rind -->
    <path d="M 40 100 A 70 70 0 0 0 160 100 Z" fill="#15803d" stroke="#0f172a" stroke-width="6"/>
    <!-- White Rind layer -->
    <path d="M 45 100 A 64 64 0 0 0 155 100 Z" fill="#ecfdf5"/>
    <!-- Red Melon Flesh -->
    <path d="M 50 100 A 58 58 0 0 0 150 100 Z" fill="#ef4444"/>
    <!-- Black Seeds -->
    <ellipse cx="80" cy="115" rx="3" ry="5" transform="rotate(-15 80 115)" fill="#0f172a"/>
    <ellipse cx="100" cy="120" rx="3" ry="5" fill="#0f172a"/>
    <ellipse cx="120" cy="115" rx="3" ry="5" transform="rotate(15 120 115)" fill="#0f172a"/>
  </g>

  <!-- Wedge of Cheese & Sandwich -->
  <g transform="translate(270, 205)">
    <!-- Triangular Sandwich -->
    <polygon points="40,110 100,75 105,120" fill="#fef08a" stroke="#ca8a04" stroke-width="5"/>
    <polygon points="40,110 100,75 95,65 35,98" fill="#d97706" stroke="#78350f" stroke-width="5"/>
    <!-- Lettuce & Tomato filling -->
    <path d="M 40 110 Q 70 95 98 78" stroke="#22c55e" stroke-width="6" stroke-linecap="round"/>
    <path d="M 55 102 Q 80 90 92 82" stroke="#ef4444" stroke-width="5" stroke-linecap="round"/>
  </g>

  <!-- Fresh Red Apple -->
  <g transform="translate(180, 310)">
    <!-- Stem and Green Leaf -->
    <path d="M 40 25 Q 48 10 55 5" stroke="#78350f" stroke-width="4" fill="none"/>
    <path d="M 50 10 Q 62 2 68 12 Q 56 16 50 10 Z" fill="#22c55e" stroke="#15803d" stroke-width="2"/>
    <!-- Apple Fruit Body -->
    <path d="M 40 25 C 20 15 5 45 15 70 C 25 95 38 100 40 97 C 42 100 55 95 65 70 C 75 45 60 15 40 25 Z" 
          fill="#ef4444" stroke="#991b1b" stroke-width="5"/>
    <!-- Shiny highlight -->
    <ellipse cx="28" cy="40" rx="4" ry="8" transform="rotate(-20 28 40)" fill="#fca5a5"/>
  </g>

  <!-- Drink Bottle / Glass -->
  <g transform="translate(130, 250)">
    <rect x="20" y="20" width="30" height="55" rx="6" fill="#38bdf8" stroke="#0284c7" stroke-width="5"/>
    <rect x="25" y="8" width="20" height="15" rx="3" fill="#facc15" stroke="#ca8a04" stroke-width="4"/>
    <line x1="20" y1="42" x2="50" y2="42" stroke="#ffffff" stroke-width="4"/>
  </g>
</svg>`;

fs.writeFileSync('svg_gazebo.svg', svgGazebo, 'utf8');
fs.writeFileSync('svg_picnic_clean.svg', svgPicnic, 'utf8');

console.log("Successfully generated svg_gazebo.svg and svg_picnic_clean.svg!");

