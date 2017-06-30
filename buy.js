#!/usr/bin/env node

var program = require('commander');

program
  .option('-f, --force', 'force installation')
  .parse(process.argv);

var symbol = program.args;

console.log('will buy', symbol)