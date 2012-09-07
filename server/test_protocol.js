var protocol = require('./protocol.js');

console.log(protocol.parse('1 1 123123 HELLO WORLD'));
console.log(protocol.parse('1 1 123123'));
console.log(protocol.parse('1 9 123123'));
console.log(protocol.parse('1 4 1'));
console.log(protocol.parse('1 4 1909'));
console.log(protocol.parse('1 1000 1999'));
console.log(protocol.parse('1 1000 1999 12312a'));
