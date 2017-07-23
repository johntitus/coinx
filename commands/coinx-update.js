'use strict';

const coinx = require('./coinx-core');
const program = require('commander');
const chalk = require('chalk');
const homedir = require('homedir');
const path = require('path');
const coinmarketcap = require('../lib/coinmarketcap');

console.log(chalk.blue('Updating coin list...'));

coinmarketcap.getList().then( data => {
	let coins = {};
	data.forEach(coin => {
		coins[coin.symbol] = coin;
	})
	coinx.coins(coins);
	console.log(chalk.green('Coin list updated.'));
});
