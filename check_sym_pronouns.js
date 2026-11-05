const fs = require('fs');

const sym = JSON.parse(fs.readFileSync('./frontend/src/modules/symbolPictures.json', 'utf8'));
const pronouns = [
  "he", "her", "hers", "herself", "him", "himself",
  "his", "i", "it", "its", "itself", "me", "mine", "my", "myself",
  "our", "ours", "ourselves", "she", "that", "their", "theirs", "them",
  "themselves", "they", "us", "we", "who", "whom", "whose", "you", "your",
  "yours", "yourself", "yourselves"
];

const inSym = [];
pronouns.forEach(w => {
  if (sym[w]) inSym.push(w);
});
console.log("In symbolPictures:", inSym);

