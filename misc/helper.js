(function () {
	'use strict';
	var Helper = {};

	var _animationEndEvents = 'webkitAnimationEnd mozAnimationEnd msAnimationEnd oAnimationEnd animationend',
		_animationStartEvents = 'webkitAnimationStart mozAnimationStart msAnimationStart oAnimationStart animationstart';

	Helper.extend = function (sup, obj) {
		obj.prototype = Object.create(sup.prototype);
		obj.prototype.constructor = obj;
		return obj;
	};

	Helper.removeChildren = function (el) {
		if (!el || !el.firstChild) return;
		el.removeChild(el.firstChild);
		Helper.removeChildren(el);
	};

	Helper.createElement = function (ns, type, attr, parent, html) {
		var el, cls, id, arr;
		if (!attr) attr = {};
		if (type.indexOf('.') !== -1) {
			arr = type.split('.');
			type = arr[0];
			arr.shift();
			attr.class = arr.join(' ');
		}
		if (type.indexOf('#') !== -1) {
			arr = type.split('#');
			type = arr[0];
			attr.id = arr[1];
		}
		if (ns == 'svg') el = document.createElementNS('http://www.w3.org/2000/svg', type);
		else el = document.createElement(type);
		for (var i in attr) el.setAttribute(i, attr[i]);
		if (parent) parent.appendChild(el);
		if (html) el.innerHTML = html;
		return el;
	};

	Helper.removeNode = function (element) {
		if (!element || !element.parentNode) return;
		element.parentNode.removeChild(element);
		return undefined;
	};

	Helper.detectCSSFeature = function (featurename) {
		var feature = false,
			domPrefixes = 'Webkit Moz ms O'.split(' '),
			el = document.createElement('div'),
			featurenameCapital = null;

		featurename = featurename.toLowerCase();
		if (el.style[featurename] !== undefined) feature = true;
		if (feature === false) {
			featurenameCapital = featurename.charAt(0).toUpperCase() + featurename.substr(1);
			for (var i = 0; i < domPrefixes.length; i++) {
				if (el.style[domPrefixes[i] + featurenameCapital] !== undefined) {
					feature = true;
					break;
				}
			}
		}
		return feature;
	};

	Helper.isTouchEvent = function (e) {
		return (e.toString().toLowerCase() == '[object touchevent]');
	};

	Helper.toInt = function (n) {
		return parseInt(n, 10);
	};

	Helper.toArray = function (els) {
		return Array.prototype.slice.call(els, 0);
	};

	Helper.first = function (a) {
		return a[0];
	};

	Helper.last = function (a) {
		return a[a.length - 1];
	};

	Helper.isChild = function (c, p) {
		if (!c || !p || !c.parentNode) return false;
		else if (c === p || c.parentNode === p) return true;
		return Helper.isChild(c.parentNode, p);
	};

	Helper.stopEventPropagation = function (e) {
		if (typeof e.stopPropagation === 'function') {
			e.stopPropagation();
			e.preventDefault();
		} else if (window.event && window.event.hasOwnProperty('cancelBubble')) {
			window.event.cancelBubble = true;
		}
	};

	Helper.tapOn = function (el, func) {
		if (!Helper.isTouchDevice) {
			Helper.on(el, 'click', func);
			return;
		}
		var t = false;
		Helper.on(el, 'touchstart', function (ev) {
			t = true;
		});
		Helper.on(el, 'touchend', function (ev) {
			if (t) {
				func();
				Helper.stopEventPropagation(ev);
			}
		});
		Helper.on(el, 'touchcancel touchleave touchmove', function (ev) {
			t = false;
		});
	};

	Helper.tapOff = function (el, func) {
		Helper.off(el, 'touchstart touchend touchcancel click', func);
	};

	Helper.each = function (o, func) {
		if (!o || (o.length === 0 && o != window)) return;
		if (!o.length) func(o);
		else Array.prototype.forEach.call(o, function (el, i) {
			func(el);
		});
	};

	Helper.one = function (el, events, func, useCapture) {
		Helper.on(el, events, function (ev) {
			func(ev);
			Helper.off(el, events, func);
		}, useCapture);
	};

	Helper.on = function (els, events, func, useCapture) {
		Helper.each(els, function (el) {
			var ev = events.split(' ');
			for (var e in ev) el.addEventListener(ev[e], func, useCapture);
		});
	};

	Helper.off = function (els, events, func) {
		Helper.each(els, function (el) {
			var ev = events.split(' ');
			for (var e in ev) el.removeEventListener(ev[e], func);
		});
	};

	Helper.attr = function (els, attrib, value) {
		Helper.each(els, function (el) {
			el.setAttribute(attrib, value);
		});
	};

	Helper.setOptions = function (opt) {
		if (opt === undefined) opt = {};
		var o = {};
		for (var i in defaults) o[i] = (opt[i] !== undefined) ? opt[i] : defaults[i];
		return o;
	};

	Helper.isObject = function (obj) {
		return obj === Object(obj);
	};

	Helper.isString = function (obj) {
		return (typeof obj === 'string');
	};

	Helper.animateCSS = function (el, cls, start, end) {
		if (start) Helper.one(el, _animationStartEvents, start);
		Helper.one(el, _animationStartEvents, function (ev) {
			Helper.removeClass(el, cls);
			if (end) end(ev);
		});
		Helper.addClass(el, cls);
	};

	Helper.getPosition = function (e) {
		var parentPosition = Helper.getElemenntPosition(e.currentTarget);
		if (Helper.isTouchEvent(e)) {
			return {
				x: e.layerX,
				y: e.layerY
			};
		} else {
			return {
				x: e.pageX - parentPosition.x,
				y: e.pageY - parentPosition.y
			};
		}
	};

	Helper.getElemenntPosition = function (element) {
		var coord = {
			x: 0,
			y: 0
		};
		while (element) {
			coord.x += (element.offsetLeft - element.scrollLeft + element.clientLeft);
			coord.y += (element.offsetTop - element.scrollTop + element.clientTop);
			element = element.offsetParent;
		}
		return coord;
	};

	this.HelperName = Helper;

}).call(this);