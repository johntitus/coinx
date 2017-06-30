'use strict';

const path = require('path');
const fs = require('fs');
const program = require('commander');
const chalk = require('chalk');
const homedir = require('homedir');
const capitalize = require('capitalize');
const inquirer = require('inquirer');
const mkdirp = require('mkdirp');

const coinxHome = path.join(homedir(),'coinx');
const keyFilePath = path.join(coinxHome,'coinx.json');

program
	.option('-d, --delete', 'Delete config for the exchange.')
	.parse(process.argv);

var exchange = program.args;

let validExchanges = [
	'poloniex',
	'bittrex',
	'liqui',
	'kraken',
	'bitfinex'
];

if (!exchange.length || validExchanges.indexOf(exchange[0]) == -1) {
	console.error(chalk.red('Please specify an exchange: ' + validExchanges.join(', ')));
	process.exit(1);
}
exchange = exchange[0];

if (program.delete){
	if (fs.existsSync(keyFilePath)){
		let keys = require(keyFilePath);
		delete keys[exchange];
		fs.writeFileSync(keyFilePath, JSON.stringify(keys, null, 4));
		console.log(chalk.green('Deleted data for ' + capitalize(exchange)));
	} else {
		console.log(chalk.green('Data not found for ' + capitalize(exchange)));
	}
	process.exit(0);
}

let questions = [
	{
		name: 'apiKey',
		message: capitalize(exchange) + ' API Key'
	},
	{
		name: 'apiSecret',
		message: capitalize(exchange) + ' API Secret'
	}
];

inquirer
	.prompt(questions)
	.then( results => {
		mkdirp.sync(coinxHome);
		let keys = {};
		if (fs.existsSync(keyFilePath)){
			keys = require(keyFilePath);
		}
		keys[exchange] = results;
		fs.writeFileSync(keyFilePath, JSON.stringify(keys, null, 4));
		console.log(chalk.green('Saved data for ' + capitalize(exchange)));
	});