#!/usr/bin/env node
var program = require('commander');

program
  .version(require('../package.json').version)
  .command('price [symbol]', 'get the price of a coin from all exchanges').alias('p')
  .command('buy [symbol]', 'buy a coin from an exchange. Auto finds the best price.').alias('b')
  .command('action [name]', 'run an automated action, such as buying multiple coins.').alias('a')
  .command('config [exchange]', 'set your api keys for an exchange').alias('c')
  .command('funds', 'get a list of your funds from the exchanges').alias('f')
  .command('update', 'updates the list of known coins').alias('u')
  .command('lock', 'encrypts configuration file with a password').alias('l')
  .command('unlock', 'decrypts configuration file with a password').alias('u')
  .parse(process.argv);
