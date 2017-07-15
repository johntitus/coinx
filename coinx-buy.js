'use strict';

const coinx = require('./coinx-core');
const path = require('path');
const program = require('commander');
const chalk = require('chalk');
const capitalize = require('capitalize');
const inquirer = require('inquirer');
const columnify = require('columnify');
const cryptocompare = require('./lib/cryptocompare');
const config = coinx.config();
const exchanges = coinx.exchanges();
const coins = coinx.coins();
let exchangesToRequest = [];

if (Object.keys(coins).length === 0) {
    console.error(chalk.red('Please run `coinx update` to get the latest list of coins.'));
    process.exit(1);
}

program
    .option('-$, --usd [amount]', 'Amount of US Dollars to spend.')
    .option('-e, --exchange [name]', 'A specific exchange to buy from.')
    .parse(process.argv);

if (Object.keys(config).length === 0) {
    console.log(chalk.red('Need to configure at least one exchange.'));
    console.log(chalk.red('Run \'coinx configure [name of exchange]\''));
    process.exit(1);
}

let symbol = program.args;
if (! symbol.length) {
    console.error(chalk.red('No coin symbol provided.'));
    process.exit(1);
}

symbol = symbol[0].toUpperCase();
if (! program.usd) {
    console.log(chalk.red('You must specify the amount of USD to spend. -$ or --usd'));
}

if (program.exchange) {
    if (Object.keys(exchanges).indexOf(program.exchange) === -1){
        console.log(chalk.red('Unknown exchange'));
        process.exit(1);
    }
    if (Object.keys(config).indexOf(program.exchange) === -1) {
        console.log(chalk.red('Exchange is not configured'));
        process.exit(1);
    }
    exchangesToRequest.push(exchanges[program.exchange]);
    console.log(chalk.blue('Buying on ' + capitalize(program.exchange) + '...'));
} else {
    for (const name in config) {
        exchangesToRequest.push(exchanges[name]);
    }
    console.log(chalk.blue('Buying...'));
}

if (program.usd) {
    Promise.all([
            getBTCPriceInUSD(),
            getCoinPriceInBTC(exchangesToRequest, symbol)
        ])
        .then(results => {
            let btcPrice = results[0];
            let coinPrices = results[1];

            coinPrices.map(result => {
                result.priceUSD = (result.priceBTC * btcPrice).toFixed(2);
                return result;
            });

            if (!coinPrices.length) {
                console.log(chalk.red('Coin not found on any exchange.'));
                process.exit(0);
            }

            coinPrices.sort((a, b) => {
                if (a.priceBTC < b.priceBTC) return -1;
                return 1;
            });

            let bestMarket = coinPrices.shift();

            if (bestMarket.exchange in config) {
                console.log(chalk.green('Best price found on ' + capitalize(bestMarket.exchange) + ' at $' + bestMarket.priceUSD));
            } else {
                console.log(chalk.red('Best price found on ' + capitalize(bestMarket.exchange) + ' but it is not configured, run "coinx config ' + bestMarket.exchange + '" to configure'));
                process.exit(1);
            }
            let numCoinsToBuy = (program.usd / (bestMarket.priceBTC * btcPrice)).toFixed(8);

            console.log('');
            console.log(chalk.magenta('*Note that the number of coins may change slightly if the market fluctuates*'));
            console.log('');

            let questions = [{
                type: 'confirm',
                name: 'proceed',
                message: 'Buy about ' + numCoinsToBuy + ' worth of ' + symbol + '?'
            }];

            inquirer
                .prompt(questions)
                .then(results => {
                    if (!results.proceed) {
                        process.exit(0);
                    }
                    console.log(chalk.green('Buying...'));
                    return exchanges[bestMarket.exchange].buy(symbol, program.usd);
                })
                .then( result => {
                    if (result.complete){
                        console.log(chalk.green('Order complete!'));
                        console.log(chalk.green(capitalize(result.market) + ' order number ' + result.orderNumber));
                        console.log(chalk.green('Bought ' + result.numCoinsBought + ' ' + symbol + ' at ' + result.rate + ' BTC per coin'));
                        console.log(chalk.green('Worth about $' + parseFloat(result.usdValue).toFixed(2) ));
                    } else {
                        console.log(chalk.green('Order placed, but not completed.'));
                        console.log(chalk.green(capitalize(result.market) + ' order number ' + result.orderNumber));
                        console.log('Details:');
                        console.log(result);
                    }
                })
                .catch( e => {
                    console.error(chalk.red('An error occurred.'));
                    console.log(e);
                });
        });
}

function getCoinPriceInBTC(exchanges, symbol) {
    if (coins[symbol]){
        console.log(chalk.blue('Checking ' + coins[symbol].name + ' (' + symbol + ') on the markets...'));
    } else {
        console.log(chalk.blue('Checking ' + symbol + ' on the markets...'));
    }

    let coinPriceRequests = exchanges.map(exchange => {
        return exchange.getPriceInBTC(symbol).catch(e => {
            console.log('error')
            console.log(e);
            console.log(exchange)
        });
    });

    return Promise
        .all(coinPriceRequests)
        .then(results => {
            let priceResults = results.filter(result => {
                return result.available && result.priceBTC;
            });

            return priceResults;
        });
}

function getBTCPriceInUSD() {
    return cryptocompare.price('BTC','USD');
}

