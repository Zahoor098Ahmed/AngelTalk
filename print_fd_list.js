const fs = require('fs');

const fruits = JSON.parse(fs.readFileSync('fruits_words.json', 'utf8'));
const drinks = JSON.parse(fs.readFileSync('drinks_words.json', 'utf8'));

console.log('--- 33 FRUITS ---');
console.log(fruits.join(', '));

console.log('\n--- 44 DRINKS ---');
console.log(drinks.join(', '));
