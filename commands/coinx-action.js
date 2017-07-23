'use strict';

const program = require('commander');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

const coinx = require('./coinx-core');


program.parse(process.argv);

let actionName = program.args[0];
let actionPath = path.join(coinx.actionPath(), actionName, 'index.js');
let actionExists = fs.existsSync(actionPath);

if (!actionExists){
	badAction();
}

let action;
try {
	action = require(actionPath);
} catch (e){
	console.log(e);
	badAction();
}

action.run(program);


function badAction(){
	console.log(chalk.red('Could not find that action.'));
	process.exit(1);
}