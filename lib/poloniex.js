'use strict';

const API = require('poloniex.js');
const Promise = require('bluebird');

class Poloniex {
	constructor(apiKey, apiSecret) {
		this.name = 'poloniex';
		this.api = Promise.promisifyAll(new API(apiKey, apiSecret));
	};

	getBTCinUSD() {
		let self = this;
		return this.api
			.returnTickerAsync()
			.then(data => {
				let result = {
					exchange: self.name,
					symbol: 'BTC',
					available: true,
					priceUSD: parseFloat(data['USDT_BTC'].last)
				};
				return result;
			});
	};

	getPriceInBTC(symbol) {
		let self = this;
		if (symbol == 'BTC') {
			return Promise.reject('Use getBTCinUSD to get BTC price.');
		} else {
			return this.api
				.returnTickerAsync()
				.then(data => {
					let pair = 'BTC_' + symbol;
					if (data[pair]) {
						let result = {
							exchange: self.name,
							symbol: symbol,
							priceBTC: parseFloat(data[pair].lowestAsk),
							available: true
						};
						return result;
					} else {
						let result = {
							exchange: self.name,
							symbol: symbol,
							available: false
						};
						return result;
					}

				})
				.catch(e => {
					let result = {
						exchange: self.name,
						symbol: symbol,
						available: false
					};
				});
		}
	};

	buy(symbol, USDAmount) {
		var self = this;
		let orderNumber;
		let numCoinsToBuy;
		let rate;
		let btcUSD;
		let orderResult;

		return this.api.returnTickerAsync()
			.then(data => {
				btcUSD = data['USDT_BTC'].last;

				rate = parseFloat(data['BTC_' + symbol].lowestAsk);

				numCoinsToBuy = (USDAmount / (rate * btcUSD)).toFixed(8);

				return self.api.buyAsync('BTC', symbol, rate, numCoinsToBuy);
			})
			.then(orderData => {
				
				let orderResult = {
					market: self.name,
					orderNumber: parseInt(orderData.orderNumber),
					numCoinsBought: 0,
					rate: rate,
					complete: false
				}
				if (orderData.resultingTrades.length) {
					orderData.resultingTrades.forEach(trade => {
						orderResult.numCoinsBought += parseFloat(trade.amount);
					});
					orderResult.complete = (orderResult.numCoinsBought == numCoinsToBuy);
					orderResult.usdValue = rate * orderResult.numCoinsBought * btcUSD;
					return orderResult;
				} else {
					console.log('not filled')
					return Promise.delay(500)
						.then(() => {
							this.api.returnOrderTradesAsync(orderResult.orderNumber);
						})
						.then(trades => {
							console.log(trades);
							return orderResult;
						});
				}

			});
	};

	getBalances() {
		let self = this;
		return this.api
			.myBalancesAsync()
			.then(data => {
				let balances = {};
				Object.keys(data).forEach(key => {
					let balance = parseFloat(data[key]);
					if (balance) {
						balances[key] = balance;
					}
				});
				let result = {
					market: self.name,
					available: true,
					funds: balances
				}
				return result;
			})
			.catch(e => {
				let result = {
					market: self.name,
					available: false
				}
				return result;
			});
	};
};


module.exports = Poloniex;