'use strict';

const Promise = require('bluebird');
const API = require('kraken-api');

class Kraken {
	constructor(apiKey, apiSecret) {
		this.name = 'kraken';
		this.api = Promise.promisifyAll(new API(apiKey, apiSecret));
	};

	getBTCinUSD() {
		let pair = 'XXBTZUSD'
		return this.api.apiAsync('Ticker', {
			pair: pair
		})
		.then( data => {
			if (data.error && data.error.length){
				return data.error;
			} else {
				return {
					exchange: 'kraken',
					symbol: 'BTC',
					priceUSD: parseFloat(data.result[pair].a[0]),
					available: true
				}
			}
		})
		.catch( e => {
			return {
				exchange: 'kraken',
				symbol: 'BTC',
				available: false
			}
		});
	};

	getPriceInBTC(symbol){
		if (symbol == 'BTC'){
			return Promise.reject('Use getBTCinUSD to get BTC price.');
		} else {
			let pair = 'X' + symbol + 'XXBT';
			return this.api.apiAsync('Ticker', {
				pair: pair
			})
			.then( data => {
				if (data.error && data.error.length){
					return data.error;
				} else {
					return {
						exchange: 'kraken',
						symbol: symbol,
						priceBTC: parseFloat(data.result[pair].a[0]),
						available: true
					}
				}
			})
			.catch( e => {
				return {
					exchange: 'kraken',
					symbol: symbol,
					available: false
				}
			});
		}
	};

	getOrderInfo(orderId){
		return this.api.apiAsync('QueryOrders', {
			txid: orderId
		});
	};

	buy(symbol, USDAmount){
		var self = this;
		let orderNumber;
		let numCoinsToBuy;
		let rate;
		let btcUSD;
		let assetPair = 'X' + symbol + 'XXBT';

		let pairs = [
			assetPair,
			'XXBTZUSD'
		];
		return this.api.apiAsync('Ticker', {
				pair: pairs.join(',')
			})
			.then( ticker => {
				if (ticker.error && ticker.error.length){
					return Promise.reject(ticker.error);
				} else {
					btcUSD = ticker.result['XXBTZUSD'].c[0]; // last price
					rate = ticker.result[assetPair].a[0]; //ask price
					numCoinsToBuy = (USDAmount / (rate * btcUSD)).toFixed(8);
				}
				console.log('buying on kraken volume');
				console.log(numCoinsToBuy)
				return this.api.apiAsync('AddOrder', {
					pair: assetPair,
					type: 'buy',
					ordertype: 'market',
					volume: numCoinsToBuy
				});
			})
			.then( result => {
				orderNumber = result.result.txid[0];
				return Promise.delay(500); // wait for order to fill
			})
			.then( () => {
				return this.getOrderInfo(orderNumber);
			})
			.then( orderData => {
				let result = {
					market: 'kraken',
					orderNumber: orderNumber,
					numCoinsBought: parseFloat(orderData.result[orderNumber].vol),
					rate: parseFloat(orderData.result[orderNumber].price),
					complete: (orderData.result[orderNumber].status == 'closed')
				}
				result.usdValue = parseFloat(orderData.result[orderNumber].price) * parseFloat(orderData.result[orderNumber].vol) * btcUSD;
				return result;
			});
	};

	getBalances() {
		let self = this;
		return this.api.apiAsync('Balance',null)
			.then( data => {
				if (data.error && data.error.length ){
					let result = {
						market: self.name,
						available: false
					}
					return result;
				} else {
					let balances = {};
					Object.keys(data.result).forEach( key => {
						let balance = data.result[key];

						key = key.slice(1);

						if (key == 'XBT') key = 'BTC';
						balances[key] = balance;
					});
						let result = {
						market: self.name,
						available: true,
						funds: balances
					}
					return result;
				}
			})
			.catch( e => {
				let result = {
					market: self.name,
					available: false
				}
				return result;
			});
	};

};

module.exports = Kraken;
