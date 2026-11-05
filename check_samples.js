const fs = require('fs');

console.log("sample_3d.jpg size:", fs.statSync("sample_3d.jpg").size);
console.log("sample_action_toy.jpg size:", fs.statSync("sample_action_toy.jpg").size);
console.log("sample_ball_popper.png size:", fs.statSync("sample_ball_popper.png").size);
console.log("sample_bear.png size:", fs.statSync("sample_bear.png").size);

