import images from './verbScreenshotFixes.json';
import aliases from './verbsBtoZAliases.json';

const pictures: Record<string, string> = { ...images };
const forms: Record<string, string[]> = {
  add: ['add', 'added', 'adding', 'adds'],
  apply: ['apply', 'applied', 'applying', 'applies'],
  assist: ['assist', 'assisted', 'assisting', 'assists'],
};
for (const [base, labels] of Object.entries(forms)) {
  for (const label of labels) pictures[`verb a::${label}`] = pictures[`verb a::${base}`];
}

const ink = '#293b55';
const skin = '#ffc99d';
const darkSkin = '#d99a76';

function scene(content: string) {
  return 'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="512" height="512"><g stroke-linecap="round" stroke-linejoin="round">${content}</g></svg>`,
  );
}

function head(x: number, y: number, complexion = skin, expression = 'smile') {
  const mouth = expression === 'smile'
    ? '<path d="M-4 4q4 5 8 0" fill="none" stroke="#39251e" stroke-width="1.4"/>'
    : `<ellipse cy="5" rx="2.5" ry="3" fill="${ink}"/>`;
  return `<g transform="translate(${x} ${y})"><path d="M-10-2q-4-3-5 1-1 5 5 5M10-2q4-3 5 1 1 5-5 5" fill="${complexion}" stroke="#8a553c" stroke-width=".8"/><path d="M-12-4q0-10 12-10t12 10v5q-1 10-12 11Q-11 11-12 1z" fill="${complexion}" stroke="#8a553c" stroke-width=".8"/><path d="M-13-2q-1-15 13-15T13-2l-2-2Q9-9 0-9t-11 5z" fill="#724832" stroke="#4d3126" stroke-width=".9"/><circle cx="-4.5" cy="0" r="1.35" fill="#39251e"/><circle cx="4.5" cy="0" r="1.35" fill="#39251e"/>${mouth}</g>`;
}

function person(x: number, y: number, shirt: string, complexion = skin, expression = 'smile') {
  return `<g transform="translate(${x} ${y})"><path d="M-9 27h18l3 31H3L0 36l-3 22h-9z" fill="#526ebc" stroke="${ink}" stroke-width=".9"/><path d="M-12 55h8l1 4q0 2-3 2h-7q-3 0-2-3zm16 0h8l3 3q1 3-2 3H6q-3 0-3-2z" fill="${ink}"/><path d="M-12 9Q0 1 12 9l-1 18q0 4-4 4H-7q-4 0-4-4z" fill="${shirt}" stroke="${ink}" stroke-width=".85"/><path d="M-4-2h8v7q0 4-4 4t-4-4z" fill="${complexion}" stroke="#8a553c" stroke-width=".8"/>${head(0, -11, complexion, expression)}</g>`;
}

function arm(path: string, complexion = skin) {
  return `<path d="${path}" fill="none" stroke="${ink}" stroke-width="7.5"/><path d="${path}" fill="none" stroke="${complexion}" stroke-width="5.5"/>`;
}

function grip(x: number, y: number, angle = 0, complexion = skin) {
  return `<g transform="translate(${x} ${y}) rotate(${angle})"><path d="M-3-3q2-3 4-1l1 1q3 0 3 3v2q0 2-3 2h-4q-2 0-2-2v-4z" fill="${complexion}" stroke="${ink}" stroke-width=".85"/><path d="M1-2v2m2-2v2" fill="none" stroke="#97634f" stroke-width=".65"/></g>`;
}

function speech(x: number, y: number, width: number, text: string) {
  return `<g transform="translate(${x} ${y})"><path d="M8 0h${width - 16}q8 0 8 8v3q0 8-8 8H22l-7 5 1-5H8q-8 0-8-8V8q0-8 8-8z" fill="#fff" stroke="${ink}" stroke-width="1.6"/><text x="${width / 2}" y="12.5" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="700" fill="#465cb3">${text}</text></g>`;
}

function cheering(text: string, shirt: string, listener: string, playful: boolean) {
  return scene(speech(13, 5, 60, text) +
    person(35, 55, shirt, skin, 'speaking') + person(92, 55, listener, darkSkin, playful ? 'surprised' : 'smile') +
    arm('M25 66l-5 22') + grip(20, 88, 12) +
    arm(playful ? 'M45 66l13 3 10-8' : 'M45 66l10-8 7-13') +
    (playful
      ? `<path d="M64 63l2-5 7-2q2 0 1 2l-5 3 1 3q0 2-3 2z" fill="${skin}" stroke="${ink}" stroke-width=".9"/>`
      : grip(62, 44, 28)) +
    arm('M82 66l-5 21', darkSkin) + arm('M102 66l5 21', darkSkin) + grip(77, 87, 12, darkSkin) + grip(107, 87, -12, darkSkin));
}

function exchange(borrow: boolean) {
  return scene(person(28, 43, '#67ada7') + person(100, 43, '#e4a166', darkSkin) +
    arm('M18 55l-5 24') + grip(13, 79) + arm('M110 55l5 24', darkSkin) + grip(115, 79, 0, darkSkin) +
    arm('M38 56l9 12 9-2') + arm('M90 56l-9 12-9-2', darkSkin) +
    `<rect x="54" y="56" width="20" height="16" rx="2" fill="#87a8cf" stroke="${ink}"/><path d="M54 61h20m-10-5v16" stroke="#e9f3fa" stroke-width="2"/>` +
    grip(54, 67, 90) + grip(74, 67, -90, darkSkin) +
    `<path d="${borrow ? 'M76 35H52m7-6-7 6 7 6' : 'M52 35h24m-7-6 7 6-7 6'}" fill="none" stroke="#536e91" stroke-width="3"/>`);
}

const updatedPictures: Record<string, string> = {
  'verb b::bend': scene(
    `<path d="M77 57h16l4 47H87l-4-34-3 34H70z" fill="#526ebc" stroke="${ink}"/><path d="M70 101h10v5q0 2-3 2H67q-3 0-2-3zm17 0h10l5 4q1 3-2 3h-9q-4 0-4-3z" fill="${ink}"/><path d="M45 57q3-8 14-8l32 7-1 17-39-4q-8-1-6-12z" fill="#f49d88" stroke="${ink}"/><path d="M46 56l-9 4 5 8 9-4z" fill="${skin}" stroke="#8a553c"/>` +
    `<g transform="rotate(-70 35 64)">${head(35, 64)}</g>` +
    arm('M52 62l4 16-5 18') + grip(51, 96, 12) +
    '<path d="M57 25q-20 1-26 16m-2-7 2 7 7-2" fill="none" stroke="#536e91" stroke-width="2.5"/>'),
  'verb d::draw': scene(person(38, 43, '#f49d88') + arm('M27 54l-5 20') + grip(22, 74, 12) +
    '<path d="M61 70h57v8H61zM68 78v28m42-28v28" fill="#bb8a63" stroke="#293b55" stroke-width="2"/><path d="M70 61h34l8 9H66z" fill="#fff" stroke="#8697ad"/><path d="M87 67l5-4 7 4z" fill="none" stroke="#56929a"/>' +
    arm('M49 54l12 5 17-2') + '<path d="m76 51 3-2 12 12-1 4-3-1z" fill="#e9ac46" stroke="#293b55"/>' + grip(78, 56, 75)),
  'verb d::dream': scene(
    '<path d="M75 42q-10 0-10-9 0-7 8-8 3-12 15-8 11-6 17 5 13 0 13 11 0 9-13 9z" fill="#e3f0fc" stroke="#536e91"/><circle cx="64" cy="49" r="4" fill="#e3f0fc" stroke="#536e91"/><circle cx="56" cy="55" r="2.5" fill="#e3f0fc" stroke="#536e91"/><path d="m91 22 2 6 7 1-5 4 1 6-5-3-5 3 1-6-5-4 7-1z" fill="#edba50"/><path d="M12 68v34m104-18v18M12 94h104" stroke="#805738" stroke-width="4"/><rect x="15" y="75" width="36" height="16" rx="6" fill="#e4ebf9" stroke="#536e91"/>' +
    `<g transform="rotate(-20 35 77)"><path d="M-12 0" fill="none"/><ellipse cx="35" cy="77" rx="12" ry="10" fill="${skin}" stroke="#8a553c"/><path d="M23 76q0-15 16-11 7 2 8 8-9-3-15-2-2 5-9 5z" fill="#724832"/><path d="M37 77q2 2 4 0m-4 5q3 2 5 0" fill="none" stroke="#39251e"/></g><path d="M49 83q12-11 25-5l35 5 7 12H43z" fill="#80afc6" stroke="#536e91"/>`),
  'verb d::drink': scene(person(55, 49, '#26a9a0') +
    arm('M44 60l-7 24') + grip(37, 84, 15) +
    arm('M66 60l11 7-2-14') +
    '<g transform="translate(-5 3) rotate(-22 72 43)"><path d="M63 34h18l-3 18H66z" fill="#d8f5fa" stroke="#2c7d94" stroke-width="1.3"/><path d="M65 41h14l-2 9H67z" fill="#5bbad1"/><path d="M63 34h18" stroke="#2c7d94" stroke-width="1.4"/></g>' +
    grip(75, 53, 28)),
  'verb b::borrow': exchange(true),
  'verb g::give': exchange(false),
  'verb b::beg': scene(person(34, 46, '#8a9bca', skin, 'speaking') + person(94, 46, '#68aca2', darkSkin) +
    arm('M24 57l3 17 11-12') + arm('M44 57l4 13-8-8') + grip(39, 60, 12) +
    arm('M84 57l-5 21', darkSkin) + grip(79, 78, 10, darkSkin) + arm('M104 57l5 21', darkSkin) + grip(109, 78, -10, darkSkin) + speech(47, 5, 41, 'Please')),
  'verb b::blow nose': scene(person(64, 48, '#d1998c') +
    arm('M53 58l-9-9 8-11') + arm('M75 58l9-9-8-11') +
    `<path d="M50 38l14 4 14-4-4 16-10 5-10-5z" fill="#ecf8fa" stroke="#6e9cab" stroke-width="1.4"/><path d="M46 30l-7-4m43 4 7-4" stroke="#6e9cab" stroke-width="2"/>` + grip(52, 44, -15) + grip(76, 44, 15)),
  'verb b::brush hair': scene(
    '<path d="M39 50V36q0-18 18-18 19 0 19 18v17l-11 6-17-2z" fill="#644438" stroke="#293b55"/>' +
    person(57, 48, '#a99ac6') + arm('M47 59l-8 22') + grip(39, 81, 17) +
    arm('M67 59l18-11 2-15') +
    '<g transform="rotate(-27 81 26)"><rect x="79" y="23" width="5" height="19" rx="2" fill="#aa6972" stroke="#293b55"/><rect x="75" y="14" width="12" height="15" rx="5" fill="#c98791" stroke="#293b55"/><path d="M76 17h-4m4 4h-4m4 4h-4" stroke="#654852"/></g>' + grip(87, 34, 21)),
  'verb b::build': scene(person(34, 44, '#d9a477', darkSkin) +
    arm('M23 56l-5 22', darkSkin) + grip(18, 78, 8, darkSkin) + arm('M45 56l14 8 12-4', darkSkin) +
    '<g stroke="#293b55"><rect x="72" y="49" width="18" height="17" rx="2" fill="#afa3ce"/><rect x="78" y="90" width="20" height="17" rx="2" fill="#79b7ac"/><rect x="99" y="90" width="20" height="17" rx="2" fill="#83aecb"/><rect x="88" y="73" width="20" height="17" rx="2" fill="#e2a478"/></g><path d="M100 47v19m-5-5 5 5 5-5" fill="none" stroke="#536e91" stroke-width="2.5"/>' + grip(72, 60, 80, darkSkin)),
  'verb e::enjoy': scene(person(64, 47, '#59b3a9') +
    arm('M53 57L39 45l-8-14') + arm('M75 57l14-12 8-14') + grip(31, 30, -26) + grip(97, 30, 26) +
    '<path d="M22 46l-6-3m8 13-7 1m87-11 6-3m-8 13 7 1" stroke="#dc9b42" stroke-width="2.5"/>'),
  'verb h::hold hands': scene(person(28, 43, '#67ada7') + person(100, 43, '#e4a166', darkSkin) +
    arm('M18 55l-5 24') + grip(13, 79) + arm('M110 55l5 24', darkSkin) + grip(115, 79, 0, darkSkin) +
    arm('M38 56l13 14 12 4') + arm('M90 56 77 70l-12 4', darkSkin) +
    `<path d="M58 73q3-4 7-3l5 3q2 2-1 5l-5 2-6-3z" fill="${skin}" stroke="${ink}"/><path d="m62 72 5 4m-7-2 5 4" stroke="#97634f" stroke-width=".7"/>`),
  'verb h::hug': scene(person(47, 44, '#67ada7') + person(79, 44, '#e4a166', darkSkin) +
    arm('M88 57q-9 21-48 12', darkSkin) + grip(39, 69, -57, darkSkin) +
    arm('M38 57q9 21 48 17') + grip(87, 73, 70)),
  'verb p::pet': scene(person(31, 44, '#67ada7') + arm('M21 55l-5 23') + grip(16, 78) +
    '<path d="M101 92q19 0 18-13" fill="none" stroke="#778f9c" stroke-width="6"/><ellipse cx="94" cy="89" rx="19" ry="13" fill="#a4b9be" stroke="#293b55"/><path d="M70 77l1-15 10 6 10-6 3 15q0 12-12 12-12 0-12-12z" fill="#a4b9be" stroke="#293b55"/><path d="M76 76h.1m10 0h.1" stroke="#293b55" stroke-width="2.5"/><path d="M80 81h3" stroke="#b77777" stroke-width="2"/>' +
    arm('M41 55l16 17 18-5') + grip(76, 67, 66) +
    '<path d="M66 61l-2-3m8 1v-4" stroke="#6b93a0" stroke-width="1.5"/>'),
  'verb c::carry': scene(person(64, 42, '#67ada7') +
    '<rect x="43" y="52" width="42" height="29" rx="2" fill="#be8d6a" stroke="#293b55"/><path d="M60 52h8v12h-8" fill="#ebc494"/>' +
    arm('M53 53 41 65l8 8') + arm('M75 53l12 12-8 8') + grip(49, 73, 80) + grip(79, 73, -80)),
  'verb c::catch': scene(person(37, 46, '#8d9bc2', darkSkin) +
    arm('M26 57l11 20 30-5', darkSkin) + arm('M48 57l9 5 16-7', darkSkin) +
    '<circle cx="81" cy="63" r="14" fill="#e18c80" stroke="#293b55"/><path d="M112 37q-15-9-24 5m0-7v7l7-1" fill="none" stroke="#536e91" stroke-width="2.5"/>' +
    `<path d="M64 69l10-1 5-4q3-1 2 2l-6 7-7 3zm6-14 1-8q2-3 3 0v4l4-3q2 0 1 2l-5 6z" fill="${darkSkin}" stroke="${ink}"/>`),
  'verb c::clap': scene(person(64, 46, '#a69ac4') +
    arm('M53 57l-7 16 13-6') + arm('M75 57l7 16-13-6') +
    `<path d="M52 69l3-7-1-7q0-2 2-2l3 5 2-11q1-2 3-1l1 2-1 12-2 7-6 5zm24 0-3-7 1-7q0-2-2-2l-3 5-2-11q-1-2-3-1l-1 2 1 12 2 7 6 5z" fill="${skin}" stroke="${ink}"/><path d="M50 49l-4-4m32 4 4-4" stroke="#d29d54" stroke-width="2"/>`),
  'verb c::crawl': scene(
    `<path d="M70 63l2 25h23v10H71q-7 0-8-6l-4-25m17-4 12 17h19v9H85q-5 0-8-4L66 68" fill="#59779e" stroke="${ink}" stroke-width="1.3"/><path d="M94 88l8-3q4 0 3 4l-4 9h-7zm12-8 8-2q4 0 3 4l-3 7h-8z" fill="${ink}"/><path d="M36 57q20-9 41 5l-5 14-38-9z" fill="#e0a446" stroke="${ink}"/><path d="M34 63l-8 23-7 4q-2 2 1 3h12l9-27m0 1 10 20-6 4q-2 2 1 3h11q3-1 2-4L48 69" fill="${skin}" stroke="${ink}" stroke-width="1.2"/><path d="M22 91h7m18 1h8M33 58l7 1-2 8-7-2" stroke="${ink}" stroke-width=".7"/>` +
    `<g transform="rotate(-19 25 62)">${head(25, 62)}</g><path d="M69 29H36m8-7-8 7 8 7" fill="none" stroke="#536e91" stroke-width="3"/>`),
  'verb n::nail': scene(
    `<rect x="13" y="88" width="102" height="14" rx="2" fill="#ce8b56" stroke="${ink}"/><path d="M60 89V64m-5 0h10" stroke="${ink}" stroke-width="3"/><path d="M19 78l13-5 14-2 9-4q4-1 4 2l-7 6h10q3 1 1 4l-11 3h9q2 2-1 4l-15 2-13-1-13 3z" fill="${skin}" stroke="${ink}"/><rect x="13" y="76" width="10" height="16" rx="2" fill="#22a49d" stroke="${ink}"/><g transform="rotate(-34 75 40)"><rect x="72" y="43" width="7" height="41" rx="3" fill="#db9d63" stroke="${ink}"/><rect x="63" y="35" width="27" height="11" rx="2" fill="#43577a" stroke="${ink}"/></g><path d="M60 51v5m-7-6 2 6m12-5-3 5" stroke="${ink}" stroke-width="1.5"/>`),
  'verb p::piggyback': scene(
    `<path d="M44 91l-2 19h12l8-17 9 17h12l-3-19" fill="#55749e" stroke="${ink}"/><path d="M41 113h13m17 0h13" stroke="${ink}" stroke-width="7"/><path d="M44 58q17-9 35 0l2 36H42z" fill="#239f9e" stroke="${ink}"/><path d="M49 54q-11 0-13 12l3 13h8l-2-13 11-4m23-8q11 0 13 12l-3 13h-8l2-13-11-4" fill="#59779e" stroke="${ink}"/><path d="M38 79h9m34 0h9" stroke="${ink}" stroke-width="5"/><path d="M55 33v8h13v-8" fill="${darkSkin}" stroke="${ink}"/><path d="M50 42q10-8 23 0l4 17H46z" fill="#edb94e" stroke="${ink}"/>` +
    head(62, 24, darkSkin) + head(62, 62) +
    arm('M51 43l-5 7 6 13', darkSkin) + arm('M72 43l6 7-6 13', darkSkin) + grip(52, 63, 25, darkSkin) + grip(72, 63, -25, darkSkin) +
    arm('M45 67l-9 12 5 1') + arm('M79 67l13 12-5 1') + grip(42, 79, 90) + grip(86, 79, -90)),
  'verb p::pinch': scene(
    `<path d="M50 105v-9q-10-14-7-26l7-21 7-15q2-4 5-2 3 1 2 5l-5 15-1 9q6-2 10 2l1-8-4-16q-2-4 1-6 3-1 5 3l10 23q8 15 0 28l-5 9v9z" fill="${skin}" stroke="${ink}" stroke-width="1.4"/><path d="M57 68q6-3 12 0m-17 7q7-4 14 0m-19 6q7-4 14 0" fill="none" stroke="#a67258" stroke-width="1.2"/><rect x="48" y="101" width="30" height="14" rx="2" fill="#1b9f97" stroke="${ink}"/><circle cx="64" cy="28" r="5" fill="#e98678" stroke="${ink}"/><path d="M54 17l-3-5m13 3v-5m9 7 3-5" stroke="${ink}" stroke-width="2"/>`),
  'verb r::ride in bus': scene(
    `<path d="M8 79V52q0-10 10-10h88q12 0 12 13v24z" fill="#f3bd44" stroke="${ink}" stroke-width="1.4"/><path d="M16 50h25v18H16zm30 0h18v18H46zm23 0h18v18H69zm23 0h16v29H92z" fill="#d9f2fa" stroke="${ink}"/><path d="M21 66V55h3l1 11" fill="#627ea3"/><path d="M26 67v-6q6-4 11 0v6" fill="#da915c" stroke="${ink}" stroke-width=".6"/><circle cx="31" cy="55" r="4.8" fill="${skin}" stroke="${ink}" stroke-width=".65"/><path d="M27 53q3-6 8-2l1 3-4-2-4 2" fill="#644438"/><path d="M33 55h.1m-3 0h.1" stroke="${ink}"/><circle cx="29" cy="79" r="9" fill="${ink}"/><circle cx="99" cy="79" r="9" fill="${ink}"/><path d="M7 90h114" stroke="#aab8c2" stroke-width="3"/>`),
  'verb t::type': scene(
    `<rect x="31" y="22" width="66" height="43" rx="4" fill="${ink}"/><rect x="35" y="26" width="58" height="35" rx="2" fill="#b8e4f4"/><path d="M42 33h29m-29 7h42m-42 7h24" stroke="#5177b0" stroke-width="2"/><path d="M25 69h78l13 22H12z" fill="#d0dbe2" stroke="${ink}"/><path d="M31 74h66M24 80h80m-87 6h94m-70-13-5 13m17-13-2 13m24-13 3 13m14-13 5 13" stroke="#8296a7" stroke-width="1.4"/><path d="M17 94h94" stroke="#ac7351" stroke-width="5"/><path d="M31 61l11-4 6 12 5 6 1 8q-1 2-3 0l-2-4 1 8q-1 3-3 0l-3-6 1 8q-1 2-3 0l-4-9 1 5q-1 3-3 0l-5-10-5-9zm66 0-11-4-6 12-5 6-1 8q1 2 3 0l2-4-1 8q1 3 3 0l3-6-1 8q1 2 3 0l4-9-1 5q1 3 3 0l5-10 5-9z" fill="${skin}" stroke="${ink}"/>`),
  'verb w::wash face': scene(
    person(48, 48, '#28a99f') +
    `<path d="M70 78h50q-2 12-16 14H84q-12-2-14-14zm21 14h7v17h-7z" fill="#e6f1f6" stroke="${ink}" stroke-width="1.5"/><path d="M95 78V64q0-8-8-8h-8v5h7q4 0 4 4v13" fill="#aebfcb" stroke="${ink}"/><path d="M79 64v9m-4-7v5" stroke="#31a9d3" stroke-width="1.5"/>` +
    arm('M37 59l-9-15 8-7') + arm('M59 59l9-15-8-7') + grip(37, 37, -22) + grip(59, 37, 22) +
    '<path d="M27 29l-3 5q0 4 3 4t3-4zm43 0-3 5q0 4 3 4t3-4z" fill="#31a9d3"/><path d="M39 40q9 9 18 0" fill="none" stroke="#75cceb" stroke-width="1.4"/>'),
  'verb d::dare': cheering('You can!', '#24aedd', '#e98678', true),
  'verb e::encourage': cheering('Go!', '#edb94e', '#2eaed4', false),
  'verb c::call': scene(speech(57, 12, 50, 'Hello!') + person(44, 55, '#19a892', skin, 'speaking') +
    arm('M34 66l-6 22') + grip(28, 88, 10) + arm('M54 66l9-11-3-12') +
    `<g transform="rotate(13 57 40)"><rect x="53" y="31" width="8" height="18" rx="2" fill="${ink}"/><rect x="54.5" y="33" width="5" height="12" rx="1" fill="#bce5f4"/><circle cx="57" cy="47" r=".8" fill="#fff"/></g>` + grip(61, 43, -12)),
  'verb d::drive': scene(
    `<rect x="5" y="92" width="118" height="8" rx="4" fill="#b0c0c8"/><path d="M10 84V72q0-9 17-10l12-21q4-7 13-7h36q8 0 12 8l9 18q9 3 9 12v12z" fill="#16afd7" stroke="${ink}" stroke-width="1.6"/><path d="M37 62l10-18q2-4 7-4h16v22zm39-22h11q5 0 8 5l8 17H76z" fill="#e1f5fa" stroke="${ink}"/><g transform="translate(104 0) scale(-1 1)"><path d="M35 63V50h5l2 13" fill="#536382" stroke="${ink}"/><path d="M45 61v-7q6-5 11 0l4 7" fill="#488ac6" stroke="${ink}"/><path d="M48 47v6h5v-6" fill="${skin}"/><path d="M43 45q0-7 7-7 6 0 7 6l3 3-4 1q-1 4-6 4-7 0-7-7z" fill="${skin}" stroke="${ink}"/><path d="M43 46q-3-10 6-10 6 0 8 5l-8 1-2 4z" fill="#644438"/><circle cx="54" cy="44.5" r=".8" fill="${ink}"/><circle cx="65" cy="55" r="5" fill="none" stroke="${ink}" stroke-width="2"/><path d="M51 55l5 4 6-3" fill="none" stroke="${skin}" stroke-width="3.4"/><path d="M54 56l6-5" fill="none" stroke="${skin}" stroke-width="3"/></g><path d="M31 65h77M77 69h8" stroke="#127b9e"/><circle cx="31" cy="84" r="11" fill="${ink}"/><circle cx="99" cy="84" r="11" fill="${ink}"/><circle cx="31" cy="84" r="4.5" fill="#e8eef2"/><circle cx="99" cy="84" r="4.5" fill="#e8eef2"/>` + grip(42, 53, -10)),
};

for (const [key, picture] of Object.entries(updatedPictures)) {
  pictures[key] = picture;
  const folder = key.split('::')[0];
  for (const label of (aliases as Record<string, string[]>)[key] ?? []) {
    pictures[`${folder}::${label}`] = picture;
  }
}
export default pictures;
