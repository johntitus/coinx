'use strict';

const fs = require('fs');
const path = require('path');
const homedir = require('homedir');
const exchangeModules = [
	'bitfinex',
	'bittrex',
	'kraken',
	'liqui',
	'poloniex'
];

class Coinx {

	static exchanges() {
		let exchanges = [];
		const config = Coinx.config();
		exchangeModules.forEach(function(file) {
			let name = path.basename(file, '.js');
			let classname = require('./lib/' + file);
			if (name in config) {
				exchanges[name] = new classname(config[name].apiKey, config[name].apiSecret);
			} else {
				exchanges[name] = new classname();
			}
		});
		return exchanges;
	}

	static coins(newCoins) {
		if (newCoins) {
			if (! fs.existsSync(Coinx.configPath())) {
				fs.mkdirSync(Coinx.configPath());
			}
			fs.writeFileSync(Coinx.coinListFilePath(), JSON.stringify(newCoins));
			return newCoins;
		} else {
			if (fs.existsSync(Coinx.coinListFilePath())) {
				return require(Coinx.coinListFilePath());
			} else {
				return {};
			}
		}
	}

	static configFilePath() {
		return path.join(homedir(), 'coinx', 'config.json');
	}

	static configPath() {
		return path.dirname(Coinx.configFilePath());
	}

	static coinListFilePath() {
		return path.join(Coinx.configPath(), 'coinList.json');
	}

	static config(newConfig) {
		if (newConfig) {
			if (! fs.existsSync(Coinx.configPath())) {
				fs.mkdirSync(Coinx.configPath());
			}
			fs.writeFileSync(Coinx.configFilePath(), JSON.stringify(newConfig, null, 4));
			return newConfig;
		} else {
			if (fs.existsSync(Coinx.configFilePath())) {
				return require(Coinx.configFilePath());
			} else {
				return {};
			}
		}
	}

}

module.exports = Coinx;
