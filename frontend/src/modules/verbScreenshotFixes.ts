import images from './verbScreenshotFixes.json';

const pictures: Record<string, string> = { ...images };
const forms: Record<string, string[]> = {
  add: ['add', 'added', 'adding', 'adds'],
  apply: ['apply', 'applied', 'applying', 'applies'],
  assist: ['assist', 'assisted', 'assisting', 'assists'],
};
for (const [base, labels] of Object.entries(forms)) {
  for (const label of labels) pictures[`verb a::${label}`] = pictures[`verb a::${base}`];
}
export default pictures;
