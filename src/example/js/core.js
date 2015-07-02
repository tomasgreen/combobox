(function () {
	'use strict';

	document.addEventListener('DOMContentLoaded', function () {	
		var combo = ComboBox('#demo1');
		combo.on('willadd',function(value){
			return value != 'test';
		});
		combo.on('didadd',function(value){
			console.log('added "'+value+'"');
		});
		combo.on('willremove',function(value){
			return value != 'stuck';
		});
		combo.on('didremove',function(value){
			console.log('removed "'+value+'"');
		});
		combo.focus();
		
		/*var combo2 = ComboBox('#demo2');
		combo2.focus();*/
	});

}).call(this);