const fs = require('fs');

const files = [
  "test_37614.png",
  "test_superhero_36728.png",
  "svg_ball_popper.svg",
  "svg_water_balloon.svg",
  "svg_water_snake.svg",
  "test_spinning_top_8663.png",
  "test_tornado_5598.png",
  "svg_wiggle_pen.svg",
  "test_zipline_36077.png",
  "test_splash_30979.png",
  "test_picnic_10236.png",
  "test_picnic_table_38415.png",
  "test_pond_39264.png",
  "test_roundabout_38554.png",
  "test_lamp_post_2393.png",
  "C:/Users/Zahoor/.gemini/antigravity/brain/df1543ec-f51c-462a-93bd-2beca8b87e59/arasaac_vibraslap_1793860379802.jpg",
  "scratch_tomtom_2578.png",
  "scratch_steel_drum_37707.png",
  "scratch_shaker_2463.png",
  "scratch_rhythm_stick_23937.png",
  "svg_guitar_pick.svg",
  "scratch_hihat_2531.png",
  "scratch_bugle_5974.png",
  "scratch_cajon_23867.png",
  "scratch_chimes_39152.png",
  "scratch_5949.png",
  "svg_brushes.svg"
];

files.forEach(f => {
  console.log(f, fs.existsSync(f) ? `EXISTS (${fs.statSync(f).size}b)` : "NOT FOUND");
});

