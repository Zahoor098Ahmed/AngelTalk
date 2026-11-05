const fs = require('fs');

// Check dimensions and colors of the 5 images
["inspect_temple.png", "inspect_store.png", "inspect_savannah.png", "inspect_plant_room.png", "inspect_gurdwara.png"].forEach(f => {
  const buf = fs.readFileSync(f);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  console.log(f, `${w}x${h}`, "file size:", buf.length);
});

