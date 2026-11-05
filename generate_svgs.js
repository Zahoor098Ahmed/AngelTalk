const fs = require('fs');

const svgBallPopper = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#ffffff"/>
  <!-- Handle bar -->
  <path d="M 230 40 L 270 40 L 260 220 L 240 220 Z" fill="#e11d48" stroke="#1e293b" stroke-width="8" stroke-linejoin="round"/>
  <rect x="200" y="30" width="100" height="28" rx="14" fill="#fbbf24" stroke="#1e293b" stroke-width="8"/>
  <!-- Wheels -->
  <circle cx="160" cy="410" r="50" fill="#3b82f6" stroke="#1e293b" stroke-width="9"/>
  <circle cx="160" cy="410" r="22" fill="#fbbf24" stroke="#1e293b" stroke-width="7"/>
  <circle cx="340" cy="410" r="50" fill="#3b82f6" stroke="#1e293b" stroke-width="9"/>
  <circle cx="340" cy="410" r="22" fill="#fbbf24" stroke="#1e293b" stroke-width="7"/>
  <!-- Base Chassis -->
  <path d="M 140 390 L 360 390 L 340 330 L 160 330 Z" fill="#10b981" stroke="#1e293b" stroke-width="9" stroke-linejoin="round"/>
  <!-- Transparent Dome -->
  <path d="M 160 330 A 100 110 0 0 1 340 330 Z" fill="#e0f2fe" fill-opacity="0.85" stroke="#1e293b" stroke-width="9"/>
  <!-- Popping balls inside dome -->
  <circle cx="210" cy="285" r="24" fill="#ef4444" stroke="#1e293b" stroke-width="7"/>
  <circle cx="218" cy="278" r="6" fill="#ffffff"/>
  <circle cx="280" cy="270" r="22" fill="#eab308" stroke="#1e293b" stroke-width="7"/>
  <circle cx="287" cy="264" r="5" fill="#ffffff"/>
  <circle cx="250" cy="315" r="23" fill="#3b82f6" stroke="#1e293b" stroke-width="7"/>
  <circle cx="257" cy="309" r="5" fill="#ffffff"/>
  <circle cx="295" cy="325" r="18" fill="#10b981" stroke="#1e293b" stroke-width="6"/>
  <!-- Motion pop bursts -->
  <path d="M 210 245 L 205 230 M 245 250 L 250 235 M 285 235 L 295 220" stroke="#f59e0b" stroke-width="6" stroke-linecap="round"/>
</svg>`;

const svgWaterBalloon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#ffffff"/>
  <!-- Splash droplets in background -->
  <path d="M 90 280 Q 70 260 80 240 Q 95 255 90 280 Z" fill="#38bdf8"/>
  <path d="M 400 240 Q 425 225 420 250 Q 405 260 400 240 Z" fill="#38bdf8"/>
  <path d="M 380 380 Q 410 395 390 415 Q 375 400 380 380 Z" fill="#38bdf8"/>
  <circle cx="110" cy="200" r="10" fill="#38bdf8"/>
  <circle cx="395" cy="190" r="12" fill="#38bdf8"/>
  <circle cx="340" cy="420" r="14" fill="#38bdf8"/>
  <circle cx="130" cy="400" r="12" fill="#38bdf8"/>
  
  <!-- Water Splash base -->
  <path d="M 120 400 C 160 380 200 425 250 410 C 300 425 350 385 390 405 C 380 435 320 450 250 450 C 180 450 130 435 120 400 Z" fill="#0284c7" opacity="0.3"/>

  <!-- Left Green Water Balloon -->
  <g transform="rotate(-15 190 290)">
    <!-- Knot -->
    <path d="M 180 165 L 195 150 L 210 165 Z" fill="#15803d" stroke="#0f172a" stroke-width="7"/>
    <ellipse cx="195" cy="150" rx="10" ry="5" fill="#22c55e" stroke="#0f172a" stroke-width="5"/>
    <!-- Plump balloon body -->
    <path d="M 195 165 C 245 190 265 285 225 335 C 185 385 140 355 125 315 C 105 265 145 190 195 165 Z" fill="#22c55e" stroke="#0f172a" stroke-width="8"/>
    <!-- Highlight shine -->
    <path d="M 150 220 A 45 65 0 0 1 175 310" stroke="#ffffff" stroke-width="12" stroke-linecap="round" fill="none"/>
  </g>

  <!-- Right Blue Water Balloon (Foreground) -->
  <g transform="rotate(12 290 280)">
    <!-- Knot -->
    <path d="M 285 140 L 300 125 L 315 140 Z" fill="#0369a1" stroke="#0f172a" stroke-width="7"/>
    <ellipse cx="300" cy="125" rx="11" ry="5" fill="#38bdf8" stroke="#0f172a" stroke-width="5"/>
    <!-- Plump balloon body -->
    <path d="M 300 140 C 365 170 395 270 350 330 C 305 390 245 365 225 315 C 200 255 240 170 300 140 Z" fill="#0ea5e9" stroke="#0f172a" stroke-width="8"/>
    <!-- Highlight shine -->
    <path d="M 255 200 A 55 75 0 0 1 285 315" stroke="#ffffff" stroke-width="14" stroke-linecap="round" fill="none"/>
    <ellipse cx="330" cy="270" rx="14" ry="24" fill="#bae6fd" opacity="0.6"/>
  </g>
</svg>`;

const svgWaterSnake = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#ffffff"/>
  <!-- Classic sensory water snake / wiggly tube -->
  <!-- Outer translucent cylinder tube -->
  <defs>
    <linearGradient id="tubeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9"/>
      <stop offset="40%" stop-color="#818cf8" stop-opacity="0.8"/>
      <stop offset="80%" stop-color="#ec4899" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.9"/>
    </linearGradient>
  </defs>
  
  <!-- Shadow -->
  <ellipse cx="250" cy="410" rx="180" ry="35" fill="#cbd5e1" opacity="0.6"/>

  <!-- Tube main body (horizontal rounded torus cylinder) -->
  <path d="M 120 180 C 70 180 70 340 120 340 L 380 340 C 430 340 430 180 380 180 Z" 
        fill="url(#tubeGrad)" stroke="#0f172a" stroke-width="9" stroke-linejoin="round"/>

  <!-- Inner hollow fold tunnel (the iconic donut-like center hole of water wigglers) -->
  <path d="M 140 235 C 105 235 105 285 140 285 L 360 285 C 395 285 395 235 360 235 Z" 
        fill="#ffffff" stroke="#0f172a" stroke-width="8"/>

  <!-- Floating glitter stars and sequins inside the liquid -->
  <polygon points="180,205 185,215 197,216 188,223 191,235 180,228 169,235 172,223 163,216 175,215" fill="#fde047" stroke="#ca8a04" stroke-width="2"/>
  <polygon points="320,210 324,218 334,219 326,225 329,234 320,229 311,234 314,225 306,219 316,218" fill="#f43f5e" stroke="#9f1239" stroke-width="2"/>
  <polygon points="260,305 264,312 272,313 266,318 268,326 260,322 252,326 254,318 248,313 256,312" fill="#fbbf24" stroke="#ca8a04" stroke-width="2"/>
  <circle cx="210" cy="315" r="8" fill="#a7f3d0" stroke="#059669" stroke-width="2"/>
  <circle cx="340" cy="315" r="9" fill="#fbcfe8" stroke="#db2777" stroke-width="2"/>
  <circle cx="240" cy="205" r="6" fill="#ffffff" opacity="0.8"/>
  <circle cx="300" cy="225" r="5" fill="#ffffff" opacity="0.8"/>
  <circle cx="150" cy="310" r="7" fill="#ffffff" opacity="0.8"/>

  <!-- Surface highlights (wet slippery sheen) -->
  <path d="M 115 205 C 160 192 340 192 385 205" stroke="#ffffff" stroke-width="12" stroke-linecap="round" fill="none"/>
  <path d="M 125 320 C 170 330 330 330 375 320" stroke="#ffffff" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.7"/>
</svg>`;

const svgWigglePen = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#ffffff"/>
  <!-- Squiggly wavy line drawn by the pen -->
  <path d="M 100 430 Q 125 380 150 420 T 200 410 T 250 430" 
        stroke="#ec4899" stroke-width="12" stroke-linecap="round" fill="none"/>
  
  <!-- Vibration motion waves -->
  <path d="M 285 220 Q 295 210 290 200" stroke="#0284c7" stroke-width="6" stroke-linecap="round" fill="none"/>
  <path d="M 270 170 Q 285 160 275 145" stroke="#0284c7" stroke-width="6" stroke-linecap="round" fill="none"/>
  <path d="M 375 140 Q 390 155 380 170" stroke="#0284c7" stroke-width="6" stroke-linecap="round" fill="none"/>
  <path d="M 390 190 Q 405 205 395 220" stroke="#0284c7" stroke-width="6" stroke-linecap="round" fill="none"/>
  
  <!-- Pen assembly angled at 45 degrees -->
  <g transform="rotate(-45 250 350)">
    <!-- Pen nib -->
    <path d="M 245 420 L 255 420 L 252 445 L 248 445 Z" fill="#475569" stroke="#0f172a" stroke-width="6"/>
    <!-- Nib housing cone -->
    <path d="M 235 375 L 265 375 L 255 420 L 245 420 Z" fill="#94a3b8" stroke="#0f172a" stroke-width="7"/>
    <!-- Main chunky ergonomic body -->
    <path d="M 220 180 C 210 240 225 330 235 375 L 265 375 C 275 330 290 240 280 180 Z" 
          fill="#facc15" stroke="#0f172a" stroke-width="8"/>
    <!-- Rubber grip rings -->
    <rect x="228" y="295" width="44" height="12" rx="4" fill="#3b82f6" stroke="#0f172a" stroke-width="4"/>
    <rect x="230" y="320" width="40" height="12" rx="4" fill="#3b82f6" stroke="#0f172a" stroke-width="4"/>
    <rect x="233" y="345" width="34" height="12" rx="4" fill="#3b82f6" stroke="#0f172a" stroke-width="4"/>
    <!-- Motorized battery switch top -->
    <path d="M 220 180 C 220 145 280 145 280 180 Z" fill="#ef4444" stroke="#0f172a" stroke-width="8"/>
    <circle cx="250" cy="165" r="7" fill="#ffffff" stroke="#0f172a" stroke-width="4"/>
    <!-- Highlight on pen body -->
    <path d="M 235 195 L 242 270" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>
  </g>
</svg>`;

const svgGuitarPick = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#ffffff"/>
  <!-- Guitar pick / plectrum -->
  <defs>
    <linearGradient id="pickGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="50%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </linearGradient>
  </defs>
  <!-- Shadow -->
  <path d="M 260 95 C 370 95 425 155 385 275 C 345 395 280 435 260 435 C 240 435 175 395 135 275 C 95 155 150 95 260 95 Z" 
        fill="#94a3b8" opacity="0.3"/>
  <!-- Pick body -->
  <path d="M 250 80 C 360 80 415 140 375 260 C 335 380 270 420 250 420 C 230 420 165 380 125 260 C 85 140 140 80 250 80 Z" 
        fill="url(#pickGrad)" stroke="#0f172a" stroke-width="10" stroke-linejoin="round"/>
  <!-- Grip texture lines / logo -->
  <circle cx="250" cy="200" r="35" fill="none" stroke="#ffffff" stroke-width="6" opacity="0.85"/>
  <path d="M 240 185 L 260 200 L 240 215" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.85"/>
  <!-- Highlight bevel -->
  <path d="M 160 130 C 210 100 290 100 340 130" stroke="#ffffff" stroke-width="12" stroke-linecap="round" fill="none" opacity="0.75"/>
</svg>`;

const svgBrushes = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#ffffff"/>
  <!-- Drum Wire Brushes -->
  <!-- Left Brush -->
  <g transform="rotate(-25 220 280)">
    <!-- Metal wire fan bristles -->
    <path d="M 190 190 L 120 70 M 193 190 L 140 60 M 196 190 L 165 52 M 200 190 L 190 48 M 204 190 L 215 48 M 208 190 L 240 55 M 211 190 L 265 65 M 214 190 L 285 80" 
          stroke="#64748b" stroke-width="4.5" stroke-linecap="round"/>
    <!-- Wire collar -->
    <rect x="185" y="190" width="34" height="22" rx="4" fill="#94a3b8" stroke="#0f172a" stroke-width="6"/>
    <!-- Rubber handle -->
    <rect x="189" y="212" width="26" height="190" rx="8" fill="#1e293b" stroke="#0f172a" stroke-width="7"/>
    <!-- Metal pull rod loop at base -->
    <path d="M 202 402 L 202 435 A 12 12 0 1 0 202 435" fill="none" stroke="#64748b" stroke-width="6"/>
    <!-- Grip band -->
    <rect x="189" y="270" width="26" height="30" fill="#ef4444"/>
  </g>
  <!-- Right Brush -->
  <g transform="rotate(25 280 280)">
    <!-- Metal wire fan bristles -->
    <path d="M 286 190 L 215 80 M 289 190 L 235 65 M 292 190 L 260 55 M 296 190 L 285 48 M 300 190 L 310 48 M 304 190 L 335 52 M 307 190 L 360 60 M 310 190 L 380 70" 
          stroke="#64748b" stroke-width="4.5" stroke-linecap="round"/>
    <!-- Wire collar -->
    <rect x="281" y="190" width="34" height="22" rx="4" fill="#94a3b8" stroke="#0f172a" stroke-width="6"/>
    <!-- Rubber handle -->
    <rect x="285" y="212" width="26" height="190" rx="8" fill="#1e293b" stroke="#0f172a" stroke-width="7"/>
    <!-- Metal pull rod loop at base -->
    <path d="M 298 402 L 298 435 A 12 12 0 1 0 298 435" fill="none" stroke="#64748b" stroke-width="6"/>
    <!-- Grip band -->
    <rect x="285" y="270" width="26" height="30" fill="#ef4444"/>
  </g>
</svg>`;

fs.writeFileSync('svg_ball_popper.svg', svgBallPopper);
fs.writeFileSync('svg_water_balloon.svg', svgWaterBalloon);
fs.writeFileSync('svg_water_snake.svg', svgWaterSnake);
fs.writeFileSync('svg_wiggle_pen.svg', svgWigglePen);
fs.writeFileSync('svg_guitar_pick.svg', svgGuitarPick);
fs.writeFileSync('svg_brushes.svg', svgBrushes);

console.log("Wrote 6 SVGs successfully!");

