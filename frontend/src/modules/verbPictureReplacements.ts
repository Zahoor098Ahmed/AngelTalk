function pictogram(content: string): string {
  return "data:image/svg+xml," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">${content}</svg>`,
  );
}

function standingChild(center: number, shirt: string, skin: string, hair: string): string {
  return `<g transform="translate(${center} 0)"><path d="M-6 73l-3 32m15-32 3 32" stroke="#64789e" stroke-width="9" stroke-linecap="round"/><path d="M-9 105h-5m23 0h5" stroke="#364458" stroke-width="7" stroke-linecap="round"/><rect x="-13" y="49" width="26" height="29" rx="8" fill="${shirt}"/><circle cy="32" r="13" fill="${skin}"/><path d="M-13 32a13 13 0 0 1 26-2q-12 2-17-5-2 6-9 7z" fill="${hair}"/><path d="M-4 36q4 5 8 0" fill="none" stroke="#394353" stroke-width="2" stroke-linecap="round"/></g>`;
}

const leftChild = standingChild(34, "#76a99c", "#dda584", "#64483c");
const rightChild = standingChild(94, "#d4a06d", "#b58064", "#443732");

export default {
  "verb c::carry": pictogram(
    standingChild(64, "#76a99c", "#dda584", "#64483c") +
    '<rect x="45" y="55" width="38" height="27" rx="3" fill="#b58164"/><path d="M64 55v13" stroke="#e6ba8a" stroke-width="5"/><path d="M53 54 43 67l7 10m25-23 10 13-7 10" fill="none" stroke="#dda584" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>',
  ),
  "verb c::catch": pictogram(
    standingChild(41, "#8d9bc2", "#b58064", "#443732") +
    '<path d="M49 54l14 10 11-7m-42-3 12 16 17-1" fill="none" stroke="#b58064" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="82" cy="52" r="9" fill="#d29a8a"/><path d="M108 35q-12-9-22 5m3-1-5 4-1-6" fill="none" stroke="#64789e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
  ),
  "verb c::clap": pictogram(
    standingChild(64, "#a69ac4", "#dda584", "#64483c") +
    '<path d="M53 55 47 68l12 2 4-9m12-6 6 13-12 2-4-9" fill="none" stroke="#dda584" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M56 54l-4-4m12 2v-6m8 8 4-4" stroke="#d4a562" stroke-width="2.5" stroke-linecap="round"/>',
  ),
  "verb b::brush hair": pictogram(
    '<path d="M27 112V94q0-19 23-19t23 19v18z" fill="#a69ac4"/><path d="M33 76Q20 63 28 40q6-16 24-16 22 0 25 24l-3 27q-5 9-14 8z" fill="#62463c"/><circle cx="52" cy="55" r="18" fill="#dda584"/><path d="M33 53q-1-21 18-23 14-1 20 12-9 5-19-4-7 11-19 15z" fill="#62463c"/><path d="M61 94l26-13 3-22" fill="none" stroke="#dda584" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M89 59 77 38" stroke="#af7976" stroke-width="8" stroke-linecap="round"/><ellipse cx="73" cy="31" rx="8" ry="13" transform="rotate(-31 73 31)" fill="#c68f8a"/><path d="M67 25l-6 3m9 2-6 3m9 2-6 3" stroke="#684f53" stroke-width="2" stroke-linecap="round"/><path d="M47 62q5 5 10 0" fill="none" stroke="#394353" stroke-width="2" stroke-linecap="round"/>',
  ),
  "verb b::borrow": pictogram(
    leftChild + rightChild +
    '<path d="M44 55l12 12m29-12L72 67" fill="none" stroke="#b68469" stroke-width="7" stroke-linecap="round"/><rect x="55" y="58" width="18" height="13" rx="2" fill="#8d9bc2"/><path d="M58 62h11" stroke="#e7ebf4" stroke-width="2"/><path d="M77 42q-13-11-25 0m1-7-1 7 7-1" fill="none" stroke="#566a86" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  ),
  "verb b::blow nose": pictogram(
    standingChild(64, "#c79286", "#dda584", "#64483c") +
    '<path d="M54 56l-10-9 9-9m21 18 10-9-9-9" fill="none" stroke="#dda584" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M50 33l14 4 14-4-3 17-11 5-11-5z" fill="#f0f5f6" stroke="#8fa9b5" stroke-width="2"/><path d="M41 30l-7-4m53 4 7-4" stroke="#8fa9b5" stroke-width="2" stroke-linecap="round"/>',
  ),
  "verb b::build": pictogram(
    standingChild(31, "#cba173", "#b58064", "#443732") +
    '<path d="M41 54l15 5 16-4" fill="none" stroke="#b58064" stroke-width="8" stroke-linecap="round"/><rect x="65" y="45" width="19" height="16" rx="2" fill="#a69ac4"/><rect x="66" y="89" width="22" height="16" rx="2" fill="#80aaa6"/><rect x="90" y="89" width="22" height="16" rx="2" fill="#88a6c3"/><rect x="78" y="71" width="22" height="16" rx="2" fill="#d5a477"/><path d="M90 44v17m-4-5 4 5 4-5" fill="none" stroke="#64789e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
  ),
  "verb g::give": pictogram(
    leftChild + rightChild +
    '<path d="M44 55l11 11h6m24-11L74 66h-6" fill="none" stroke="#aa795e" stroke-width="7" stroke-linecap="round"/><rect x="55" y="53" width="18" height="16" rx="2" fill="#829eb8"/><path d="M64 54v14m-8-10h16" stroke="#e1edf2" stroke-width="2"/><path d="M51 38h25m-6-5 6 5-6 5" fill="none" stroke="#566a86" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  ),
  "verb h::hold hands": pictogram(
    leftChild + rightChild +
    '<path d="M44 56l11 14 8 4m22-18L74 70l-8 4M24 56l-5 19m85-19 5 19" fill="none" stroke="#b68469" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="64" cy="74" rx="5" ry="4" fill="#c69274"/>',
  ),
  "verb h::hug": pictogram(
    standingChild(48, "#76a99c", "#dda584", "#64483c") +
    standingChild(79, "#d4a06d", "#b58064", "#443732") +
    '<path d="M40 55q0 15 26 16l19-9" fill="none" stroke="#dda584" stroke-width="8" stroke-linecap="round"/><path d="M87 53q-4 12-23 10l-20-5" fill="none" stroke="#b58064" stroke-width="8" stroke-linecap="round"/>',
  ),
  "verb d::dream": pictogram(
    '<rect x="12" y="88" width="104" height="20" rx="7" fill="#b58164"/><rect x="18" y="75" width="36" height="14" rx="6" fill="#d6eceb"/><circle cx="38" cy="74" r="12" fill="#e1ad8b"/><path d="M27 74q-2-15 12-13 9 1 11 9-8-2-15 0z" fill="#664a39"/><path d="M39 76q3 3 6 0" fill="none" stroke="#394353" stroke-width="2" stroke-linecap="round"/><path d="M49 89V78q17-9 60 0v11z" fill="#778dbe"/><circle cx="48" cy="53" r="3" fill="#c0d9e3"/><circle cx="57" cy="46" r="5" fill="#c0d9e3"/><ellipse cx="82" cy="30" rx="28" ry="17" fill="#e4f0f4"/><path d="M84 19a10 10 0 1 0 9 14 12 12 0 0 1-9-14z" fill="#dfb366"/>',
  ),
  "verb e::enjoy": pictogram(
    '<ellipse cx="64" cy="113" rx="25" ry="3" fill="#e3e9eb"/><path d="M58 77l-4 32m16-32 5 32" stroke="#6279a4" stroke-width="10" stroke-linecap="round"/><path d="M54 109h-6m27 0h6" stroke="#394353" stroke-width="7" stroke-linecap="round"/><path d="M55 56q9-6 18 0l5 25H50z" fill="#6ab6a7"/><path d="M53 58 41 47 34 33m41 25 12-11 7-14" fill="none" stroke="#bb845f" stroke-width="8" stroke-linecap="round"/><circle cx="64" cy="40" r="14" fill="#e1ad8b"/><path d="M50 41q-1-17 14-17 12 0 14 13-10 1-15-5-5 8-13 9z" fill="#664a39"/><path d="M58 46q6 7 12 0" fill="none" stroke="#394353" stroke-width="2" stroke-linecap="round"/><path d="M21 64l4 6m-7 6 6 2m83-14-4 6m7 6-6 2" stroke="#d4a562" stroke-width="3" stroke-linecap="round"/>',
  ),
  "verb p::pet": pictogram(
    '<path d="M21 107h92" stroke="#e2e9ec" stroke-width="3" stroke-linecap="round"/><path d="M29 76l-3 27m15-27 5 27" stroke="#6279a4" stroke-width="9" stroke-linecap="round"/><path d="M26 104h-5m25 0h6" stroke="#394353" stroke-width="7" stroke-linecap="round"/><path d="M25 54q9-6 19 0l4 25H22z" fill="#76a99c"/><path d="M43 57l14 16 13-3" fill="none" stroke="#bc8567" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="34" cy="39" r="13" fill="#dda584"/><path d="M21 41q-4-15 11-17 13-1 16 12-9 2-15-5-4 8-12 10z" fill="#64483c"/><path d="M92 99q21-1 20-18" fill="none" stroke="#82929b" stroke-width="6" stroke-linecap="round"/><ellipse cx="88" cy="95" rx="18" ry="10" fill="#aab8bd"/><path d="M66 77l1-11 8 6 8-5 3 10" fill="#82929b"/><ellipse cx="76" cy="80" rx="12" ry="10" fill="#aab8bd"/><circle cx="71" cy="79" r="1.5" fill="#394353"/><circle cx="80" cy="79" r="1.5" fill="#394353"/><path d="M74 83h3" stroke="#a87374" stroke-width="2" stroke-linecap="round"/>',
  ),
  "verb d::drink": pictogram(
    '<path d="M37 113V91q0-15 17-15h11q17 0 17 15v22z" fill="#439f9a"/><path d="M54 68h11v14H54z" fill="#bb845f"/><path d="M37 46q0-20 20-20 20 0 20 20v8l7 7h-8q-3 13-15 13-24 0-24-28z" fill="#e1ad8b"/><path d="M35 50q-5-27 20-28 19-1 24 18-13 5-26-5-7 14-18 15z" fill="#664a39"/><circle cx="70" cy="51" r="2" fill="#293b55"/><path d="M86 53l23 5-8 19-15-3z" fill="#d0edf4" stroke="#5289a1" stroke-width="3" stroke-linejoin="round"/><path d="M88 63l16 4-3 8-13-3z" fill="#80c6d7"/><path d="M73 91l17 5 8-21" fill="none" stroke="#bb845f" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>',
  ),
  "verb d::draw": pictogram(
    '<rect x="21" y="28" width="77" height="79" rx="5" fill="#fff" stroke="#a5b9c0" stroke-width="3"/><path d="M36 82l14-18 12 11 11-14 12 15v15H36z" fill="#8bc8ae"/><circle cx="48" cy="50" r="6" fill="#e9b75e"/><path d="M70 77l6-13 29-30 8 8-30 30z" fill="#e6b16b" stroke="#926846" stroke-width="2" stroke-linejoin="round"/><path d="M101 38l4-4 8 8-4 4z" fill="#d5918d"/><path d="M70 77l3-7 4 4z" fill="#394353"/><path d="M104 75l-6-12q-3-7 3-10 4-1 7 4l9 12q4 7 2 14l-2 10-16-2z" fill="#e1ad8b"/><path d="M101 88l18 2-2 12-18-2z" fill="#439f9a"/>',
  ),
  "verb b::beg": pictogram(
    '<ellipse cx="64" cy="110" rx="32" ry="4" fill="#e9edf0"/><ellipse cx="64" cy="87" rx="22" ry="24" fill="#c78d62"/><ellipse cx="64" cy="84" rx="11" ry="15" fill="#f0ccab"/><path d="M49 81l12 8m18-8l-12 8" stroke="#a36c4d" stroke-width="8" stroke-linecap="round"/><ellipse cx="49" cy="105" rx="12" ry="7" fill="#c78d62"/><ellipse cx="79" cy="105" rx="12" ry="7" fill="#c78d62"/><ellipse cx="42" cy="53" rx="9" ry="21" fill="#966144" transform="rotate(16 42 53)"/><ellipse cx="86" cy="53" rx="9" ry="21" fill="#966144" transform="rotate(-16 86 53)"/><circle cx="64" cy="51" r="23" fill="#c78d62"/><ellipse cx="64" cy="62" rx="13" ry="10" fill="#f0ccab"/><circle cx="55" cy="49" r="3" fill="#26313c"/><circle cx="73" cy="49" r="3" fill="#26313c"/><ellipse cx="64" cy="58" rx="5" ry="3" fill="#26313c"/>',
  ),
  "verb b::bend": pictogram(
    '<path d="M20 108h91" stroke="#e0e7eb" stroke-width="3" stroke-linecap="round"/><path d="M76 61l4 22 1 20m6-43 9 23 1 20" fill="none" stroke="#53699a" stroke-width="9" stroke-linecap="round"/><path d="M78 105h-9m27 0h-9" stroke="#293b55" stroke-width="7" stroke-linecap="round"/><path d="M78 58Q61 49 43 67" fill="none" stroke="#439f9a" stroke-width="19" stroke-linecap="round"/><path d="M47 65l1 15 11 12" fill="none" stroke="#ad7555" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="34" cy="75" r="13" fill="#d7a282"/><path d="M23 81a13 13 0 0 1 14-19l7 5-14 5z" fill="#553b35"/><circle cx="38" cy="77" r="1.5" fill="#293b55"/><path d="M65 31Q43 27 32 45m0-8v8h8" fill="none" stroke="#5e7191" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  ),
  "verb c::crawl": pictogram(
    '<path d="M17 104h95" stroke="#e0e7eb" stroke-width="3" stroke-linecap="round"/><path d="M76 62l-5 26 24 7m-9-32 1 24 17 2" fill="none" stroke="#53699a" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M95 95l7-4m2-2 6-6" stroke="#293b55" stroke-width="7" stroke-linecap="round"/><path d="M45 62q18-6 35 0" fill="none" stroke="#d6a05d" stroke-width="19" stroke-linecap="round"/><path d="M47 63l-5 19-8 16m19-30 3 16-8 14" fill="none" stroke="#bb845f" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="32" cy="67" rx="13" ry="14" fill="#e1ad8b"/><path d="M19 67a13 13 0 0 1 25-5l-9-4-8 8-4 8z" fill="#664a39"/><circle cx="25" cy="69" r="1.5" fill="#293b55"/><path d="M66 32H33m0 0 8-7m-8 7 8 7" fill="none" stroke="#5e7191" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  ),
};
