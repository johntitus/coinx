'use strict';

const Promise = require('bluebird');

const API = require('binance');
const cryptoCompare = require('./cryptocompare');

class Binance {
	constructor(apiKey, apiSecret) {
		this.name = 'binance';
		this.api = new API.BinanceRest({
			key: apiKey,
			secret: apiSecret
		});		
	};

	getBTCinUSD() {
		return {
			exchange: this.name,
			symbol: 'BTC',
			available: false
		}
	};

	getPriceInBTC(symbol) {
		if (symbol == 'BTC') {
			return Promise.reject('Use getBTCinUSD to get BTC price.');
		} else {
			let pair = symbol.toUpperCase() + 'BTC';
			return this.api
				.depth(pair)
				.then(data => {
					return {
						exchange: this.name,
						symbol: symbol,
						priceBTC: parseFloat(data.asks[0]),
						available: true
					};
					
				})
				.catch(e => {
					return {
						exchange: this.name,
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

		/*
		symbol	STRING	YES	
		side	ENUM	YES	
		type	ENUM	YES	
		timeInForce	ENUM	YES	
		quantity	DECIMAL	YES	
		price	DECIMAL	YES
		*/

		return Promise.all([
				this.getPriceInBTC(symbol),
				cryptoCompare.price('BTC','USD')
			])
			.then(results => {
				btcUSD = results[1];
				rate = results[0].priceBTC;
				numCoinsToBuy = (USDAmount / (rate * btcUSD)).toFixed(8);

				let params = {
					symbol: symbol.toUpperCase() + 'BTC',
					side: 'BUY',
					type: 'MARKET',
					quantity: parseFloat(numCoinsToBuy),
					timestamp: new Date().getTime()
				}
				console.log(params);
				return this.api.newOrder(params);
			})
			.then(data => {
				console.log('order results');
				console.log(data);
				orderNumber = data.orderId;
				return Promise.delay(1000).then( () => {
					let params = {
						symbol: symbol.toUpperCase() + 'BTC',
						orderId: orderNumber
					}
					return self.api.queryOrder()
				});
			})
			.then(data => {
				console.log('order status');
				console.log(data);

				/*
				{
				  "symbol": "LTCBTC",
				  "orderId": 1,
				  "clientOrderId": "myOrder1",
				  "price": "0.1",
				  "origQty": "1.0",
				  "executedQty": "0.0",
				  "status": "NEW",
				  "timeInForce": "GTC",
				  "type": "LIMIT",
				  "side": "BUY",
				  "stopPrice": "0.0",
				  "icebergQty": "0.0",
				  "time": 1499827319559
				}
				*/
				// orderStatus NEW, PARTIALLY_FILLED, FILLED, CANCELED，PENDING_CANCEL, REJECTED, EXPIRED
				let result = {
					market: this.name,
					orderNumber: orderNumber,
					numCoinsBought: parseFloat(data.executedQty),
					rate: rate,
					usdValue: (rate * data.executedQty * btcUSD),
					complete: (data.orderStatus == 'FILLED')
				}
				return result;
			});

	};

	getBalances() {
		let self = this;
		return this.api
			.account()
			.then(data => {
				let balances = {};
				data.balances.forEach(balance => {
					let key = balance.asset;
					let value = parseFloat(balance.free);
					if (value)
						balances[key.toUpperCase()] = value;
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

module.exports = Binance;
