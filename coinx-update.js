'use strict';

const program = require('commander');
const chalk = require('chalk');
const homedir = require('homedir');
const path = require('path');
const fs = require('fs');
const coinmarketcap = require('./lib/coinmarketcap');

const coinxHome = path.join(homedir(), 'coinx');
const coinListPath = path.join(coinxHome, 'coinList.json');

console.log(chalk.blue('Updating coin list...'));

coinmarketcap.getList().then( data => {
	let coins = {};
	data.forEach(coin => {
		coins[coin.symbol] = coin;
	})
	fs.writeFileSync(coinListPath, JSON.stringify(coins));
	console.log(chalk.green('Coin list updated.'));

});