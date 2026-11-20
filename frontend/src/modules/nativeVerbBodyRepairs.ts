import originals from "./verbPictureReplacements";

function svg(content: string): string {
  return "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="1024" height="1024"><rect width="128" height="128" fill="#fff"/>${content}</svg>`);
}

function legs(center: number, top = 76): string {
  return `<path d="M${center - 7} ${top}l-2 ${111 - top}m16-${111 - top} 2 ${111 - top}" fill="none" stroke="#64789e" stroke-width="9" stroke-linecap="round"/><path d="M${center - 9} 112h-5m23 0h5" stroke="#364458" stroke-width="7" stroke-linecap="round"/>`;
}

const repairs: Record<string, string> = {};
for (const [key, uri] of Object.entries(originals)) {
  const xml = decodeURIComponent(uri.slice(uri.indexOf(",") + 1));
  let content = xml.slice(xml.indexOf(">") + 1, xml.lastIndexOf("</svg>"));
  // Preserve the existing editable SVG art and its exact palette; connect the shared head/torso.
  content = content.replace(/<circle cy="32" r="13" fill="([^"]+)"\/>/g,
    (_, skin: string) => `<rect x="-4" y="42" width="8" height="10" rx="2" fill="${skin}"/><circle cy="32" r="13" fill="${skin}" stroke="#394353" stroke-width="1"/>`);
  content = content.replaceAll('<path d="M-4 36q4 5 8 0"', '<circle cx="-4" cy="31" r="1.4" fill="#394353"/><circle cx="4" cy="31" r="1.4" fill="#394353"/><path d="M-4 36q4 5 8 0"');
  content = content.replace(/<rect x="-13" y="49" width="26" height="29" rx="8" fill="([^"]+)"\/>/g,
    (_, shirt: string) => `<rect x="-13" y="49" width="26" height="29" rx="8" fill="${shirt}" stroke="#394353" stroke-width="1"/>`);

  if (["verb b::borrow", "verb g::give"].includes(key)) {
    content += '<path d="M22 55 18 75m88-20 4 20" fill="none" stroke="#b68469" stroke-width="7" stroke-linecap="round"/>';
  }
  if (key === "verb b::build") content += '<path d="M19 55 15 75" fill="none" stroke="#b58064" stroke-width="7" stroke-linecap="round"/>';
  if (key === "verb b::brush hair") {
    content += '<circle cx="46" cy="55" r="1.8" fill="#394353"/><circle cx="58" cy="55" r="1.8" fill="#394353"/>';
    content = legs(51, 78) + '<rect x="46" y="48" width="9" height="12" fill="#dda584"/><path d="M36 59 28 78" fill="none" stroke="#dda584" stroke-width="7" stroke-linecap="round"/>' + `<g transform="translate(12 -7) scale(.78)">${content}</g>`;
  }
  if (key === "verb d::drink") {
    content = legs(49, 76) + '<path d="M34 57 27 78" fill="none" stroke="#bb845f" stroke-width="7" stroke-linecap="round"/>' + `<g transform="translate(7 -2) scale(.7)">${content}</g>`;
  }
  if (key === "verb p::pet") {
    content = '<rect x="31" y="49" width="6" height="10" fill="#dda584"/>' + content + '<path d="M25 57 20 76" fill="none" stroke="#bc8567" stroke-width="7" stroke-linecap="round"/>';
  }
  if (key === "verb e::enjoy") content += '<circle cx="59" cy="39" r="1.5" fill="#394353"/><circle cx="69" cy="39" r="1.5" fill="#394353"/>';
  content = content.replace(/<ellipse cx="64" cy="113" rx="25" ry="3" fill="#e3e9eb"\/>/g, "");
  content = content.replace(/<ellipse\b[^>]*\/>/g, (element) => {
    const cy = Number(element.match(/cy="([\d.]+)"/)?.[1]);
    const ry = Number(element.match(/ry="([\d.]+)"/)?.[1]);
    const color = element.match(/fill="#([\da-f]{6})"/i)?.[1];
    if (cy >= 100 && ry <= 5 && color) {
      const channels = [0, 2, 4].map((offset) => parseInt(color.slice(offset, offset + 2), 16));
      if (Math.min(...channels) > 180 && Math.max(...channels) - Math.min(...channels) < 20) return "";
    }
    return element;
  });
  content = content.replace(/<path d="(?:M20 108h91|M17 104h95|M21 107h92)"[^>]*\/>/g, "");
  repairs[key] = svg(content);
}
// The C cards need visible hands and connected limbs at small AAC tile sizes.
const outline = '#394353';
function child(shirt: string, skin: string, hair: string): string {
  return `<g stroke="${outline}" stroke-width="1.1" stroke-linejoin="round"><path d="M53 76l-3 33h10l4-27 4 27h10l-3-33" fill="#64789e"/><path d="M50 108l-5 5q-1 4 15 2v-7m8 0v7q17 2 15-2l-6-5" fill="#364458"/><path d="M59 43v9h10v-9" fill="${skin}"/><path d="M51 52q13-7 26 0l-1 27H52z" fill="${shirt}"/><circle cx="64" cy="31" r="15" fill="${skin}"/><path d="M49 31q-2-20 16-18 16 1 14 17-9-1-14-8-5 9-16 9z" fill="${hair}"/><g fill="${outline}" stroke="none"><circle cx="59" cy="32" r="1.5"/><circle cx="69" cy="32" r="1.5"/></g><path d="M59 38q5 5 10 0" fill="none" stroke-linecap="round"/></g>`;
}
const arm = (d: string, skin: string) => `<path d="${d}" fill="none" stroke="${outline}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${skin}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
repairs['verb c::carry'] = svg(child('#76a99c','#dda584','#64483c') +
  '<rect x="43" y="56" width="42" height="29" rx="2" fill="#b58164" stroke="#394353" stroke-width="1.1"/><path d="M61 57h6v12h-6z" fill="#e6ba8a"/>' +
  arm('M51 55 42 69 47 78','#dda584') + arm('M77 55 86 69 81 78','#dda584') +
  '<path d="M45 75q5-3 8 0v6h-7zm38 0q-5-3-8 0v6h7z" fill="#dda584" stroke="#394353" stroke-width="1"/><path d="M48 77h4m-4 2h4m28-2h-4m4 2h-4" stroke="#a57254" stroke-width=".7"/>');
repairs['verb c::clap'] = svg(child('#a69ac4','#dda584','#64483c') +
  arm('M52 55 46 70 59 64','#dda584') + arm('M76 55 82 70 69 64','#dda584') +
  '<path d="M58 65l-2-7q-1-3 1-4l4 5v-8q0-3 2-3l2 3 2 8 4-5q2 0 1 3l-3 8-5 3z" fill="#dda584" stroke="#394353" stroke-width="1"/><path d="M61 53l2 8m3-8 1 8" stroke="#a57254" stroke-width=".7"/><path d="M53 47l-4-4m15 2v-6m11 8 4-4" stroke="#d4a562" stroke-width="2" stroke-linecap="round"/>');
repairs['verb c::catch'] = svg(`<g transform="translate(-18 0)">${child('#8d9bc2','#b58064','#443732')}</g>` +
  arm('M35 55 46 72 70 64','#b58064') + arm('M57 54 66 61 76 50','#b58064') +
  '<circle cx="84" cy="52" r="11" fill="#d29a8a" stroke="#394353" stroke-width="1.1"/><path d="M68 65q8 3 12-1l5-6q0-2-2-1l-5 3-6-2zm6-13 4-8q2-1 2 1l-1 7-2 4z" fill="#b58064" stroke="#394353" stroke-width="1"/><path d="M110 29q-13-8-22 6m0-6-1 7 7-2" fill="none" stroke="#64789e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>');
repairs['verb c::crawl'] = svg(
  '<g stroke="#394353" stroke-width="1.1" stroke-linejoin="round"><path d="M76 64v24h24v9H70q-5 0-5-6V65m19-2 7 18h19v9H86q-4 0-5-4L73 66" fill="#53699a"/><path d="M99 88l7-4q5-2 6 2l-4 10h-9zm11-7 4-4q4-2 5 2l-1 10h-8z" fill="#293b55"/><path d="M43 53q17-7 38 4l-3 16q-20-9-36-3z" fill="#d6a05d"/>' +
  '<path d="M42 61 35 89l-3 10h-10q-3 0-2-3l8-3 5-29m20 1 3 26-2 8H43q-3 0-2-3l7-3-6-26" fill="#bb845f"/><path d="M23 96h6m16 0h6" stroke="#80553e" stroke-width=".7"/><path d="M39 58l6 5-7 8-6-5" fill="#e1ad8b"/><circle cx="28" cy="62" r="14" fill="#e1ad8b"/><path d="M14 61q-1-19 16-17 11 1 12 12l-12-5-7 8-6 9z" fill="#664a39"/><circle cx="26" cy="64" r="1.4" fill="#293b55"/><path d="M29 69q3 3 6 0" fill="none" stroke-linecap="round"/></g><path d="M66 27H34m8-7-8 7 8 7" fill="none" stroke="#5e7191" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>');
export default repairs;
