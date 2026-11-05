const fs = require('fs');

const p = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));
const dict = JSON.parse(fs.readFileSync('./frontend/src/modules/arasaacDict.json', 'utf8'));

const pronouns = [
  "he", "her", "hers", "herself", "him", "himself",
  "his", "i", "it", "its", "itself", "me", "mine", "my", "myself",
  "our", "ours", "ourselves", "she", "that", "their", "theirs", "them",
  "themselves", "they", "us", "we", "who", "whom", "whose", "you", "your",
  "yours", "yourself", "yourselves"
];

const res = {};
pronouns.forEach(w => {
  res[w] = {
    inUnique: !!p[w],
    dict: dict[w]
  };
});
console.log(JSON.stringify(res, null, 2));

