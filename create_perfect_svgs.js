const fs = require('fs');

// 1. PERFECT PICNIC SVG: Pure white background, zero borders/square crop, beautiful AAC style
const svgPicnic = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#ffffff"/>
  
  <!-- Subtle ground shadow -->
  <ellipse cx="250" cy="405" rx="200" ry="40" fill="#e2e8f0"/>

  <!-- Checkered Picnic Blanket in Perspective -->
  <defs>
    <pattern id="picnicGingham" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
      <rect width="40" height="40" fill="#ffffff"/>
      <rect width="20" height="40" fill="#fca5a5" opacity="0.8"/>
      <rect width="40" height="20" fill="#fca5a5" opacity="0.8"/>
      <rect width="20" height="20" fill="#ef4444"/>
    </pattern>
  </defs>

  <!-- Blanket shape -->
  <polygon points="70,360 170,220 420,240 370,410" 
           fill="url(#picnicGingham)" stroke="#b91c1c" stroke-width="6" stroke-linejoin="round"/>

  <!-- Classic Woven Picnic Basket -->
  <g transform="translate(40, -10)">
    <!-- Basket Shadow -->
    <ellipse cx="190" cy="350" rx="90" ry="25" fill="#94a3b8" opacity="0.4"/>
    
    <!-- Basket Handle -->
    <path d="M 140 230 C 140 140 240 140 240 230" fill="none" stroke="#78350f" stroke-width="14" stroke-linecap="round"/>
    <path d="M 140 230 C 140 140 240 140 240 230" fill="none" stroke="#d97706" stroke-width="8" stroke-linecap="round"/>

    <!-- Open Lid Left -->
    <polygon points="105,245 125,200 185,225 165,260" fill="#b45309" stroke="#78350f" stroke-width="6"/>
    <!-- Open Lid Right -->
    <polygon points="275,245 255,200 195,225 215,260" fill="#b45309" stroke="#78350f" stroke-width="6"/>

    <!-- Basket Body (woven pattern) -->
    <path d="M 115 250 L 135 345 C 140 355 240 355 245 345 L 265 250 Z" 
          fill="#d97706" stroke="#78350f" stroke-width="8" stroke-linejoin="round"/>
    
    <!-- Wicker weave horizontal stripes -->
    <path d="M 120 275 Q 190 290 260 275" stroke="#92400e" stroke-width="5" fill="none"/>
    <path d="M 125 300 Q 190 315 255 300" stroke="#92400e" stroke-width="5" fill="none"/>
    <path d="M 130 325 Q 190 340 250 325" stroke="#92400e" stroke-width="5" fill="none"/>
    
    <!-- Basket Rim -->
    <ellipse cx="190" cy="250" rx="76" ry="16" fill="#f59e0b" stroke="#78350f" stroke-width="7"/>
    
    <!-- Cloth napkin peeking out -->
    <polygon points="150,245 175,230 190,265 160,270" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
  </g>

  <!-- Picnic Food on the blanket -->
  <!-- Sandwich -->
  <g transform="translate(140, 20)">
    <polygon points="120,340 180,310 185,360" fill="#fef08a" stroke="#ca8a04" stroke-width="5"/>
    <polygon points="120,340 180,310 175,295 115,325" fill="#d97706" stroke="#78350f" stroke-width="5"/>
    <!-- Lettuce & Tomato layer -->
    <path d="M 120 340 Q 145 328 178 312" stroke="#22c55e" stroke-width="7" stroke-linecap="round"/>
    <path d="M 135 333 Q 155 323 170 315" stroke="#ef4444" stroke-width="6" stroke-linecap="round"/>
  </g>

  <!-- Red Apple -->
  <g transform="translate(190, 80)">
    <!-- Stem & Leaf -->
    <path d="M 140 240 Q 148 220 155 215" stroke="#78350f" stroke-width="5" fill="none"/>
    <path d="M 152 220 Q 165 210 170 222 Q 158 226 152 220 Z" fill="#22c55e" stroke="#15803d" stroke-width="2"/>
    <!-- Apple Body -->
    <path d="M 140 240 C 120 230 105 260 115 285 C 125 310 138 315 140 312 C 142 315 155 310 165 285 C 175 260 160 230 140 240 Z" 
          fill="#ef4444" stroke="#991b1b" stroke-width="6"/>
    <!-- Highlight -->
    <ellipse cx="128" cy="255" rx="5" ry="10" transform="rotate(-20 128 255)" fill="#fca5a5"/>
  </g>

  <!-- Juice Bottle / Thermos -->
  <g transform="translate(265, 50)">
    <rect x="75" y="270" width="35" height="70" rx="8" fill="#38bdf8" stroke="#0284c7" stroke-width="6"/>
    <rect x="80" y="255" width="25" height="18" rx="4" fill="#facc15" stroke="#ca8a04" stroke-width="5"/>
    <rect x="75" y="295" width="35" height="20" fill="#ffffff" opacity="0.6"/>
  </g>
</svg>`;

// 2. PERFECT JUNGLE GYM SVG: Classic playground climbing structure / jungle gym playset on pure white background
const svgJungleGym = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#ffffff"/>
  
  <!-- Ground base shadow -->
  <ellipse cx="250" cy="450" rx="210" ry="25" fill="#e2e8f0"/>

  <!-- Classic Jungle Gym Playground Structure -->
  <!-- Ladder (Left) -->
  <line x1="80" y1="440" x2="140" y2="240" stroke="#0f172a" stroke-width="10" stroke-linecap="round"/>
  <line x1="120" y1="440" x2="170" y2="240" stroke="#0f172a" stroke-width="10" stroke-linecap="round"/>
  <!-- Ladder rungs -->
  <line x1="90" y1="400" x2="132" y2="400" stroke="#eab308" stroke-width="8" stroke-linecap="round"/>
  <line x1="102" y1="355" x2="145" y2="355" stroke="#eab308" stroke-width="8" stroke-linecap="round"/>
  <line x1="115" y1="310" x2="155" y2="310" stroke="#eab308" stroke-width="8" stroke-linecap="round"/>
  <line x1="128" y1="265" x2="165" y2="265" stroke="#eab308" stroke-width="8" stroke-linecap="round"/>

  <!-- Main Tower Posts (Red & Blue) -->
  <rect x="150" y="160" width="18" height="280" rx="6" fill="#ef4444" stroke="#0f172a" stroke-width="7"/>
  <rect x="290" y="160" width="18" height="280" rx="6" fill="#ef4444" stroke="#0f172a" stroke-width="7"/>

  <!-- Tower Platform Deck -->
  <rect x="140" y="240" width="178" height="22" rx="4" fill="#facc15" stroke="#0f172a" stroke-width="7"/>
  <!-- Safety Railing on Platform -->
  <rect x="155" y="195" width="148" height="45" fill="none" stroke="#3b82f6" stroke-width="7"/>
  <line x1="192" y1="195" x2="192" y2="240" stroke="#3b82f6" stroke-width="6"/>
  <line x1="229" y1="195" x2="229" y2="240" stroke="#3b82f6" stroke-width="6"/>
  <line x1="266" y1="195" x2="266" y2="240" stroke="#3b82f6" stroke-width="6"/>

  <!-- Tower Roof / Canopy -->
  <polygon points="135,165 230,80 325,165" fill="#3b82f6" stroke="#0f172a" stroke-width="8" stroke-linejoin="round"/>
  <!-- Decorative roof pennant flag -->
  <path d="M 230 80 L 230 40 L 270 55 L 230 70" fill="#ef4444" stroke="#0f172a" stroke-width="5" stroke-linejoin="round"/>

  <!-- Monkey Bars / Jungle Gym Climbing Grid (Right side) -->
  <!-- Horizontal overhead beam -->
  <rect x="295" y="180" width="145" height="16" rx="4" fill="#10b981" stroke="#0f172a" stroke-width="6"/>
  <!-- Far post for monkey bars -->
  <rect x="425" y="185" width="16" height="255" rx="5" fill="#ef4444" stroke="#0f172a" stroke-width="7"/>
  <!-- Monkey bar overhead rungs -->
  <circle cx="330" cy="188" r="7" fill="#fbbf24" stroke="#0f172a" stroke-width="4"/>
  <circle cx="365" cy="188" r="7" fill="#fbbf24" stroke="#0f172a" stroke-width="4"/>
  <circle cx="400" cy="188" r="7" fill="#fbbf24" stroke="#0f172a" stroke-width="4"/>

  <!-- Climbing Grid Bars on the right structure (iconic Jungle Gym grid!) -->
  <line x1="305" y1="260" x2="425" y2="260" stroke="#3b82f6" stroke-width="8" stroke-linecap="round"/>
  <line x1="305" y1="320" x2="425" y2="320" stroke="#eab308" stroke-width="8" stroke-linecap="round"/>
  <line x1="305" y1="380" x2="425" y2="380" stroke="#10b981" stroke-width="8" stroke-linecap="round"/>
  <line x1="365" y1="195" x2="365" y2="440" stroke="#0f172a" stroke-width="8"/>

  <!-- Slide attached to the front/left of platform -->
  <path d="M 160 255 C 130 260 85 360 50 440 L 80 440 C 110 380 150 280 185 255 Z" 
        fill="#10b981" stroke="#0f172a" stroke-width="7" stroke-linejoin="round"/>
  <!-- Slide red side-barrier wall -->
  <path d="M 160 248 C 130 253 85 353 50 433" fill="none" stroke="#ef4444" stroke-width="9" stroke-linecap="round"/>

  <!-- Steering wheel / telescope play accessory on platform -->
  <circle cx="215" cy="210" r="14" fill="#fbbf24" stroke="#0f172a" stroke-width="5"/>
  <line x1="201" y1="210" x2="229" y2="210" stroke="#0f172a" stroke-width="4"/>
  <line x1="215" y1="196" x2="215" y2="224" stroke="#0f172a" stroke-width="4"/>
</svg>`;

fs.writeFileSync('svg_perfect_picnic.svg', svgPicnic, 'utf8');
fs.writeFileSync('svg_perfect_jungle_gym.svg', svgJungleGym, 'utf8');

console.log("Created svg_perfect_picnic.svg and svg_perfect_jungle_gym.svg!");

