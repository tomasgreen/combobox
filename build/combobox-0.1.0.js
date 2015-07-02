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
		backspace: 8,
		esc: 27
	};
	
	function _each(o, func) {
		if (!o || (o.length === 0 && o != window)) return;
		if (!o.length) func(o);
		else Array.prototype.forEach.call(o, function (el, i) {
			func(el);
		});
	}
	
	function _isString(obj) {
		return (typeof obj === 'string');
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
	
	function _toArray(els) {
		return Array.prototype.slice.call(els, 0);
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
	
	function _removeAttr(els, attrib) {
		_each(els, function(el) {
			el.removeAttribute(attrib);
		});
	}
	function _trim(str){
		return str.replace(/(^\s+|\s+$)/g, '');
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
	
	var events = {
		willadd: 'onWillAdd',	
		willremove: 'onWillRemove',
		willopen: 'onWillOpen',
		willclose: 'onWillClose',
		willload: 'onWillLoad',
		didadd: 'onDidAdd',
		didremove: 'onDidRemove',
		didopen: 'onDidOpen',
		didclose: 'onDidClose',
		didload: 'onDidLoad'
	};
	
	var defaults = {
		options: null,
		selected: null,
		delimiter: ',',
		create: true,
		createOnBlur: true,
		openOnFocus: true,
		maxSelected: 0,
		closeAfterSelect: true,
		selectOnTab: true,
		
		onWillAdd: null,
		onWillRemove: null,
		onWillOpen: null,
		onWillClose: null,
		onWillLoad: null,
		
		onDidAdd: null,
		onDidRemove: null,
		onDidOpen: null,
		onDidClose: null,
		onDidLoad: null
	};
	var Base = function (el, options) {
		this.opt = _setOptions(options);
		if(_isString(el)) this.el = document.querySelector(el);
		else this.el = el;
		
		if(!el) return;
		
		this.el.style.display = 'none';
		
		this.isSelectBox = (this.el.nodeName.toLowerCase() == 'select');
		
		this.container = _createElement('div.combobox');
		this.el.parentNode.insertBefore(this.container,this.el);
		this.container.appendChild(this.el);
	
		this.inputContainer = _createElement('div.combobox-input-container', null, this.container);
		this.dropdown = _createElement('div.combobox-dropdown',null,this.container);
		
		this.values = [];
		this.items = [];
		
		if(this.isSelectBox) _each(this.el.querySelectorAll('option'), function (o) {
			this.items.push(o.textContent);	
			if(_attr(o,'selected') !== null && _attr(o,'selected') !== undefined) {
				_createElement('div.combobox-option', null, this.inputContainer, o.textContent);
				this.addValue(o.textContent);
			}
		}.bind(this));

		this.inputEl = _createElement('input.combobox-input', null, this.inputContainer);

		this.tempEl = _createElement('div.combobox-temp', null, this.container);
		this.tempEl.style.letterSpacing = this.inputEl.style.letterSpacing;
		this.tempEl.style.fontSize = this.inputEl.style.fontSize;
		this.tempEl.style.fontFamily = this.inputEl.style.fontFamily;
		this.tempEl.style.fontWeight = this.inputEl.style.fontWeight;
		this.tempEl.style.textTransform = this.inputEl.style.textTransform;

		_on(this.inputContainer, 'focus click', function () {
			this.focus();
		}.bind(this));
		_on(this.inputEl, 'focus', function () {
			this.focus();
		}.bind(this));	
		_on(this.inputEl, 'blur', function () {
			this.blur();
		}.bind(this));
		
		_attr(this.inputContainer, 'placeholder', _attr(this.el, 'placeholder'));

		_on(this.inputEl, 'input', this.updateInputSize.bind(this));
		_on(this.inputEl, 'keydown', this.onKeyDown.bind(this));
		
		this.togglePlaceholder();
	};
	Base.prototype.onKeyDown = function (ev) {
		switch (ev.keyCode) {
			case _keyCodes.rightArrow: this.onKeyRightArrow(ev); break;
			case _keyCodes.leftArrow: this.onKeyLeftArrow(ev); break;
			case _keyCodes.backspace: this.onKeyBackspace(ev); break;
			case _keyCodes.esc: this.onKeyEsc(ev); break;
			case _keyCodes.enter: this.onKeyEnter(ev); break;
			default: break;
		}
		this.togglePlaceholder();
	};
	Base.prototype.onKeyEsc = function (ev) {
		this.resetInput();
	};
	Base.prototype.onKeyEnter = function (ev) {
		var value = this.inputEl.value = _trim(this.getValue());
		if (value.length === 0) return;

		var hasOption = (this.items.indexOf(value) >= 0);
		var hasValue = (this.values.indexOf(value) >= 0);
		
		if (hasValue) {
			this.resetInput();
			return;
		}
		if (!hasOption && !this.opt.create) return;
		if (this.opt.onWillAdd && this.opt.onWillAdd(value) === false) return;
		
		this.addValue(value);
		if(hasOption) this.items.push(value);
		
		if (this.isSelectBox) {
			var o = this.findOption(value);
			if (o) {
				if(!(_attr(o,'selected') !== null && _attr(o,'selected') !== undefined)) _attr(o,'selected','');	
			} else {
				o = _createElement('option',null, this.el, value);
				_attr(o,'selected','');
			}
		} else {
			this.el.value = this.values.join(this.opt.delimiter); 
		}
		var n = _createElement('div.combobox-option', null, null, value);
		this.inputEl.parentNode.insertBefore(n, this.inputEl);
		this.resetInput();
		this.inputEl.focus();
		
		if (this.opt.onDidAdd) this.opt.onDidAdd(value);
		this.populateDropdown();
	};
	Base.prototype.onKeyBackspace = function (ev) {
		if (this.getValue().length !== 0) return;
		if(this.hasFocused()) {
			this.removeFocused();
			return;
		}
		if(!this.inputEl.previousSibling) return;
		var value = this.inputEl.previousSibling.textContent;
		if (this.opt.onWillRemove && this.opt.onWillRemove(value) === false) return;
		if (this.isSelectBox) _removeAttr(this.findSelectedOption(this.inputEl.previousSibling.textContent),'selected');
		this.removeValue(value);
		this.inputEl.parentNode.removeChild(this.inputEl.previousSibling);
		if (this.opt.onDidRemove) this.opt.onDidRemove(value);
		this.inputEl.focus();
		this.populateDropdown();
	};
	Base.prototype.onKeyLeftArrow = function (ev) {
		if (this.getValue().length !== 0) return;
		if(ev.shiftKey) _focusPrev(this.inputEl);
		else this.removeFocus();
		if (this.inputEl.previousSibling) this.inputEl.parentNode.insertBefore(this.inputEl, this.inputEl.previousSibling);
		this.inputEl.focus();
	};
	Base.prototype.onKeyRightArrow = function (ev) {
		if (this.getValue().length !== 0) return;
		if(ev.shiftKey) _focusNext(this.inputEl);
		else this.removeFocus();
		
		if (this.inputEl.nextSibling) this.inputEl.parentNode.insertBefore(this.inputEl, this.inputEl.nextSibling.nextSibling);
		else this.inputEl.parentNode.appendChild(this.inputEl);
		this.inputEl.focus();
	};
	Base.prototype.resetInput = function () {
		this.inputEl.value = '';
		this.updateInputSize();
	};
	Base.prototype.updateInputSize = function () {
		this.tempEl.innerHTML = this.getValue();
		this.inputEl.style.width = this.tempEl.offsetWidth + 4 + 'px';
		this.togglePlaceholder();
	};
	Base.prototype.togglePlaceholder = function () {
		if (this.inputEl.parentNode.childNodes.length === 1 && this.getValue().length === 0) _addClass(this.inputEl.parentNode, 'combobox-placeholder');
		else _removeClass(this.inputEl.parentNode, 'combobox-placeholder');
	};
	Base.prototype.removeFocus = function (){
		_removeClass(this.inputEl.parentNode.querySelectorAll('.combobox-option-focused'),'combobox-option-focused');	
	};
	Base.prototype.hasFocused = function(){
		return (this.inputEl.parentNode.querySelectorAll('.combobox-option-focused').length > 0);
	};
	Base.prototype.removeFocused = function (){
		_each(this.inputEl.parentNode.querySelectorAll('.combobox-option-focused'), function(i){
			this.removeValue(i.textContent);
			i.parentNode.removeChild(i);
		}.bind(this));
	};
	Base.prototype.populateDropdown = function (){
		for(var i in this.items){
			var value = this.items[i];
			var el = this.dropdown.querySelector('[data-value="'+value+'"]');
			if(this.values.indexOf(value) != -1) {
				if(el) this.dropdown.removeChild(el);
				continue;
			}
			if(el) continue;
			_createElement('div.combobox-dropdown-option',{
				'data-value': value
			},this.dropdown,value);
		}
		var list = _toArray(this.dropdown.childNodes);
		if(list.length < 2) return;
	    list.sort(function(a, b) {
	        return a.textContent.toLowerCase().localeCompare(b.textContent.toLowerCase());
	    });
	    for (var c = 0; c < list.length; c++) {
	        list[c].parentNode.appendChild(list[c]);
	    }
	};
	Base.prototype.removeValue = function(value){
		var i = this.values.indexOf(value);
		if(i != -1) this.values.splice(i,1);
	};
	Base.prototype.addValue = function(value){
		this.values.push(value);
	};
	Base.prototype.findSelectedOption = function (text){
		var o;
		_each(this.el.querySelectorAll('option[selected]'), function (option) {
			if(option.textContent == text) o = option;
		}.bind(this));
		return o;
	};
	Base.prototype.findOption = function (text){
		var o;
		_each(this.el.querySelectorAll('option'), function (option) {
			if(option.textContent == text) o = option;
		}.bind(this));
		return o;
	};
	Base.prototype.getValue = function() {
		return this.inputEl.value;
	};
	Base.prototype.focus = function(){
		this.inputEl.focus();
		this.populateDropdown();
		_addClass(this.container,'combobox-dropdown-visible');
	};
	Base.prototype.blur = function(){
		this.inputEl.blur();
		this.populateDropdown();
		_removeClass(this.container,'combobox-dropdown-visible');	
	};
	Base.prototype.getItems = function(){
		return this.items;
	};
	Base.prototype.getValues = function(){	
		if(this.opt.maxSelected === 1) return this.values[0];
		return this.values;
	};
	Base.prototype.on = function(name,cb){
		if(events[name]) this.opt[events[name]] = cb;
	};
	this.ComboBox = function (el, options) {
		var instance = new Base(el, options);
		return instance;
	};

	this.ComboBox.globals = defaults;

}).call(this);