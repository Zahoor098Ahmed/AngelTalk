const fs = require('fs');

const files = [
  "test_zipline_36077.png",
  "test_splash_30979.png",
  "test_picnic_10236.png",
  "test_picnic_table_38415.png",
  "test_pond_39264.png",
  "test_roundabout_38554.png",
  "test_lamp_post_2393.png",
  "test_spinning_top_8663.png",
  "test_superhero_36728.png",
  "test_tornado_5598.png"
];

files.forEach(f => {
  const stat = fs.statSync(f);
  console.log(f, "size:", stat.size);
});

