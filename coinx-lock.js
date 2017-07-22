'use strict';

const coinx = require('./coinx-core');
const program = require('commander');
const chalk = require('chalk');
const capitalize = require('capitalize');
const inquirer = require('inquirer');

const crypto = require('crypto');
const zxcvbn = require('zxcvbn');

const algorithm = 'aes-256-ctr';

function encrypt(text, password){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}

const config = coinx.config();

program
	.option('-f, --force', 'Lets you lock the coinx config using a new password.')
	.parse(process.argv);

var password = program.args[0];

if (!password){
	console.log(chalk.red('Provide a password to lock your config.'));
	process.exit(1);
}

if (Object.keys(config).length === 0) {
	console.log(chalk.red('Need to configure at least one exchange before locking.'));
	console.log(chalk.red('Run \'coinx configure [name of exchange]\''));
	process.exit(1);
}

let hash = encrypt(password,password);

if (config.passwordHash){
	if ( hash != config.passwordHash && !program.force){
		console.log(chalk.red('Password different than previous. Use -f --force to overwrite with new password.'));
	} else {
		let encryptedConfig = encrypt(JSON.stringify(config), hash);
		coinx.lockConfig(encryptedConfig);
	}
} else {
	let score = zxcvbn(password).score;
	if (score < 2){
		console.log(chalk.red('Please use a stronger password.'));
		process.exit(1);
	}
	config.passwordHash = hash;
	let encryptedConfig = encrypt(JSON.stringify(config), hash);
	coinx.lockConfig(encryptedConfig);
}