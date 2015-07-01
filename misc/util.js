(function () {
	'use strict';
	var _animationEndEvents = 'webkitAnimationEnd mozAnimationEnd msAnimationEnd oAnimationEnd animationend',
		_animationStartEvents = 'webkitAnimationStart mozAnimationStart msAnimationStart oAnimationStart animationstart',
		_transitionEndEvents = 'transitionend webkitTransitionEnd oTransitionEnd otransitionend msTransitionEnd';

	function _removeNode(element) {
		if (!element || !element.parentNode) return;
		element.parentNode.removeChild(element);
		return undefined;
	}

	function _removeChildren(el) {
		if (!el) return;
		while (el.firstChild) {
			el.removeChild(el.firstChild);
		}
	}

	function _getTmpl(id) {
		var t = document.querySelector('#' + id);
		return document.importNode(t.content, true);
	}

	function _appendText(el, txt) {
		var t = document.createTextNode(txt);
		el.appendChild(t);
	}

	function _launchFullScreen(el) {
		if (el.requestFullscreen) {
			el.requestFullscreen();
		} else if (el.mozRequestFullScreen) {
			el.mozRequestFullScreen();
		} else if (el.webkitRequestFullscreen) {
			el.webkitRequestFullscreen();
		} else if (el.msRequestFullscreen) {
			el.msRequestFullscreen();
		}
	}

	function _detectCSSFeature(featurename) {
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
	}
	
	function _toElement(html) {
		var a = document.createElement('div');
		a.innerHTML = html;
		return a.firstChild;
	}
	
	function _toArray(els) {
		return Array.prototype.slice.call(els, 0);
	}

	function _toInt(n) {
		return parseInt(n, 10);
	}

	function _createElement(type, attrib, parent, html) {
		var el, arr;
		if (!attrib) attrib = {};
		if (type.indexOf('.') !== -1) {
			arr = type.split('.');
			type = arr[0];
			arr.shift();
			attrib.class = arr.join(' ');
		}
		if (type.indexOf('#') !== -1) {
			arr = type.split('#');
			type = arr[0];
			attrib.id = arr[1];
		}
		el = document.createElement(type);
		for (var i in attrib) el.setAttribute(i, attrib[i]);
		if (parent) parent.appendChild(el);
		if (html) el.innerHTML = html;
		return el;
	}

	function _isChild(c, p) {
		if (!c || !p || !c.parentNode) return false;
		else if (c === p || c.parentNode === p) return true;
		return _isChild(c.parentNode, p);
	}

	function _stopEventPropagation(e) {
		if (typeof e.stopPropagation === 'function') {
			e.stopPropagation();
			e.preventDefault();
		} else if (window.event && window.event.hasOwnProperty('cancelBubble')) {
			window.event.cancelBubble = true;
		}
	}

	function _tapOn(el, func) {
		if (el.ontouchstart === undefined) {
			_on(el, 'click', func);
			return;
		}
		var t = false;
		_on(el, 'touchstart', function (ev) {
			t = true;
		});
		_on(el, 'touchend', function (ev) {
			if (t) {
				func(ev);
				_stopEventPropagation(ev);
			}
		});
		_on(el, 'touchcancel touchleave touchmove', function (ev) {
			t = false;
		});
	}

	function _tapOff(el, func) {
		_off(el, 'touchstart touchend touchcancel click', func);
	}

	function _each(o, func) {
		if (!o || (o.length === 0 && o != window)) return;
		if (!o.length) func(o);
		else Array.prototype.forEach.call(o, function (el, i) {
			func(el);
		});
	}

	function _one(el, events, func, useCapture) {
		_on(el, events, function (ev) {
			_off(el, events, func);
			func(ev);
		}, useCapture);
	}

	function _on(els, events, func, useCapture) {
		_each(els, function (el) {
			var ev = events.split(' ');
			for (var e in ev) el.addEventListener(ev[e], func, useCapture);
		});
	}

	function _off(els, events, func) {
		_each(els, function (el) {
			var ev = events.split(' ');
			for (var e in ev) el.removeEventListener(ev[e], func);
		});
	}

	function _addClass(els, cls) {
		_each(els, function (el) {
			if (el.classList) {
				var arr = cls.split(' ');
				for (var i in arr) el.classList.add(arr[i]);
			} else el.className += ' ' + cls;
		});
	}

	function _removeClass(els, cls) {
		_each(els, function (el) {
			if (el.classList) {
				var arr = cls.split(' ');
				for (var i in arr) el.classList.remove(arr[i]);
			} else el.className = el.className.replace(new RegExp('(^|\\b)' + cls.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
		});
	}

	function _hasClass(el, cls) {
		if (el.classList) return el.classList.contains(cls);
		else return new RegExp('(^| )' + cls + '( |$)', 'gi').test(el.className);
	}

	function _toggleClass(els, cls) {
		_each(els, function (el) {
			if (_hasClass(el, cls)) _removeClass(el, cls);
			else _addClass(el, cls);
		});
	}

	function _animateCSS(el, cls, start, end) {
		if (start) _one(el, _animationStartEvents, start);
		_one(el, _animationEndEvents, function (ev) {
			_removeClass(el, cls);
			if (end) end(ev);
		});
		_addClass(el, cls);
	}

	function _attr(els, attrib, value) {
		if (value === undefined && els && els.getAttribute !== undefined) return els.getAttribute(attrib);
		_each(els, function (el) {
			el.setAttribute(attrib, value);
		});
	}

	function _isObject(obj) {
		return obj === Object(obj);
	}

	function _isString(obj) {
		return (typeof obj === 'string');
	}

	function _isFunction(obj) {
		return typeof obj === 'function';
	}

	function _objectLength(obj) {
		if (!util.isObject(obj)) return 0;
		if (!Object.keys) {
			var k;
			for (var i in obj) {
				if (Object.prototype.hasOwnProperty.call(obj, i)) {
					k++;
				}
			}
			return k;
		}
		return Object.keys(obj).length;
	}

	function _getLocation(callback) {
		var options = {
			enableHighAccuracy: true,
			timeout: 5000,
			maximumAge: 0
		};

		function success(pos) {
			callback(pos.coords);
		}

		function error(err) {
			callback(null, err);
		}
		navigator.geolocation.getCurrentPosition(success, error, options);
	}

	function _clone(obj) {
		return JSON.parse(JSON.stringify(obj));
	}

	var util = {
		removeNode: _removeNode,
		detectCSSFeature: _detectCSSFeature,
		toArray: _toArray,
		toInt: _toInt,
		createElement: _createElement,
		isChild: _isChild,
		stopEventPropagation: _stopEventPropagation,
		tapOn: _tapOn,
		tapOff: _tapOff,
		each: _each,
		one: _one,
		on: _on,
		off: _off,
		addClass: _addClass,
		removeClass: _removeClass,
		toggleClass: _toggleClass,
		hasClass: _hasClass,
		animateCSS: _animateCSS,
		attr: _attr,
		isObject: _isObject,
		isString: _isString,
		isFunction: _isFunction,
		objectLength: _objectLength,
		getLocation: _getLocation,
		launchFullScreen: _launchFullScreen,
		clone: _clone,
		getTmpl: _getTmpl,
		appendText: _appendText,
		removeChildren: _removeChildren,
		toElement: _toElement
	};
	this.util = util;
}).call(this);