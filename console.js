require('colors');
var moment = require('moment');
module.exports = function () {
	"use strict";
	if (console.__ts__) {
		return;
	}

	var slice = Array.prototype.slice;
	['log', 'info', 'warn', 'error', 'dir', 'assert'].forEach(function (f) {
		var org = console[f];
		console[f] = function () {
			var date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss Z');
			var func = f.toLowerCase();
			switch (func) {
			case 'log':
			case 'dir':
			case 'assert':
				func = f.toUpperCase().magenta;
				break;
			case 'warn':
				func = f.toUpperCase().yellow;
				break;
			case 'error':
				func = f.toUpperCase().red;
				break;
			case 'info':
				func = f.toUpperCase().cyan;
				break;
			}
			var out = "[" + date.grey + "] [" + func + "] ";
			var args = slice.call(arguments);
			if (f === "error" || f === "warn" || (f === "assert" && !args[0])) {
				process.stderr.write(out);
			} else if (f !== "assert") {
				process.stdout.write(out);
			}
			return org.apply(console, args);
		};
	});
	console.__ts__ = true;
};