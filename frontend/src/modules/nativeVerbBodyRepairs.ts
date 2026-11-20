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
export default repairs;
