(function () {
	'use strict';

	function _getSelection(input) {
		var result = {};
		if ('selectionStart' in input) {
			result.start = input.selectionStart;
			result.length = input.selectionEnd - result.start;
		} else if (document.selection) {
			input.focus();
			var sel = document.selection.createRange();
			var selLen = document.selection.createRange().text.length;
			sel.moveStart('character', -input.value.length);
			result.start = sel.text.length - selLen;
			result.length = selLen;
		}
		return result;
	};
	var _keyCodes = {
		leftArrow: 37,
		rightArrow: 39,
		enter: 13,
		backspace: 8
	};
	
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
		if(!el) return;
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

	function _setOptions(opt) {
		if (opt === undefined) opt = {};
		var o = {};
		for (var i in defaults) o[i] = (opt[i] !== undefined) ? opt[i] : defaults[i];
		return o;
	}

	function _insertAfter(el, newEl) {
		if (!el || el.parentNode) return;
		if (el.nextSibling) el.parentNode.insertBefore(newEl, el.nextSibling);
		el.parentNode.appendChild(newEl);
	}
	function _focusPrev(el){
		_toggleClass(el.previousSibling, 'combobox-option-focused');
	}
	function _focusNext(el){
		_toggleClass(el.nextSibling, 'combobox-option-focused');
	}
	/* ************************************
	############## COMBOBOX ###############
	************************************ */

	var defaults = {

	};
	var Base = function (el, options) {
		this.opt = _setOptions(el, options);
		this.el = el;
		this.el.style.display = 'none';
		this.container = _createElement('div.combobox', null, this.el.parentNode);
		this.container.appendChild(this.el);

		this.inputContainer = _createElement('div.combobox-input-container', null, this.container);

		this.tempEl = _createElement('div.combobox-temp', null, this.container);

		_each(el.querySelectorAll('option[selected]'), function (el) {
			_createElement('div.combobox-option', null, this.inputContainer, el.innerHTML);
		}.bind(this));

		this.inputEl = _createElement('input.combobox-input', null, this.inputContainer);

		this.tempEl.style.letterSpacing = this.inputEl.style.letterSpacing;
		this.tempEl.style.fontSize = this.inputEl.style.fontSize;
		this.tempEl.style.fontFamily = this.inputEl.style.fontFamily;
		this.tempEl.style.fontWeight = this.inputEl.style.fontWeight;
		this.tempEl.style.textTransform = this.inputEl.style.textTransform;

		_on(this.container, 'focus click', function () {
			this.inputEl.focus();
		}.bind(this));

		_attr(this.inputContainer, 'placeholder', _attr(this.el, 'placeholder'));

		_on(this.inputEl, 'input', this.updateInputSize.bind(this));
		_on(this.inputEl, 'keydown', this.onKeyDown.bind(this));
	};
	Base.prototype.onKeyDown = function (ev) {
		switch (ev.keyCode) {
			case _keyCodes.rightArrow: this.onKeyRightArrow(ev); break;
			case _keyCodes.leftArrow: this.onKeyLeftArrow(ev); break;
			case _keyCodes.backspace: this.onKeyBackspace(ev); break;
			case _keyCodes.enter: this.onKeyEnter(ev); break;
			default: break;
		}
		this.togglePlaceholder();
	};
	Base.prototype.onKeyEnter = function (ev) {
		if (this.inputEl.value.length === 0) return;
		var n = _createElement('div.combobox-option', null, this.container, this.inputEl.value);
		this.inputEl.parentNode.insertBefore(n, this.inputEl);
		this.inputEl.value = '';
		this.updateInputSize();
		this.inputEl.focus();
	};
	Base.prototype.onKeyBackspace = function (ev) {
		if (this.inputEl.value.length !== 0) return;
		if (this.inputEl.previousSibling) this.inputEl.parentNode.removeChild(this.inputEl.previousSibling);
		this.inputEl.focus();
	};
	Base.prototype.onKeyLeftArrow = function (ev) {
		if (this.inputEl.value.length !== 0) return;
		if(ev.shiftKey) _focusPrev(this.inputEl);
		else this.removeFocus();
		if (this.inputEl.previousSibling) this.inputEl.parentNode.insertBefore(this.inputEl, this.inputEl.previousSibling);
		this.inputEl.focus();
	};
	Base.prototype.onKeyRightArrow = function (ev) {
		if (this.inputEl.value.length !== 0) return;
		if(ev.shiftKey) _focusNext(this.inputEl);
		else this.removeFocus();
		
		if (this.inputEl.nextSibling) this.inputEl.parentNode.insertBefore(this.inputEl, this.inputEl.nextSibling.nextSibling);
		else this.inputEl.parentNode.appendChild(this.inputEl);
		this.inputEl.focus();
	};
	Base.prototype.updateInputSize = function () {
		this.tempEl.innerHTML = this.inputEl.value;
		this.inputEl.style.width = this.tempEl.offsetWidth + 4 + 'px';
		this.togglePlaceholder();
	};
	Base.prototype.togglePlaceholder = function () {
		if (this.inputEl.parentNode.childNodes.length === 1 && this.inputEl.value.length === 0) _addClass(this.inputEl.parentNode, 'combobox-placeholder');
		else _removeClass(this.inputEl.parentNode, 'combobox-placeholder');
	};
	Base.prototype.removeFocus = function (){
		_removeClass(this.inputEl.parentNode.querySelectorAll('.combobox-option-focused'),'combobox-option-focused');	
	};
	this.ComboBox = function (el, options) {
		var instance = new Base(el, options);
		return instance;
	};

	this.ComboBox.globals = defaults;

}).call(this);