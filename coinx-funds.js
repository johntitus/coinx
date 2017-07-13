'use strict';

const path = require('path');
const fs = require('fs');
const program = require('commander');
const chalk = require('chalk');
const homedir = require('homedir');
const capitalize = require('capitalize');
const inquirer = require('inquirer');
const columnify = require('columnify');

const Poloniex = require('./lib/poloniex');
const Liqui = require('./lib/liqui');
const Bittrex = require('./lib/bittrex');
const Bitfinex = require('./lib/bitfinex');
const Kraken = require('./lib/kraken');

const coinxHome = path.join(homedir(), 'coinx');
const keyFilePath = path.join(coinxHome, 'coinx.json');

let configured = true;
if (!fs.existsSync(keyFilePath)) showNotConfigured();

let keys = require(keyFilePath);
if (!Object.keys(keys).length) showNotConfigured();

program
	.option('-e, --exchange [name]', 'Get balances at the specified exchange.')
	.option('-a, --alphabetically', 'Sort the balance list alphabetically.')
	.option('-n, --numerically', 'Sort the balance list by the number of coins, descending.')
	.option('-c, --coin [symbol]', 'Only get balances for this coin.')
	.parse(process.argv);

let validExchanges = [
	'poloniex',
	'bittrex',
	'liqui',
	'kraken',
	'bitfinex'
];

let exchanges = [];

if (program.exchange){
	if (validExchanges.indexOf(program.exchange) == -1){
		console.log(chalk.red('Unknown exchange'));
		process.exit(1);
	}
	if (program.exchange == 'poloniex' && keys['poloniex']) exchanges.push(new Poloniex(keys['poloniex'].apiKey, keys['poloniex'].apiSecret));
	if (program.exchange == 'kraken' && keys['kraken']) exchanges.push(new Kraken(keys['kraken'].apiKey, keys['kraken'].apiSecret));
	if (program.exchange == 'liqui' && keys['liqui']) exchanges.push(new Liqui(keys['liqui'].apiKey, keys['liqui'].apiSecret));
	if (program.exchange == 'bittrex' && keys['bittrex']) exchanges.push(new Bittrex(keys['bittrex'].apiKey, keys['bittrex'].apiSecret));
	if (program.exchange == 'bitfinex' && keys['bitfinex']) exchanges.push(new Bitfinex(keys['bitfinex'].apiKey, keys['bitfinex'].apiSecret));

	console.log(chalk.blue('Getting balances on ' + capitalize(program.exchange) + '...'));
} else {
	if (keys['poloniex']) exchanges.push(new Poloniex(keys['poloniex'].apiKey, keys['poloniex'].apiSecret));
	if (keys['kraken']) exchanges.push(new Kraken(keys['kraken'].apiKey, keys['kraken'].apiSecret));
	if (keys['liqui']) exchanges.push(new Liqui(keys['liqui'].apiKey, keys['liqui'].apiSecret));
	if (keys['bittrex']) exchanges.push(new Bittrex(keys['bittrex'].apiKey, keys['bittrex'].apiSecret));
	if (keys['bitfinex']) exchanges.push(new Bitfinex(keys['bitfinex'].apiKey, keys['bitfinex'].apiSecret));

	console.log(chalk.blue('Getting balances...'));
}

let requests = exchanges.map(exchange => {
	return exchange.getBalances().then( balance => {
		if (!balance.available){
			console.log(chalk.red(capitalize(balance.market) + ' returned an error. Is your API key and secret correct?'));
		}
		return balance;
	})
});

Promise
	.all(requests)
	.then(balances => {
		balances.forEach(balance => {
			if (balance.available){
				let funds = balance.funds;
				let coins = Object.keys( funds ).map( coin => {
					return {
						coin: coin,
						count: funds[coin]
					}
				});
				if (program.coin){
					coins = coins.filter( coin => {
						return coin.coin.toLowerCase() == program.coin.toLowerCase();
					});
					if (coins.length == 0){
						console.log(chalk.red('Coin not found on this exchange'));
						process.exit(0);
					}
				}
				if (program.alphabetically){
					coins.sort( (a, b) => {
						if (a.coin < b.coin){
							return -1;
						} else {
							return 1;
						}
					})
				}
				if (program.numerically){
					coins.sort( (a, b) => {
						if (a.count > b.count){
							return -1;
						} else {
							return 1;
						}
					})
				}
				let columns = columnify(coins, {
					columns: ['coin', 'count'],
					config: {
						coin: {
							headingTransform: function(heading) {
								return capitalize(heading);
							}
						},
						count: {
							headingTransform: function(heading) {
								return capitalize(heading);
							},
							dataTransform: function(data) {
								return parseFloat(data).toFixed(8);
							},
							align: 'right'
						}
					}
				});
				console.log(chalk.green(capitalize(balance.market)));
				console.log(columns);
				console.log('');
			}
		});
	});

function showNotConfigured() {
	console.log(chalk.red('Need to configure at least one exchange.'));
	console.log(chalk.red('Run \'coinx configure [name of exchange]\''));
	process.exit(1);
}