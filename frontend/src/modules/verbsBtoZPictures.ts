// Generated from reviewed full-body verb restorations; all forms share the same HD image.
import part0 from "./verbsBtoZ.part-00.json";
import part1 from "./verbsBtoZ.part-01.json";
import part2 from "./verbsBtoZ.part-02.json";
import part3 from "./verbsBtoZ.part-03.json";
import part4 from "./verbsBtoZ.part-04.json";
import part5 from "./verbsBtoZ.part-05.json";
import aliases from "./verbsBtoZAliases.json";
const pictures: Record<string,string> = Object.assign({}, part0, part1, part2, part3, part4, part5);
for (const [key, labels] of Object.entries(aliases)) {
  const folder=key.split("::")[0];
  for (const label of labels) pictures[`${folder}::${label}`]=pictures[key];
}
export default pictures;
