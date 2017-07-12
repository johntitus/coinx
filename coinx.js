#!/usr/bin/env node


var program = require('commander');

program
  .version('0.1.0')
  .command('price [symbol]', 'get the price of a coin from all exchanges').alias('p')
  .command('buy [symbol]', 'buy a coin from an exchange. Auto finds the best price.').alias('b')
  .command('config [exchange]', 'set your api keys for an exchange').alias('c')
  .command('funds', 'get a list of your funds from the exchanges').alias('f')
  .parse(process.argv);