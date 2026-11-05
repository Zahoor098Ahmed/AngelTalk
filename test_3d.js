const fs = require('fs');
const p = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

fs.writeFileSync("sample_3d.jpg", Buffer.from(p["3d glasses"].replace(/^data:image\/jpeg;base64,/, ""), 'base64'));
fs.writeFileSync("sample_action_toy.jpg", Buffer.from(p["action toy"].replace(/^data:image\/jpeg;base64,/, ""), 'base64'));
fs.writeFileSync("sample_ball_popper.png", Buffer.from(p["ball popper"].replace(/^data:image\/png;base64,/, ""), 'base64'));

console.log("3d glasses == action toy?", p["3d glasses"] === p["action toy"]);

