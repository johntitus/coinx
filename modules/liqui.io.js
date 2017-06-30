/**
 * Node.js Liqui.io Trading API
 */

var https = require('https');
var url = require('url');
var crypto = require('crypto');
var querystring = require('querystring');
var util = require('util');
var request = require('request');
var rp = require('request-promise');

module.exports = LIQUI;

function LIQUI(key, secret) {
  this.key = key;
  this.secret = secret;
  this.urlPost = 'https://api.liqui.io/tapi';
  this.urlGet = 'https://api.liqui.io/api/3/';
  this.nonce = LIQUI.getTimestamp(Date.now());
}

/**
 * getInfo: returns the information about the user's current balance, API key privileges,
 * the number of transactions, the number of open orders and the server time
 *
 * @param {Function} callback(err, data)
 */
LIQUI.prototype.getInfo = function(callback) {
  return this.query('getInfo', null, callback)
}

/**
 * transHistory: returns the transactions history.
 */
LIQUI.prototype.transHistory = function(params, callback) {
  this.query('TransHistory', params, callback)
}

/**
 * tradeHistory: returns the trade history.
 */
LIQUI.prototype.tradeHistory = function(params, callback) {
  this.query('TradeHistory', params, callback)
}

/**
 * orderList: returns your open orders/the orders history.
 */
LIQUI.prototype.orderList = function(params, callback) {
  this.query('OrderList', params, callback)
}

/**
 * ActiveOrders: returns your open orders/the orders history.
 */
LIQUI.prototype.activeOrders = function(params, callback) {
    this.query('ActiveOrders', params, callback)
}

/**
 * trade: Trading is done according to this method
 * ----------+-------+--------------------------------------------------+-----------+-----------
 * parameter | oblig | description                                      | type      | default
 * ----------+-------+--------------------------------------------------+-----------+-----------
 * pair      | Yes   | pair                                             | pair[1]   | -
 * type      | Yes   | the transaction type                             | trans[2]  | -
 * rate      | Yes   | the rate to by/sell                              | numerical | -
 * amount    | Yes   | the amount which is necessary to buy/sell        | numerical | -
 * ----------+-------+--------------------------------------------------+-----------+-----------
 * [1] Example: btc_usd
 * [2] buy or sell
 *
 * @param {Object} params
 * @param {Function} callback(err, data)
 */
LIQUI.prototype.trade = function(params, callback) {
  return this.query('Trade', params, callback)
}

/**
 * cancelOrder: Cancellation of the order
 * ----------+-------+--------------------------------------------------+-----------+-----------
 * parameter | oblig | description                                      | type      | default
 * ----------+-------+--------------------------------------------------+-----------+-----------
 * order_id  | Yes   | Order id                                         | numerical | -
 * ----------+-------+--------------------------------------------------+-----------+-----------
 *
 * @param {Object} params
 * @param {Function} callback(err, data)
 */
LIQUI.prototype.cancelOrder = function(orderId, callback) {
  this.query('CancelOrder', { 'order_id': orderId }, callback)
}

/**
 * query: Executes raw query to the API
 *
 * @param {String} method
 * @param {Object} params
 * @param {Function} callback(err, data)
 */
LIQUI.prototype.query = function(method, params, callback) {
  var content = {
    'method': method,
    'nonce': ++this.nonce,
  }

  if (!!params && typeof(params) == 'object') {
    Object.keys(params).forEach(function (key) {
      if (key == 'since' || key == 'end') {
        value = LIQUI.getTimestamp(params[key])
      }
      else {
        value = params[key]
      }
      content[key] = value
    })
  }

  content = querystring.stringify(content);

  var sign = crypto
    .createHmac('sha512', new Buffer(this.secret, 'utf8'))
    .update(new Buffer(content, 'utf8'))
    .digest('hex')

  let options = {
    headers: {
        'Key': this.key,
        'Sign': sign,
        'content-type': 'application/x-www-form-urlencoded',
        'content-length': content.length,
    },
    body: content,
    json: true,
    url: this.urlPost,
    method: 'POST'
  }
  
  return rp(options).then( data => {
    if (data.success == 1){
        return data.return;
    } else {
        return Promise.reject(data.error);
    }
  });
}

/**
 * getHTTPS: Simple HTTPS GET request
 *
 * @param {String} getUrl
 * @param {Function} callback(err, data)
 */
LIQUI.prototype.getHTTPS = function(getUrl, callback) {
  
  var options = {
    method: 'GET',
    url: getUrl,
    json: true
  }
  //console.log(options);
  return rp(options);
  /*
  request(options, function(err, response, body){
    if (err){
        callback(err);
    } else {
        callback(null, body);
    }
  });
  */
}

/**
 * trades: This method provides the information about the last trades.
 *
 */
LIQUI.prototype.trades = function(pair, callback) {
  var url = this.urlGet + 'trades/' + pair;
  return this.getHTTPS(url, callback);
}

/**
 * depth: Get trading depth about a trading pair
 *
 */
LIQUI.prototype.depth = function(pair, callback) {
  var url = this.urlGet + 'depth/' + pair;
  return this.getHTTPS(url, callback);
}

/**
 * info: This method provides all the information about currently active pairs
 *
 */
LIQUI.prototype.info = function(callback) {  
  var url = this.urlGet + 'info';
  return this.getHTTPS(url, callback);
}

/**
 * ticker: Get price and volume information about a trading pair
 *
 */
LIQUI.prototype.ticker = function(pair, callback) {  
  var url = this.urlGet + 'ticker/' + pair;
  return this.getHTTPS(url, callback);
}

/**
 * fee: Get the fee for transactions
 *
 * ----------+-------+--------------------------------------------------+-----------+-----------
 * parameter | oblig | description                                      | type      | default
 * ----------+-------+--------------------------------------------------+-----------+-----------
 * pair      | No    | the pair to display                              | pair[1]   | btc_usd
 * ----------+-------+--------------------------------------------------+-----------+-----------
 * [1] Example: btc_usd
 *
 * @param {Object} params
 * @param {Function} callback(err, data)
 */
LIQUI.prototype.fee = function(params, callback) {
  if (!params) params = {}
  if (!params.pair) params.pair = 'btc_usd'

  var url = this.urlGet+params.pair+'/fee'

  this.getHTTPS(url, callback)
}

/**
 * Helper function to handle LIQUI HTTP responses and errors
 */
LIQUI.responseHandler = function(err, data, callback) {
  if (err) {
    callback(err, null)
  } else {
    var result = null
    var errorMessage = null
    try {
      result = JSON.parse(data)
      if (result.error || result.success == 0) {
        errorMessage = result.error || 'Unknown error'
      }
    } catch (e) {
      errorMessage = 'Error parsing JSON'
    }
    if (errorMessage) {
      callback(new Error(errorMessage), result)
    } else {
      callback(null, result)
    }
  }
}

/**
 * getTimestamp: converts a Date object, a string, or a JS timestamp to a UNIX timestamp.
 *
 * @param {Mixed} time
 */
LIQUI.getTimestamp = function(time) {
  if (util.isDate(time)) {
    return Math.round(time.getTime() / 1000)
  }
  if (typeof time == 'string') {
    return LIQUI.getTimestamp(new Date(time))
  }
  if (typeof time == 'number') {
    return (time >= 0x100000000) ? Math.round(time / 1000) : time
  }
  return 0
}