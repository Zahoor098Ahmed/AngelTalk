const fs = require('fs');

const svgMuseum = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#ffffff"/>
  
  <!-- Ground soft shadow -->
  <ellipse cx="250" cy="445" rx="205" ry="22" fill="#cbd5e1" opacity="0.6"/>

  <!-- Museum Base & Grand Staircase -->
  <polygon points="65,440 435,440 415,410 85,410" fill="#94a3b8" stroke="#0f172a" stroke-width="7" stroke-linejoin="round"/>
  <polygon points="85,410 415,410 395,385 105,385" fill="#cbd5e1" stroke="#0f172a" stroke-width="6" stroke-linejoin="round"/>
  <polygon points="105,385 395,385 380,365 120,365" fill="#e2e8f0" stroke="#0f172a" stroke-width="5" stroke-linejoin="round"/>

  <!-- Museum Hall Wings (Left and Right) -->
  <!-- Left Wing -->
  <rect x="75" y="240" width="85" height="125" fill="#f8fafc" stroke="#0f172a" stroke-width="7"/>
  <rect x="95" y="270" width="45" height="60" rx="4" fill="#bae6fd" stroke="#0284c7" stroke-width="4"/>
  <rect x="70" y="225" width="95" height="18" rx="3" fill="#cbd5e1" stroke="#0f172a" stroke-width="5"/>
  <!-- Decorative urn on left roof -->
  <ellipse cx="117" cy="215" rx="10" ry="10" fill="#eab308" stroke="#0f172a" stroke-width="3"/>

  <!-- Right Wing -->
  <rect x="340" y="240" width="85" height="125" fill="#f8fafc" stroke="#0f172a" stroke-width="7"/>
  <rect x="360" y="270" width="45" height="60" rx="4" fill="#bae6fd" stroke="#0284c7" stroke-width="4"/>
  <rect x="335" y="225" width="95" height="18" rx="3" fill="#cbd5e1" stroke="#0f172a" stroke-width="5"/>
  <!-- Decorative urn on right roof -->
  <ellipse cx="382" cy="215" rx="10" ry="10" fill="#eab308" stroke="#0f172a" stroke-width="3"/>

  <!-- Central Main Museum Portico -->
  <rect x="145" y="190" width="210" height="175" fill="#ffffff" stroke="#0f172a" stroke-width="8"/>

  <!-- Grand Bronze Double Entrance Doors -->
  <rect x="210" y="260" width="80" height="105" rx="4" fill="#78350f" stroke="#0f172a" stroke-width="6"/>
  <line x1="250" y1="260" x2="250" y2="365" stroke="#0f172a" stroke-width="4"/>
  <circle cx="242" cy="315" r="4" fill="#facc15"/>
  <circle cx="258" cy="315" r="4" fill="#facc15"/>
  <!-- Door arched transom window -->
  <path d="M 210 260 C 210 235 290 235 290 260 Z" fill="#38bdf8" stroke="#0f172a" stroke-width="5"/>

  <!-- 4 Grand Classical Columns (Pillars) -->
  <!-- Column 1 -->
  <g transform="translate(155, 190)">
    <rect x="-4" y="0" width="22" height="10" rx="2" fill="#cbd5e1" stroke="#0f172a" stroke-width="4"/>
    <rect x="0" y="8" width="14" height="158" fill="#f1f5f9" stroke="#0f172a" stroke-width="5"/>
    <rect x="-4" y="165" width="22" height="10" rx="2" fill="#cbd5e1" stroke="#0f172a" stroke-width="4"/>
  </g>
  <!-- Column 2 -->
  <g transform="translate(198, 190)">
    <rect x="-4" y="0" width="22" height="10" rx="2" fill="#cbd5e1" stroke="#0f172a" stroke-width="4"/>
    <rect x="0" y="8" width="14" height="158" fill="#f1f5f9" stroke="#0f172a" stroke-width="5"/>
    <rect x="-4" y="165" width="22" height="10" rx="2" fill="#cbd5e1" stroke="#0f172a" stroke-width="4"/>
  </g>
  <!-- Column 3 -->
  <g transform="translate(288, 190)">
    <rect x="-4" y="0" width="22" height="10" rx="2" fill="#cbd5e1" stroke="#0f172a" stroke-width="4"/>
    <rect x="0" y="8" width="14" height="158" fill="#f1f5f9" stroke="#0f172a" stroke-width="5"/>
    <rect x="-4" y="165" width="22" height="10" rx="2" fill="#cbd5e1" stroke="#0f172a" stroke-width="4"/>
  </g>
  <!-- Column 4 -->
  <g transform="translate(331, 190)">
    <rect x="-4" y="0" width="22" height="10" rx="2" fill="#cbd5e1" stroke="#0f172a" stroke-width="4"/>
    <rect x="0" y="8" width="14" height="158" fill="#f1f5f9" stroke="#0f172a" stroke-width="5"/>
    <rect x="-4" y="165" width="22" height="10" rx="2" fill="#cbd5e1" stroke="#0f172a" stroke-width="4"/>
  </g>

  <!-- Entablature Architrave Beam -->
  <rect x="135" y="170" width="230" height="22" rx="3" fill="#e2e8f0" stroke="#0f172a" stroke-width="6"/>

  <!-- Triangular Pediment with "MUSEUM" Title -->
  <polygon points="120,170 380,170 250,75" fill="#f8fafc" stroke="#0f172a" stroke-width="8" stroke-linejoin="round"/>
  <!-- Inner Gold Pediment Relief -->
  <polygon points="155,160 345,160 250,90" fill="#fef08a" stroke="#ca8a04" stroke-width="4" stroke-linejoin="round"/>
  <text x="250" y="145" font-family="Arial, sans-serif" font-size="20" font-weight="900" fill="#0f172a" text-anchor="middle" letter-spacing="3">MUSEUM</text>

  <!-- Top Pediment Finial Acroterion -->
  <circle cx="250" cy="70" r="7" fill="#facc15" stroke="#ca8a04" stroke-width="3"/>
  <circle cx="125" cy="165" r="6" fill="#facc15" stroke="#ca8a04" stroke-width="3"/>
  <circle cx="375" cy="165" r="6" fill="#facc15" stroke="#ca8a04" stroke-width="3"/>
</svg>`;

fs.writeFileSync('svg_museum_perfect.svg', svgMuseum, 'utf8');
console.log("Wrote svg_museum_perfect.svg!");

