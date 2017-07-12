'use strict';

const program = require('commander');
const chalk = require('chalk');
const capitalize = require('capitalize');
const columnify = require('columnify');

const Poloniex = require('./exchanges/poloniex');
const Liqui = require('./exchanges/liqui');
const Bittrex = require('./exchanges/bittrex');
const Bitfinex = require('./exchanges/bitfinex');
const Kraken = require('./exchanges/kraken');

let exchanges = [
	new Poloniex(),
	new Liqui(),
	new Bittrex(),
	new Bitfinex(),
	new Kraken()
];

program.parse(process.argv);

var symbol = program.args;

if (!symbol.length) {
	console.error(chalk.red('No coin symbol provided.'));
	process.exit(1);
}

symbol = symbol[0].toUpperCase();

console.log(chalk.blue('Getting prices for ' + symbol + '...'));

let requests = exchanges.map( exchange => {
	return exchange.getBTCinUSD()
		.then( data => {
			//console.log('data from ' + exchange.constructor.name);
			//console.log(data);
			return data;
		})
		.catch( e => {
			console.log('error getting btc in usd')
			console.log(e);
			return {}
		})
});

if (symbol !== 'BTC'){
	let priceInBTCRequests = exchanges.map( exchange => {
		return exchange.getPriceInBTC(symbol).then( result => {
			//console.log(result);
			return result;
		});
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
	let btcPrices = results.slice(0, exchanges.length).filter( result => {
		return result.available;
	});
		
	let btcPrice = btcPrices.map(result => {
		return result.priceUSD;
	}).reduce((sum, value) => {
		return sum + value;
	}, 0) / exchanges.length;

	let priceResults = results.slice(exchanges.length).filter(result => {
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