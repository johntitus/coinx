'use strict';

const coinx = require('./coinx-core');
const program = require('commander');
const chalk = require('chalk');
const crypto = require('crypto');

const algorithm = 'aes-256-ctr';

function encrypt(text, password) {
  var cipher = crypto.createCipher(algorithm, password)
  var crypted = cipher.update(text, 'utf8', 'hex')
  crypted += cipher.final('hex');
  return crypted;
}

program.parse(process.argv);

var password = program.args[0];

if (!password) {
  console.log(chalk.red('Provide a password to unlock your config.'));
  process.exit(1);
}

let hash = encrypt(password, password);

coinx.unlockConfig(hash);