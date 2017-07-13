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
	}
}

module.exports = new CryptoCompare();