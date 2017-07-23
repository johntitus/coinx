/*
	Buy the top 50 coins by market cap.
*/
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const Promise = require('bluebird');
const _ = require('lodash');
const capitalize = require('capitalize');

const coinx = require('../../commands/coinx-core');
const coinmarketcap = require('../../lib/coinmarketcap');
const cryptocompare = require('../../lib/cryptocompare');

const config = coinx.config();
const exchanges = coinx.exchanges();
const coins = coinx.coins();

module.exports = {
	run: function(program) {
		let coinList;
		let btcPriceInUSD;

		program
			.option('-$, --usd [amount]', 'Amount of US Dollars to spend per coin.')
			.option('-t, --top [number]', 'Buy the top [number] of coins by market cap .', 50)
			.parse(process.argv);

		if (!program.usd) {
			console.log(chalk.red('Need to use the -$ flag to specify how much to spend per coin.'));
			process.exit(1);
		}

		let excluded = ['BTC'];
		let excludedFilePath = path.join(__dirname, 'excluded_coins.txt');
		if (fs.existsSync(excludedFilePath)) {
			excluded = excluded.concat(fs.readFileSync(excludedFilePath).toString().split(/\r|\n/));
		} else {
			console.log('not found')
		}
		console.log(chalk.blue('Buy all the coins!'));

		console.log(chalk.green('Spend per coin: $' + program.usd));
		console.log(chalk.green('Coins to buy: ' + program.top));
		console.log(chalk.green('Maximum spend: $' + (program.usd * program.top) + ' (assumes all coins available to buy)'));
		console.log(chalk.green('Will not buy: ', excluded.join(', ')));

		let questions = [{
			type: 'confirm',
			name: 'proceed',
			message: 'Proceed?'
		}];

		inquirer
			.prompt(questions)
			.then(results => {
				if (!results.proceed){
					process.exit(0);
				} else {
					console.log(chalk.blue('Getting latest Market Cap list...'));
					return cryptocompare.price('BTC', 'USD');					
				}
			})
			.then( btcPrice => {
				console.log(chalk.blue('Got list...'));
				btcPriceInUSD = btcPrice;
				return coinmarketcap.getList(program.top);
			})
			.then( results => {
				let exchangesToRequest = [];
				for (const name in config) {
					if (name !== 'passwordHash'){
						exchangesToRequest.push(exchanges[name]);
					}
				}
				return Promise
					.map(results, coin => {
						if ( excluded.indexOf(coin.symbol) == -1){
							return buyCoin(coin, btcPriceInUSD, exchangesToRequest, program.usd);
						} else {
							console.log(chalk.green('Skipping excluded coin ' + coin.name + '.'));
							console.log('');
							return Promise.resolve();
						}
						
					}, {concurrency:1});
			})
			.then( () => {
				console.log(chalk.green('Done.'));
			});
	}
}

function buyCoin(coin, btcPrice, exchangesToRequest, usd){
	console.log(chalk.green('Buying ' + coin.name + '.'));
	
	return getCoinPriceInBTC(exchangesToRequest, coin.symbol)
		.then( coinPrices => {
			if (!coinPrices.length) {
				console.log(chalk.red('Coin not found on any exchange.'));
				console.log('');
				return Promise.resolve();
			} else {
				coinPrices.map(result => {
					result.priceUSD = (result.priceBTC * btcPrice).toFixed(2);
					return result;
				});

				let bestMarket = _.sortBy(coinPrices,'priceBTC').shift();

				console.log(chalk.green('Best price found on ' + capitalize(bestMarket.exchange) + ' at $' + bestMarket.priceUSD));

				let numCoinsToBuy = (usd / (bestMarket.priceBTC * btcPrice)).toFixed(8);

				console.log(chalk.green('Buying ' + numCoinsToBuy + ' ' + coin.name + ' on ' + capitalize(bestMarket.exchange)));

				return exchanges[bestMarket.exchange].buy(coin.symbol, usd);
			}
		})
		.then( result => {
			if (result.complete) {
				console.log(chalk.green('Order complete!'));
				console.log(chalk.green(capitalize(result.market) + ' order number ' + result.orderNumber));
				console.log(chalk.green('Bought ' + result.numCoinsBought + ' ' + coin.symbol + ' at ' + result.rate + ' BTC per coin'));
				console.log(chalk.green('Worth about $' + parseFloat(result.usdValue).toFixed(2)));
			} else {
				console.log(chalk.green('Order placed, but not completed.'));
				console.log(chalk.green(capitalize(result.market) + ' order number ' + result.orderNumber));
				console.log('Details:');
				console.log(result);
			}
			console.log('');

			let logParams = {
				action: 'buy',
				exchange: result.market,
				orderNumber: result.orderNumber,
				baseCurrency: coin.symbol,
				quoteCurrency: 'BTC',
				amount: result.numCoinsBought,
				rate: result.rate,
				valueUSD: parseFloat(result.usdValue).toFixed(2),
				complete: result.complete
			}
			return coinx.log(logParams);
		});
}

function getCoinPriceInBTC(exchanges, symbol) {
	if (coins[symbol]) {
		console.log(chalk.blue('Checking ' + coins[symbol].name + ' (' + symbol + ') on the markets...'));
	} else {
		console.log(chalk.blue('Checking ' + symbol + ' on the markets...'));
	}

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
