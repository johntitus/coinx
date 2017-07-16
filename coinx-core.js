'use strict';

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const homedir = require('homedir');
const json2csv = require('json2csv');
const moment = require('moment');

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
			if (!fs.existsSync(Coinx.configPath())) {
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
		return path.join(homedir(), 'coinx', 'coinx.json');
	}

	static configPath() {
		return path.dirname(Coinx.configFilePath());
	}

	static coinListFilePath() {
		return path.join(Coinx.configPath(), 'coinList.json');
	}

	static configLogPath() {
		return path.join(Coinx.configPath(), 'log.csv');
	}

	static config(newConfig) {
		if (newConfig) {
			if (!fs.existsSync(Coinx.configPath())) {
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

	/***********
	/ Quote Currency - usually btc
	/ Base Currency - what you're buying or selling in exchange for the quote currency
	/ If I confused those two, someone let me know.
	/
	/ params: An object containing the following
	/ action: buy or sell
	/ exchange: name of exchange action occured on
	/ orderNumber: Unique ID provided by the exchange that identifies the order. Not always available.
	/ quoteCurrency: usually btc
	/ baseCurrency: what you're buying or selling in exchange for the quote currency
	/ amount: amount of coins bought or sold
	/ rate: exchange rate between quote currency and base currency
	/ valueUSD: the value of the trade in US dollars
	/ complete: boolean - whether or not the trade was fully executed by the exchange
	************/
	static log(params) {
		let fields = [
			'date',
			'action',
			'exchange',
			'orderNumber',
			'quoteCurrency',
			'baseCurrency',
			'amount',
			'rate',
			'valueUSD',
			'complete'
		];

		return fs
			.pathExists(Coinx.configLogPath())
			.then(exists => {
				if (!exists) {
					let columnTitles = '"Date","Action","Exchange","Order Number","Quote Currency","Base Currency","Amount","Rate","Value USD","Complete"';
					return fs.outputFile(Coinx.configLogPath(), columnTitles);
				} else {
					return;
				}
			})
			.then( () => {
				params.date = moment().format('YYYY-MM-DD HH:mm:ss');
				let csv = json2csv({fields: fields, data: params, hasCSVColumnTitle: false});
				return fs.appendFile(Coinx.configLogPath(), os.EOL + csv);
			});
	}

}

module.exports = Coinx;