const ink = "#18334c";
const teal = "#147d87";
const skin = "#bf805c";
const navy = "#253f60";

function picture(content: string): string {
  return "data:image/svg+xml," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="white"/>${content}</svg>`,
  );
}

const airplanePose = picture(`
  <path d="M24 194h208" stroke="#dce7ed" stroke-width="4" stroke-linecap="round"/>
  <path d="m101 125-34 0-36 3m72-2 9 29-2 31" fill="none" stroke="${navy}" stroke-width="19" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M23 129v6m86 51h14" stroke="${ink}" stroke-width="9" stroke-linecap="round"/>
  <path d="m152 117-19-26-18-13" fill="none" stroke="${skin}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M102 113q28-10 57-5l9 17q-29 11-65 14z" fill="${teal}"/>
  <path d="m152 119 20 19 23 9" fill="none" stroke="${skin}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="m160 117 12-3" stroke="${skin}" stroke-width="11"/>
  <circle cx="184" cy="113" r="14" fill="${skin}"/>
  <path d="M170 112a14 14 0 0 1 28-2l-10-2-8 5z" fill="${ink}"/>
`);

const squat = picture(`
  <path d="M30 204h198" stroke="#dce7ed" stroke-width="4" stroke-linecap="round"/>
  <path d="m85 147 61 2-17 46" fill="none" stroke="#496181" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M130 196h19" stroke="#496181" stroke-width="12" stroke-linecap="round"/>
  <path d="m84 150 48 10-18 35" fill="none" stroke="${navy}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M114 197h20" stroke="${ink}" stroke-width="12" stroke-linecap="round"/>
  <path d="M75 145q12-33 37-54l22 16q-16 22-32 51z" fill="${teal}"/>
  <path d="m122 108 38 4 43-7" fill="none" stroke="${skin}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="m125 95 7-12" stroke="${skin}" stroke-width="13"/>
  <circle cx="140" cy="72" r="18" fill="${skin}"/>
  <path d="M122 72a18 18 0 0 1 36-1l-11-6-13 7-5 8z" fill="${ink}"/>
`);

const seatedToeStretch = picture(`
  <path d="M23 203h208" stroke="#dce7ed" stroke-width="4" stroke-linecap="round"/>
  <path d="m180 173-59 9-68 2" fill="none" stroke="#496181" stroke-width="19" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="m180 181-63 8-72 3" fill="none" stroke="${navy}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="m45 192-6-17m15 9-6-16" stroke="${ink}" stroke-width="10" stroke-linecap="round"/>
  <path d="M171 185q-10-29-45-61l18-23q36 26 51 69l-4 15z" fill="${teal}"/>
  <path d="m141 117-42 24-50 26m83-43-36 26-50 19" fill="none" stroke="${skin}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="m135 111-11-13" stroke="${skin}" stroke-width="12"/>
  <circle cx="113" cy="88" r="17" fill="${skin}"/>
  <path d="M96 86a17 17 0 0 1 34 4l-10 4-6-13-15 9z" fill="${ink}"/>
`);

const pin = `
  <path d="M0 0c-12 0-18 9-18 19 0 12 8 22 7 34-1 16-17 27-17 53 0 13 4 27 9 35h38c5-8 9-22 9-35 0-26-16-37-17-53-1-12 7-22 7-34C18 9 12 0 0 0z" fill="#f9fbff" stroke="#496181" stroke-width="3"/>
  <path d="M-11 41q11 3 22 0l-1 8q-10 3-20 0zm0 13q11 3 22 0l2 8q-13 3-26 0z" fill="#e23f47"/>
`;
const bowlingPins = picture(`
  <ellipse cx="128" cy="205" rx="88" ry="8" fill="#e4edf2"/>
  <g transform="translate(76 56)">${pin}</g><g transform="translate(180 56)">${pin}</g>
  <g transform="translate(128 39) scale(1.13)">${pin}</g>
`);

const skate = `
  <path d="M25 116v15m73-16 3 15M12 134q51 9 109 0l8-6m-6 4 4 2" fill="none" stroke="#637a8c" stroke-width="5" stroke-linecap="round"/>
  <path d="M23 30h34l10 53 38 14q16 5 17 19H19l-3-10 5-30z" fill="#f7fafc" stroke="${navy}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M19 112h102v8H19z" fill="${navy}"/>
  <path d="m42 52 15-3m-13 13 15-3m-12 13 14-3m-10 14 13-3" stroke="#617990" stroke-width="3" stroke-linecap="round"/>
  <path d="M24 35h31" stroke="${teal}" stroke-width="5"/>
`;
const figureSkates = picture(`
  <g transform="translate(92 35)">${skate}</g>
  <g transform="translate(31 75)">${skate}</g>
`);

const receptionist = picture(`
  <path d="M36 145h184v63H36z" fill="#cf8b4b"/>
  <path d="M31 138h194v14H31z" fill="#eab87d"/>
  <rect x="52" y="165" width="152" height="29" rx="4" fill="#b67540"/>
  <path d="M71 139v-14a29 29 0 0 1 58 0v14" fill="${teal}"/>
  <circle cx="100" cy="80" r="20" fill="${skin}"/>
  <path d="M80 82c-6-22 12-32 25-28 9 2 15 9 15 17-10 0-19-3-26-8-2 9-7 15-14 19z" fill="${ink}"/>
  <path d="M79 77q0-24 21-24t22 25m-1 3v9l-12 6" fill="none" stroke="#486274" stroke-width="4" stroke-linecap="round"/>
  <rect x="75" y="76" width="8" height="14" rx="3" fill="#486274"/>
  <rect x="117" y="76" width="8" height="14" rx="3" fill="#486274"/>
  <rect x="143" y="88" width="61" height="38" rx="5" fill="${navy}"/>
  <rect x="149" y="94" width="49" height="26" rx="2" fill="#b9e3ed"/>
  <path d="M174 125v10m-11 1h22" stroke="${navy}" stroke-width="5" stroke-linecap="round"/>
  <path d="m55 132 25-3 12 7H62z" fill="#f6f0dd"/>
`);

const grapeBall = picture(`
  <defs><clipPath id="grape-ball"><circle cx="128" cy="139" r="75"/></clipPath></defs>
  <ellipse cx="128" cy="215" rx="69" ry="7" fill="#e4edf2"/>
  <path d="M111 70q-2-15-12-25 18-9 29 3 11-12 29-3-10 10-12 25" fill="#7993a6" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
  <circle cx="128" cy="139" r="75" fill="#ec8854"/>
  <g clip-path="url(#grape-ball)">
    <g stroke="#ae654c" stroke-width="2">
      <circle cx="92" cy="98" r="25" fill="#ffc451"/>
      <circle cx="134" cy="86" r="22" fill="#f3a5bd"/>
      <circle cx="172" cy="108" r="26" fill="#a5d77b"/>
      <circle cx="74" cy="144" r="22" fill="#f6a569"/>
      <circle cx="115" cy="136" r="27" fill="#f281a1"/>
      <circle cx="156" cy="147" r="24" fill="#ffd367"/>
      <circle cx="191" cy="150" r="23" fill="#fa9f54"/>
      <circle cx="92" cy="182" r="24" fill="#a5d77b"/>
      <circle cx="137" cy="183" r="28" fill="#fbab58"/>
      <circle cx="177" cy="186" r="24" fill="#f3a5bd"/>
    </g>
    <path d="M-5 81 138 224M21 66l158 158M60 64l158 158M100 64l158 158M140 64l147 147M180 64l101 101M-8 199 127 64M28 203 167 64M58 213 207 64M86 225 247 64M126 225l148-148M166 225l109-109" fill="none" stroke="#637e94" stroke-width="7"/>
    <path d="M-5 81 138 224M21 66l158 158M60 64l158 158M100 64l158 158M140 64l147 147M180 64l101 101M-8 199 127 64M28 203 167 64M58 213 207 64M86 225 247 64M126 225l148-148M166 225l109-109" fill="none" stroke="#f4f9ff" stroke-width="4"/>
  </g>
  <circle cx="128" cy="139" r="75" fill="none" stroke="${ink}" stroke-width="4"/>
`);

const measuringCups = picture(`
  <ellipse cx="124" cy="212" rx="76" ry="8" fill="#e4edf2"/>
  <path d="M171 96h26q25 0 25 28 0 36-48 43l2-19q29-7 29-24 0-11-12-11h-24z" fill="#c4eaf0" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
  <path d="m39 89 19 23 15 79q4 15 48 15t49-15l17-101z" fill="#d7f1f5" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M67 145q56 13 110 0l-7 46q-5 15-49 15t-48-15z" fill="#a5dbe6"/>
  <path d="M39 89q8-29 77-31 56-2 71 32-12 22-66 22-52 0-82-23z" fill="#f5fcfd" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M86 124q2 25 9 56" fill="none" stroke="white" stroke-width="5" stroke-linecap="round"/>
  <path d="M140 124v65m0-60h18m-18 11h10m-10 11h18m-18 11h10m-10 11h18m-18 11h10" fill="none" stroke="#a53d47" stroke-width="4" stroke-linecap="round"/>
`);

export default {
  "airplane pose": airplanePose,
  "receptionist": receptionist,
  "bowling pins": bowlingPins,
  "ice skates - figure": figureSkates,
  "squat": squat,
  "seated toe stretch": seatedToeStretch,
  "ball-grape": grapeBall,
  "measuring cups": measuringCups,
};
