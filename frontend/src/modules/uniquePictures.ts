// Generated word picture dictionary, split without changing image data.
import part0 from "./uniquePictures.json";
import part1 from "./uniquePictures.part-01.json";
import part2 from "./uniquePictures.part-02.json";
import part3 from "./uniquePictures.part-03.json";
import part4 from "./uniquePictures.part-04.json";
import part5 from "./uniquePictures.part-05.json";
import clarityPictures from "./clarityPictureReplacements.json";
import everydayPictures from "./everydayPictureReplacements.json";
import hygienePictures from "./hygienePictureReplacements.json";
import animalPictures from "./animalPictureReplacements.json";
import nutsSoupsSweetsVegetablesPictures from "./nutsSoupsSweetsVegetablesPictures.json";
import cookedFoodPictures from "./cookedFoodPictureReplacements.json";
import meatAndFishPictures from "./meatAndFishPictureReplacements.json";
import fruitPictures from "./fruitPictureReplacements.json";
import drinkPictures from "./drinkPictureReplacements.json";
import dairyPictures from "./dairyPictureReplacements.json";
import condimentPictures from "./condimentPictureReplacements.json";
import breadPictures from "./breadPictureReplacements.json";
import vehiclePictures from "./vehiclePictureReplacements.json";
import kitchenPictures from "./kitchenPictureReplacements.json";
import requestedPictures from "./requestedPictureReplacements.json";
import peoplePrepositions from "./peoplePrepositionPictures.json";
import peoplePronouns from "./peoplePronounPictures.json";
import peopleSchool from "./peopleSchoolPictures.json";
import peopleVerbA from "./peopleVerbAPictures.json";
import verbPictureReplacements from "./nativeVerbBodyRepairs";
import verbsBtoZPictures from "./verbsBtoZPictures";
import verbScreenshotFixes from "./verbScreenshotFixes";
import sportsAndFitnessPictures from "./sportsAndFitnessPictures.json";

const pictures: Record<string, string> = Object.assign({}, part0, part1, part2, part3, part4, part5, vehiclePictures, breadPictures, condimentPictures, dairyPictures, drinkPictures, fruitPictures, meatAndFishPictures, cookedFoodPictures, nutsSoupsSweetsVegetablesPictures, animalPictures, hygienePictures, everydayPictures, clarityPictures);
Object.assign(pictures, kitchenPictures, requestedPictures, peoplePrepositions, peoplePronouns, peopleSchool, peopleVerbA);
for (const [word, picture] of Object.entries(verbPictureReplacements)) {
  pictures[word] = picture;
}
Object.assign(pictures, verbsBtoZPictures);
Object.assign(pictures, verbScreenshotFixes);
Object.assign(pictures, sportsAndFitnessPictures);
for (const [word, picture] of Object.entries({ ...breadPictures, ...condimentPictures, ...dairyPictures, ...drinkPictures, ...fruitPictures })) {
  pictures[`food and drinks::${word}`] = picture;
}
export default pictures;
