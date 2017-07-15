const request = require('request');
const rp = require('request-promise');

class CoinMarketCap {
	constructor() {
		this.url = 'https://api.coinmarketcap.com/v1/ticker/';
	};

	getList(limit = 500) {
		var options = {
			url: this.url,
			json: true,
			qs: {
				limit: limit
			}
		}
		return rp(options).then(data => {
			let coins = data.map(coin => {
				return {
					id: coin.id,
					name: coin.name,
					symbol: coin.symbol,
					rank: parseInt(coin.rank),
					price_usd: parseFloat(coin.price_usd),
					price_btc: parseFloat(coin.price_btc),
					'24h_volume_usd': parseFloat(coin['24h_volume_usd']),
					market_cap_usd: parseFloat(coin.market_cap_usd),
					available_supply: parseFloat(coin.available_supply),
					total_supply: parseFloat(coin.total_supply),
					percent_change_1h: parseFloat(coin.percent_change_1h),
					percent_change_7d: parseFloat(coin.percent_change_7d),
					percent_change_24h: parseFloat(coin.percent_change_24h),
					last_updated: coin.last_updated
				}
			});
			return coins;
		});
	}
}

module.exports = new CoinMarketCap();
