'use strict';

const _ = require('lodash');
const coinx = require('./coinx-core');
const chalk = require('chalk');
const program = require('commander');
const capitalize = require('capitalize');
const inquirer = require('inquirer');
const columnify = require('columnify');
const cryptocompare = require('../lib/cryptocompare');
const coinsLookup = coinx.coins();
const config = coinx.config();
const exchanges = coinx.exchanges();
let exchangesToCheck = [];

if (Object.keys(coinsLookup).length === 0) {
	console.error(chalk.red('Please run `coinx update` to get the latest list of coins.'));
	process.exit(1);
}

if (Object.keys(config).length === 0) {
	console.log(chalk.red('Need to configure at least one exchange.'));
	console.log(chalk.red('Run \'coinx configure [name of exchange]\''));
	process.exit(1);
}

program
	.option('-e, --exchange [name]', 'Get balances at the specified exchange.')
	.option('-a, --alphabetically', 'Sort the balance list alphabetically.')
	.option('-n, --numerically', 'Sort the balance list by the number of coins, descending.')
	.option('-c, --coin [symbol]', 'Only get balances for this coin.')
	.option('-v, --value', 'Sort the balance list by the value of each coin in US dollars, descending.')
	.parse(process.argv);

if (program.exchange) {
	if (Object.keys(exchanges).indexOf(program.exchange) === -1) {
		console.log(chalk.red('Unknown exchange'));
		process.exit(1);
	}
	if (Object.keys(config).indexOf(program.exchange) === -1) {
		console.log(chalk.red('Exchange is not configured'));
		process.exit(1);
	}
	exchangesToCheck.push(exchanges[program.exchange]);
	console.log(chalk.blue('Getting balances on ' + capitalize(program.exchange) + '...'));
} else {
	for (const name in config) {
		if (name !== 'passwordHash') {
			exchangesToCheck.push(exchanges[name]);
		}
	}
	console.log(chalk.blue('Getting balances...'));
}

let requests = exchangesToCheck.map(exchange => {
	return exchange.getBalances().then(balance => {
		if (!balance.available) {
			console.log(chalk.red(capitalize(balance.market) + ' returned an error. Is your API key and secret correct?'));
		}
		return balance;
	})
});

let balances;

Promise
	.all(requests)
	.then(results => {
		let fsymbols = [];
		balances = results;

		balances.forEach(exchange => {
			if (exchange.available) {
				Object.keys(exchange.funds).forEach(coin => {
					if (coin == 'CH') {
						coin = 'BCH';
					}
					fsymbols.push(coin);

					// remove coin if balance is zero
					if (exchange.funds[coin] == 0) delete exchange.funds[coin];
				});
			}
		});
		
		// Cryptocompare seems to break occasionaly if > 50 symbols are sent into 
		// priceMulti at the same time.
		fsymbols = _.uniq(fsymbols);

		var i, j, temparray, chunk = 30;
		let tasks = [];
		for (i = 0, j = fsymbols.length; i < j; i += chunk) {			
			tasks.push(cryptocompare.priceMulti(fsymbols.slice(i, i + chunk), 'USD'));			
		}		

		return Promise.all(tasks).then( results => {
			let prices = {};
			results.forEach( result => {
				Object.keys(result).forEach( item => {
					prices[item] = result[item]
				});
			});
			return prices;
		});
	})
	.then(prices => {
		
		balances.forEach(balance => {
			if (balance.available) {
				let funds = balance.funds;
				let coins = Object.keys(funds).map(coin => {
					let name = (coinsLookup[coin]) ? coinsLookup[coin].name : '';
					if (coin == 'CH') name = 'Bitcoin Cash';
					if (coin == 'IOT') name = 'IOTA';
					let valueUSD = (coin != 'CH') ? funds[coin] * prices[coin] : funds[coin] * prices['BCH'];
					return {
						name: name,
						symbol: coin,
						count: funds[coin],
						valueUSD: valueUSD
					}
				});

				if (program.coin) {
					coins = coins.filter(coin => {
						return coin.symbol.toLowerCase() == program.coin.toLowerCase();
					});
					if (coins.length == 0) {
						if (program.exchange) {
							console.log(chalk.red('Coin not found on this exchange.'));
						}
						return;
					}
				}
				if (program.alphabetically) {
					coins.sort((a, b) => {
						if (a.name < b.name) {
							return -1;
						} else {
							return 1;
						}
					});
				} else if (program.numerically) {
					coins.sort((a, b) => {
						if (a.count > b.count) {
							return -1;
						} else {
							return 1;
						}
					});
				} else {
					coins.sort((a, b) => {
						if (parseFloat(a.valueUSD) > parseFloat(b.valueUSD)) {
							return -1;
						} else {
							return 1;
						}
					});
				}

				let total = {
					name: 'Total',
					valueUSD: 0
				}
				coins.forEach(coin => {
					total.valueUSD += coin.valueUSD;
				});
				coins.push(total);

				let columns = columnify(coins, {
					columns: ['name', 'symbol', 'count', 'valueUSD'],
					config: {
						name: {
							headingTransform: function(heading) {
								return capitalize(heading);
							}
						},
						symbol: {
							headingTransform: function(heading) {
								return capitalize(heading);
							}
						},
						count: {
							headingTransform: function(heading) {
								return capitalize(heading);
							},
							dataTransform: function(data) {
								return (data) ? parseFloat(data).toFixed(8) : '';
							},
							align: 'right'
						},
						valueUSD: {
							headingTransform: function() {
								return 'Value USD';
							},
							dataTransform: function(data) {
								return '$' + parseFloat(data).toFixed(2);
							},
							align: 'right'
						}
					}
				});
				console.log(chalk.green(capitalize(balance.market)));
				console.log(columns);
			}
		});
	});