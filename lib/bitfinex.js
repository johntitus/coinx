'use strict';

const Promise = require('bluebird');
const API = require('bitfinex-api-node');

class Bitfinex {
	constructor(apiKey, apiSecret) {
		this.name = 'bitfinex';
		this.rest = Promise.promisifyAll(new API(apiKey, apiSecret, {
			version: 1,
			transform: true,
			autoOpen: false
		}).rest);
	};

	getBTCinUSD() {
		let self = this;
		let pair = 'btcusd';
		return this.rest.tickerAsync(pair)
			.then(data => {
				return {
					exchange: self.name,
					symbol: 'BTC',
					priceUSD: parseFloat(data.last_price),
					volume: parseFloat(data.volume),
					available: true
				}
			})
			.catch(e => {
				return {
					exchange: self.name,
					symbol: 'BTC',
					available: false
				}
			});
	};

	getPriceInBTC(symbol) {
		let self = this;
		if (symbol == 'BTC') {
			return Promise.reject('Use getBTCinUSD to get BTC price.');
		} else {
			let pair = symbol + 'BTC';
			return this.rest.tickerAsync(pair)
				.then(data => {
					return {
						exchange: self.name,
						symbol: symbol,
						priceBTC: parseFloat(data.ask),
						available: true
					};
				})
				.catch(e => {
					if (e.message == 'Unknown symbol') {
						return {
							exchange: self.name,
							symbol: symbol,
							available: false
						}
					} else {
						//console.log('error getting price from btc');
						return {
							exchange: self.name,
							symbol: symbol,
							available: false
						}
					}
				});
		}
	};

	buy(symbol, USDAmount) {
		var self = this;
		let orderNumber;
		let numCoinsToBuy;
		let rate;
		let btcUSD;

		return Promise.all([
				self.rest.tickerAsync('BTCUSD'),
				self.rest.tickerAsync(symbol + 'BTC')
			]).then(results => {
				btcUSD = parseFloat(results[0].last_price);
				rate = parseFloat(results[1].ask);
				numCoinsToBuy = (USDAmount / (rate * btcUSD)).toFixed(8);
				
				//(symbol, amount, price, exchange, side, type, is_hidden, postOnly, cb
				return self.rest.new_orderAsync(symbol + 'BTC', numCoinsToBuy, '' + rate, 'bitfinex', 'buy', 'exchange fill-or-kill');
			})
			.then(result => {
				orderNumber = result.order_id;
				return Promise.delay(500); // wait for the fill or kill to happen.
			})
			.then(() => {
				return self.rest.order_statusAsync(orderNumber);
			})
			.then(status => {
				let result = {
					market: self.name,
					orderNumber: orderNumber,
					numCoinsBought: parseFloat(status.executed_amount),
					rate: parseFloat(status.avg_execution_price),
					complete: (parseFloat(status.remaining_amount) == 0)
				}
				result.usdValue = parseFloat(result.rate * result.numCoinsBought) * btcUSD;
				return result;
			});

	};

	getBalances() {
		var self = this;
		return new Promise((resolve, reject) => {
			this.rest.wallet_balances(function(err, data) {
				if (err) {
					let result = {
						market: self.name,
						available: false
					}
					resolve(result);
				} else {
					let balances = {};
					data.forEach(balance => {
						balances[balance.currency.toUpperCase()] = parseFloat(balance.available);
					});
					let result = {
						market: self.name,
						available: true,
						funds: balances
					}
					resolve(result);
				}
			});
		});
	}
}

module.exports = Bitfinex;
