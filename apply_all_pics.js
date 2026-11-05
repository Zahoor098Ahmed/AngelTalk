const fs = require('fs');
const path = require('path');

const targetJsonPath = path.resolve('./frontend/src/modules/uniquePictures.json');
const p = JSON.parse(fs.readFileSync(targetJsonPath, 'utf8'));

const mapping = {
  // Toys & Park from screenshots
  "3d glasses": "test_37614.png",
  "action toy": "test_superhero_36728.png",
  "ball popper": "svg_ball_popper.svg",
  "water balloon": "svg_water_balloon.svg",
  "water snake": "svg_water_snake.svg",
  "tech top": "test_spinning_top_8663.png",
  "tornado tube": "test_tornado_5598.png",
  "wiggle pen": "svg_wiggle_pen.svg",
  "zip line": "test_zipline_36077.png",
  "zipline": "test_zipline_36077.png",
  "splash pad": "test_splash_30979.png",
  "picnic": "test_picnic_10236.png",
  "picnic table": "test_picnic_table_38415.png",
  "pond": "test_pond_39264.png",
  "roundabout": "test_roundabout_38554.png",
  "lamp post": "test_lamp_post_2393.png",

  // Music words
  "vibraslap": "C:/Users/Zahoor/.gemini/antigravity/brain/df1543ec-f51c-462a-93bd-2beca8b87e59/arasaac_vibraslap_1793860379802.jpg",
  "tom tom": "scratch_tomtom_2578.png",
  "smile drum": "scratch_steel_drum_37707.png",
  "shaker": "scratch_shaker_2463.png",
  "rhythm stick": "scratch_rhythm_stick_23937.png",
  "guitar pick": "svg_guitar_pick.svg",
  "hi-hat": "scratch_hihat_2531.png",
  "bugle": "scratch_bugle_5974.png",
  "cajon": "scratch_cajon_23867.png",
  "chimes": "scratch_chimes_39152.png",
  "bell stick": "scratch_5949.png",
  "brushes": "svg_brushes.svg"
};

let updatedCount = 0;

for (const [key, filePath] of Object.entries(mapping)) {
  if (!fs.existsSync(filePath)) {
    console.error("File does not exist for:", key, filePath);
    process.exit(1);
  }
  const ext = path.extname(filePath).toLowerCase();
  const fileBuf = fs.readFileSync(filePath);
  let dataUri = '';
  if (ext === '.svg') {
    dataUri = `data:image/svg+xml;base64,${fileBuf.toString('base64')}`;
  } else if (ext === '.png') {
    dataUri = `data:image/png;base64,${fileBuf.toString('base64')}`;
  } else if (ext === '.jpg' || ext === '.jpeg') {
    dataUri = `data:image/jpeg;base64,${fileBuf.toString('base64')}`;
  } else {
    throw new Error(`Unsupported extension: ${ext}`);
  }

  p[key] = dataUri;
  updatedCount++;
  console.log(`Updated [${key}] with ${ext} (uri length: ${dataUri.length})`);
}

fs.writeFileSync(targetJsonPath, JSON.stringify(p, null, 2), 'utf8');
console.log(`Successfully saved ${updatedCount} pictures to uniquePictures.json!`);

