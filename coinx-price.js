'use strict';

const coinx = require('./coinx-core');
const program = require('commander');
const chalk = require('chalk');
const capitalize = require('capitalize');
const columnify = require('columnify');
const cryptocompare = require('./lib/cryptocompare');
const coins = coinx.coins();
const exchanges = Object.values(coinx.exchanges());

if (Object.keys(coins).length === 0) {
	console.error(chalk.red('Please run `coinx update` to get the latest list of coins.'));
	process.exit(1);
}

program.parse(process.argv);

var symbol = program.args;

if (!symbol.length) {
	console.error(chalk.red('No coin symbol provided.'));
	process.exit(1);
}

symbol = symbol[0].toUpperCase();

if (coins[symbol]){
	console.log(chalk.blue('Getting prices for ' + coins[symbol].name + ' (' + symbol + ')...'));
} else {
	console.log(chalk.blue('Getting prices for ' + symbol + '...'));
}


let requests = [];

if (symbol == 'BTC'){
	requests = exchanges.map( exchange => {
		return exchange.getBTCinUSD()
	});
} else {
	requests = [
		cryptocompare.price('BTC','USD')
	];
	let priceInBTCRequests = exchanges.map( exchange => {
		return exchange.getPriceInBTC(symbol);
	});
	requests = requests.concat(priceInBTCRequests);
}

Promise
	.all(requests)
	.then(results => {
		if (symbol == 'BTC'){
			processBTC(results);
		} else {
			processCoin(results);
		}
	});

function processBTC(results){
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

	priceResults.sort( (a, b) => {
		if (a.priceUSD < b.priceUSD){
			return -1;
		}
		return 1;
	});

	priceResults.push({});

	priceResults.push({
		exchange: 'average',
		priceUSD: averageUSD
	});

	let columns = columnify(priceResults, {
		columns: ['exchange', 'priceUSD'],
		config: {
			exchange: {
				headingTransform: function(heading) {
					return capitalize(heading);
				},
				dataTransform: function(data) {
					return capitalize(data);
				}
			},
			priceUSD: {
				headingTransform: function(heading) {
					return 'Price in USD'
				},
				dataTransform: function(data) {
					return (data) ? '$' + parseFloat(data).toFixed(2) : '';
				},
				align: 'right'
			}
		}
	});
	console.log(columns);
}


function processCoin(results){
	let btcPrice = results.shift();

	let priceResults = results.filter(result => {
		return result.available && result.priceBTC;
	}).map(result => {
		result.priceUSD = (result.priceBTC * btcPrice).toFixed(3);
		return result;
	});

	if (!priceResults.length) {
		console.log(chalk.red('Coin not found on any exchange.'));
		process.exit(0);
	}

	let averageUSD = priceResults.reduce((sum, result) => {
		return parseFloat(sum) + parseFloat(result.priceUSD);
	}, 0.0) / priceResults.length;

	let averageBTC = priceResults.reduce((sum, result) => {
		return parseFloat(sum) + parseFloat(result.priceBTC);
	}, 0) / priceResults.length;

	priceResults.sort( (a, b) => {
		if (a.priceUSD < b.priceUSD){
			return -1;
		}
		return 1;
	});

	priceResults.push({});

	priceResults.push({
		exchange: 'average',
		priceBTC: averageBTC,
		priceUSD: averageUSD
	});

	let columns = columnify(priceResults, {
		columns: ['exchange', 'priceBTC', 'priceUSD'],
		config: {
			exchange: {
				headingTransform: function(heading) {
					return capitalize(heading);
				},
				dataTransform: function(data) {
					return capitalize(data);
				}
			},
			priceBTC: {
				headingTransform: function(heading) {
					return 'Price in BTC'
				},
				dataTransform: function(data) {
					return (data) ? parseFloat(data).toFixed(8) : '';
				},
				align: 'right'
			},
			priceUSD: {
				headingTransform: function(heading) {
					return 'Price in USD'
				},
				dataTransform: function(data) {
					return (data) ? '$' + parseFloat(data).toFixed(2) : '';
				},
				align: 'right'
			}
		}
	});
	console.log(columns);
}
