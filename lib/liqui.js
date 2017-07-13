'use strict';

const Promise = require('bluebird');

const API = require('node.liqui.io');

class Liqui {
	constructor(apiKey, apiSecret) {
		this.name = 'liqui';
		this.api = Promise.promisifyAll(new API(apiKey, apiSecret));
	};

	getBTCinUSD() {
		let pair = 'btc_usdt';
		return this.api
			.ticker(pair)
			.then(data => {
				if (data.error) {
					return {
						exchange: 'liqui',
						symbol: 'BTC',
						available: false
					}
				} else {
					return {
						exchange: 'liqui',
						symbol: 'BTC',
						priceUSD: data[pair].last,
						available: true
					}
				}
			})
			.catch( e => {
				return {
					exchange: 'liqui',
					symbol: 'BTC',
					available: false
				}
			});
	};

	getPriceInBTC(symbol) {
		if (symbol == 'BTC') {
			return Promise.reject('Use getBTCinUSD to get BTC price.');
		} else {
			let pair = symbol.toLowerCase() + '_btc';
			return this.api
				.ticker(pair)
				.then(data => {
					if (data.error) {
						return {
							exchange: 'liqui',
							symbol: symbol,
							available: false
						}
					} else {
						return {
							exchange: 'liqui',
							symbol: symbol,
							priceBTC: parseFloat(data[pair].sell),
							available: true
						};
					}
				})
				.catch(e => {
					return {
						exchange: 'liqui',
						symbol: symbol,
						available: false
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
				self.api.ticker(symbol.toLowerCase() + '_btc'),
				self.api.ticker('btc_usdt')
			])
			.then(results => {
				btcUSD = results[1]['btc_usdt'].last;
				rate = results[0][symbol.toLowerCase() + '_btc'].sell;
				numCoinsToBuy = (USDAmount / (rate * btcUSD)).toFixed(8);

				let params = {
					pair: symbol.toLowerCase() + '_btc',
					rate: rate,
					amount: numCoinsToBuy
				}
				return self.api.buy(params);
			})
			.then(data => {
				let result = {
					market: 'liqui',
					orderNumber: data['order_id'],
					numCoinsBought: data.received,
					rate: rate,
					usdValue: (rate * data.received * btcUSD),
					complete: (data.remains == 0)
				}
				return result;
			});

	};

	getBalances() {
		let self = this;
		return this.api
			.getInfo()
			.then(data => {
				let balances = {};
				Object.keys(data.funds).forEach(key => {
					if (data.funds[key]) {
						balances[key.toUpperCase()] = data.funds[key];
					}
				})
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

module.exports = Liqui;