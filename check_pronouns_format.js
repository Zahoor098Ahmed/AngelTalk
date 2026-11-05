const fs = require('fs');

const p = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

const pronouns = [
  "he", "her", "hers", "herself", "him", "himself",
  "his", "i", "it", "its", "itself", "me", "mine", "my", "myself",
  "our", "ours", "ourselves", "she", "that", "their", "theirs", "them",
  "themselves", "they", "us", "we", "who", "whom", "whose", "you", "your",
  "yours", "yourself", "yourselves"
];

pronouns.forEach(w => {
  const val = p[w];
  if (val) {
    const isPng = val.startsWith("data:image/png");
    const isJpg = val.startsWith("data:image/jpeg");
    const isSvg = val.startsWith("data:image/svg");
    console.log(`${w}: format=${isPng ? 'png' : isJpg ? 'jpg' : isSvg ? 'svg' : 'other'}, len=${val.length}`);
  } else {
    console.log(`${w}: MISSING`);
  }
});

