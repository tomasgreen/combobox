function _extend(sup, obj) {
	obj.prototype = Object.create(sup.prototype);
	obj.prototype.constructor = obj;
	return obj;
}

function _removeChildren(el) {
	if (!el || !el.firstChild) return;
	el.removeChild(el.firstChild);
	_removeChildren(el);
}

function _createElement(ns, type, attr, parent, html) {
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
}

function _removeNode(element) {
	if (!element || !element.parentNode) return;
	element.parentNode.removeChild(element);
	return undefined;
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

function _isTouchEvent(e) {
	return (e.toString().toLowerCase() == '[object touchevent]');
}

function _toInt(n) {
	return parseInt(n, 10);
}

function _toArray(els) {
	return Array.prototype.slice.call(els, 0);
}

function _first(a) {
	return a[0];
}

function _last(a) {
	return a[a.length - 1];
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
	if (!_isTouchDevice) {
		_on(el, 'click', func);
		return;
	}
	var t = false;
	_on(el, 'touchstart', function (ev) {
		t = true;
	});
	_on(el, 'touchend', function (ev) {
		if (t) {
			func();
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
		func(ev);
		_off(el, events, func);
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

function _attr(els, attrib, value) {
	_each(els, function (el) {
		el.setAttribute(attrib, value);
	});
}

function _setOptions(opt) {
	if (opt === undefined) opt = {};
	var o = {};
	for (var i in defaults) o[i] = (opt[i] !== undefined) ? opt[i] : defaults[i];
	return o;
}

function _isObject(obj) {
	return obj === Object(obj);
}

function _isString(obj) {
	return (typeof obj === 'string');
}

function _animateCSS(el, cls, start, end) {
	if (start) _one(el, _animationStartEvents, start);
	_one(el, _animationStartEvents, function (ev) {
		_removeClass(el, cls);
		if (end) end(ev);
	});
	_addClass(el, cls);
}

function _getPosition(e) {
	var parentPosition = _getElemenntPosition(e.currentTarget);
	if (_isTouchEvent(e)) {
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
}

function _getElemenntPosition(element) {
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
}