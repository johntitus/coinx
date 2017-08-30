const request = require('request');
const rp = require('request-promise');

class CryptoCompare{
	constructor(){
		this.url = 'https://min-api.cryptocompare.com/data/';
	};

	// https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=BTC,USD,EUR
	price(symbol, quoteCurrency){
		var options = {
			url: this.url + 'price',
			json: true,
			qs: {
				fsym: symbol,
				tsyms: quoteCurrency
			}
		}
		return rp(options).then( data => {
			return data[quoteCurrency];
		});
	};

	priceMulti(symbols, quoteCurrency){
		var options = {
			url: this.url + 'pricemulti',
			json: true,
			qs: {
				fsyms: symbols.join(','),
				tsyms: quoteCurrency
			}
		}
		
		return rp(options).then( data => {
			let results = {};
			Object.keys(data).forEach( symbol => {
				results[symbol] = data[symbol][quoteCurrency];
			});
			return results;
		});	
	}
}

module.exports = new CryptoCompare();
