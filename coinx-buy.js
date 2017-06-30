'use strict';

const path = require('path');
const fs = require('fs');
const program = require('commander');
const chalk = require('chalk');
const homedir = require('homedir');
const capitalize = require('capitalize');
const inquirer = require('inquirer');
const columnify = require('columnify');

const Poloniex = require('./exchanges/poloniex');
const Liqui = require('./exchanges/liqui');
const Bittrex = require('./exchanges/bittrex');
const Bitfinex = require('./exchanges/bitfinex');
const Kraken = require('./exchanges/kraken');

const coinxHome = path.join(homedir(), 'coinx');
const keyFilePath = path.join(coinxHome, 'coinx.json');

let configured = true;
if (!fs.existsSync(keyFilePath)) showNotConfigured();

let keys = require(keyFilePath);
if (!Object.keys(keys).length) showNotConfigured();

program
	.option('-$, --usd [amount]', 'Amount of US Dollars to spend.')
	.option('-e, --exchange [name]', 'A specific exchange to buy from.')
	.parse(process.argv);

let symbol = program.args;

if (!symbol.length) {
	console.error(chalk.red('No coin symbol provided.'));
	process.exit(1);
}

symbol = symbol[0].toUpperCase();

if (!program.usd) {
	console.log(chalk.red('You must specify the amount of USD to spend. -$ or --usd'));
}

let validExchanges = [
	'poloniex',
	'bittrex',
	'liqui',
	'kraken',
	'bitfinex'
];

let exchanges = [];

if (program.exchange) {
	if (validExchanges.indexOf(program.exchange) == -1) {
		console.log(chalk.red('Unknown exchange'));
		process.exit(1);
	}
	if (program.exchange == 'poloniex' && keys['poloniex']) exchanges.push(new Poloniex(keys['poloniex'].apiKey, keys['poloniex'].apiSecret));
	if (program.exchange == 'kraken' && keys['kraken']) exchanges.push(new Kraken(keys['kraken'].apiKey, keys['kraken'].apiSecret));
	if (program.exchange == 'liqui' && keys['liqui']) exchanges.push(new Liqui(keys['liqui'].apiKey, keys['liqui'].apiSecret));
	if (program.exchange == 'bittrex' && keys['bittrex']) exchanges.push(new Bittrex(keys['bittrex'].apiKey, keys['bittrex'].apiSecret));
	if (program.exchange == 'bitfinex' && keys['bitfinex']) exchanges.push(new Bitfinex(keys['bitfinex'].apiKey, keys['bitfinex'].apiSecret));
} else {
	if (keys['poloniex']) exchanges.push(new Poloniex(keys['poloniex'].apiKey, keys['poloniex'].apiSecret));
	if (keys['kraken']) exchanges.push(new Kraken(keys['kraken'].apiKey, keys['kraken'].apiSecret));
	if (keys['liqui']) exchanges.push(new Liqui(keys['liqui'].apiKey, keys['liqui'].apiSecret));
	if (keys['bittrex']) exchanges.push(new Bittrex(keys['bittrex'].apiKey, keys['bittrex'].apiSecret));
	if (keys['bitfinex']) exchanges.push(new Bitfinex(keys['bitfinex'].apiKey, keys['bitfinex'].apiSecret));
}

if (program.usd) {
	Promise.all([
			getBTCPriceInUSD(),
			getCoinPriceInBTC(symbol)
		])
		.then(results => {
			let btcPrice = results[0];
			let coinPrices = results[1];

			coinPrices.map(result => {
				result.priceUSD = (result.priceBTC * btcPrice).toFixed(2);
				return result;
			});

			if (!coinPrices.length) {
				console.log(chalk.red('Coin not found on any exchange.'));
				process.exit(0);
			}

			coinPrices.sort((a, b) => {
				if (a.priceBTC < b.priceBTC) return -1;
				return 1;
			});

			let bestMarket = coinPrices.shift();

			console.log(chalk.green('Best price found on ' + capitalize(bestMarket.exchange) + ' at $' + bestMarket.priceUSD));

			let numCoinsToBuy = (program.usd / (bestMarket.priceBTC * btcPrice)).toFixed(8);

			console.log('');
			console.log(chalk.magenta('*Note that the number of coins may change slightly if the market fluctuates*'));
			console.log('');

			let questions = [{
				type: 'confirm',
				name: 'proceed',
				message: 'Buy about ' + numCoinsToBuy + ' worth of ' + symbol + '?'
			}];

			inquirer
				.prompt(questions)
				.then(results => {
					if (!results.proceed) {
						process.exit(0);
					}

					console.log(chalk.green('Buying...'));

					// this is dumb. figure out a better way.
					let exchange;
					switch (bestMarket.exchange){
						case 'poloniex': {
							exchange = new Poloniex(keys['poloniex'].apiKey, keys['poloniex'].apiSecret);
							break;
						}
						case 'kraken': {
							exchange = new Kraken(keys['kraken'].apiKey, keys['kraken'].apiSecret);
							break;
						}
						case 'bitfinex': {
							exchange = new Bitfinex(keys['bitfinex'].apiKey, keys['bitfinex'].apiSecret);
							break;
						}
						case 'bittrex': {
							exchange = new Bittrex(keys['bittrex'].apiKey, keys['bittrex'].apiSecret);
							break;
						}
						case 'liqui': {
							exchange = new Liqui(keys['liqui'].apiKey, keys['liqui'].apiSecret);
							break;
						}
					}
					return exchange.buy(symbol, program.usd);
				})
				.then( result => {
					if (result.complete){
						console.log(chalk.green('Order complete!'));
						console.log(chalk.green(capitalize(result.market) + ' order number ' + result.orderNumber));
						console.log(chalk.green('Bought ' + result.numCoinsBought + ' ' + symbol));
						console.log(chalk.green('Worth about $' + parseFloat(result.usdValue).toFixed(2) ));
					} else {
						console.log(chalk.green('Order placed, but not completed.'));
						console.log(chalk.green(capitalize(result.market) + ' order number ' + result.orderNumber));
						console.log('Details:');
						console.log(result);
					}
				});
		});
}

function getCoinPriceInBTC(symbol) {
	console.log(chalk.blue('Checking ' + symbol + ' on the markets...'));
	let coinPriceRequests = exchanges.map(exchange => {
		return exchange.getPriceInBTC(symbol).catch(e => {
			console.log('error')
			console.log(e);
			console.log(exchange)
		});
	});

	return Promise
		.all(coinPriceRequests)
		.then(results => {
			let priceResults = results.filter(result => {
				return result.available && result.priceBTC;
			});

			return priceResults;
		});
}

function getBTCPriceInUSD() {
	let btcPriceRequests = exchanges.map(exchange => {
		return exchange.getBTCinUSD();
	});

	return Promise
		.all(btcPriceRequests)
		.then(results => {

			let priceResults = results.filter(result => {
				return result.available;
			});
			if (!priceResults.length) {
				console.log(chalk.red('Coin not found on any exchange.'));
				process.exit(0);
			}

			let averageUSD = priceResults.reduce((sum, result) => {
				return parseFloat(sum) + parseFloat(result.priceUSD);
			}, 0.0) / priceResults.length;

			return averageUSD;
		});
}

function showNotConfigured() {
	console.log(chalk.red('Need to configure at least one exchange.'));
	console.log(chalk.red('Run \'coinx configure [name of exchange]\''));
	process.exit(1);
}