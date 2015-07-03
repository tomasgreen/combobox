(function () {
	'use strict';

	function _hasClass(el, cls) {
		if (!el) return;
		if (el.classList) return el.classList.contains(cls);
		else return new RegExp('(^| )' + cls + '( |$)', 'gi').test(el.className);
	}

	function _addClass(el, cls) {
		if (el.classList) {
			var arr = cls.split(' ');
			for (var i in arr) el.classList.add(arr[i]);
		} else el.className += ' ' + cls;
	}

	function _removeClass(el, cls) {
		if (el.classList) {
			var arr = cls.split(' ');
			for (var i in arr) el.classList.remove(arr[i]);
		} else el.className = el.className.replace(new RegExp('(^|\\b)' + cls.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
	}
	var throttle = function (e, name, obj) {
		obj = obj || window;
		var running = false;
		var func = function () {
			if (running) return;
			running = true;
			requestAnimationFrame(function () {
				obj.dispatchEvent(new CustomEvent(name));
				running = false;
			});
		};
		obj.addEventListener(e, func);
	};
	throttle("scroll", "optimizedScroll");

	this.stickyHeader = function(el,cls){
		var rect = el.getBoundingClientRect();
		window.addEventListener("optimizedScroll", function () {
			if (document.body.scrollTop > rect.top) {
				header.style.marginBottom = el.scrollHeight + 'px';
				if (!_hasClass(el, cls)) _addClass(el, cls);
			} else {
				if (_hasClass(el, cls)) _removeClass(el, cls);
				header.style.marginBottom = 0 + 'px';
			}
		});
	}
}).call(this);
