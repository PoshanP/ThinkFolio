// Utility functions

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function greet(name) {
  return `Hello, ${name}!`;
}

module.exports = { getRandomNumber, greet };
