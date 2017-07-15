'use strict';

const coinx = require('./coinx-core');
const program = require('commander');
const chalk = require('chalk');
const capitalize = require('capitalize');
const inquirer = require('inquirer');
const validExchanges = Object.keys(coinx.exchanges());

program
    .option('-d, --delete', 'Delete config for the exchange.')
    .parse(process.argv);

var exchange = program.args;

if (!exchange.length || validExchanges.indexOf(exchange[0]) == -1) {
    console.error(chalk.red('Please specify an exchange: ' + validExchanges.join(', ')));
    process.exit(1);
}
exchange = exchange[0];

if (program.delete){
    let config = coinx.config();
    if (config[exchange]){
        delete config[exchange];
        coinx.config(config);
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
        let config = coinx.config();
        config[exchange] = results;
        coinx.config(config);
        console.log(chalk.green('Saved data for ' + capitalize(exchange)));
    });
