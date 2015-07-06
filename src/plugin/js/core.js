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
	}
	var _keyCodes = {
		leftArrow: 37,
		rightArrow: 39,
		upArrow: 38,
		downArrow: 40,
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

	function _hasParent(el,p){
		if(!el) return false;
		if(el.parentNode == p) return true;
		return _hasParent(el.parentNode,p);
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
		values: null,
		delimiter: ',',
		create: true,
		createOnBlur: true,
		openOnFocus: true,
		closeAfterSelect: true,
		selectOnTab: true,
		maxSelected: 0,
		maxSuggestions: Infinity,

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
				this.values.push(o.textContent);
			}
		}.bind(this));

		this.inputEl = _createElement('input.combobox-input', null, this.inputContainer);
		this.completionEl = _createElement('div.combobox-input-completion');
		this.tempEl = _createElement('div.combobox-temp', null, this.container);
		this.tempEl.style.letterSpacing = this.inputEl.style.letterSpacing;
		this.tempEl.style.fontSize = this.inputEl.style.fontSize;
		this.tempEl.style.fontFamily = this.inputEl.style.fontFamily;
		this.tempEl.style.fontWeight = this.inputEl.style.fontWeight;
		this.tempEl.style.textTransform = this.inputEl.style.textTransform;

		_attr(this.inputContainer, 'placeholder', _attr(this.el, 'placeholder'));

		_on(this.inputContainer, 'focus click', this.focus.bind(this));
		_on(this.inputEl, 'focus', this.focus.bind(this));
		_on(this.inputEl, 'input', this.onInput.bind(this));
		_on(this.inputEl, 'keydown', this.onKeyDown.bind(this));
		_on(document.documentElement,'click',this.onClick.bind(this));
		_on(document.documentElement,'mouseover',this.onHover.bind(this));

		this.togglePlaceholder();
		this.resetHeight();
	};
	Base.prototype.onClick = function(ev){
		if(!_hasParent(ev.srcElement,this.container)) this.blur();
		else if(_hasParent(ev.srcElement,this.dropdown)) this.onDropdownOptionClick(ev);
	};
	Base.prototype.onHover = function(ev){
		if(!_hasParent(ev.srcElement,this.container)) return;
		else if(_hasClass(ev.srcElement,'combobox-option')) this.setDropdownOptionFocus(ev.srcElement);
	};
	Base.prototype.onInput = function(){
		this.updateInputSize();
		this.updateDropdown();
	};
	Base.prototype.onKeyDown = function (ev) {
		switch (ev.keyCode) {
			case _keyCodes.rightArrow: this.onKeyRightArrow(ev); break;
			case _keyCodes.leftArrow: this.onKeyLeftArrow(ev); break;
			case _keyCodes.downArrow: this.onKeyDownArrow(ev); break;
			case _keyCodes.upArrow: this.onKeyUpArrow(ev); break;
			case _keyCodes.backspace: this.onKeyBackspace(ev); break;
			case _keyCodes.esc: this.onKeyEsc(ev); break;
			case _keyCodes.enter: this.onKeyEnter(ev); break;
			default: break;
		}
	};
	Base.prototype.onKeyEsc = function (ev) {
		this.hideDropdown();
	};
	Base.prototype.onKeyEnter = function (ev) {
		var value = this.inputEl.value = _trim(this.getInputValue());
		var hasValue = (this.values.indexOf(value) >= 0);
		var f = this.dropdown.querySelector('.combobox-option-focused');
		if (f && this.addValue(_attr(f,'data-value'))) this.resetInput();
		else if (hasValue || this.addValue(value)) this.resetInput();
	};
	Base.prototype.onKeyBackspace = function (ev) {
		if (this.getInputValue().length !== 0 && (this.inputEl.selectionStart > 0 || this.inputEl.selectionStart != this.inputEl.selectionEnd)) return;
		if(this.hasFocused()) {
			this.removeFocused();
			return;
		}
		if(!this.inputEl.previousSibling) return;
		var value = this.inputEl.previousSibling.textContent;
		if (this.opt.onWillRemove && this.opt.onWillRemove(value) === false) return;
		this.removeValue(value);
		this.inputEl.parentNode.removeChild(this.inputEl.previousSibling);
		if (this.opt.onDidRemove) this.opt.onDidRemove(value);
		this.inputEl.focus();
		this.updateDropdown(true);
	};
	Base.prototype.onKeyLeftArrow = function (ev) {
		if (this.getInputValue().length !== 0) return;
		if(ev.shiftKey) {
			if(this.inputEl.previousSibling) _toggleClass(this.inputEl.previousSibling, 'combobox-value-focused');
		}
		else this.removeFocus();
		if (this.inputEl.previousSibling) this.inputEl.parentNode.insertBefore(this.inputEl, this.inputEl.previousSibling);
		this.inputEl.focus();
	};
	Base.prototype.onKeyRightArrow = function (ev) {
		if (this.getInputValue().length !== 0) return;
		if(ev.shiftKey) {
			if(this.inputEl.nextSibling) _toggleClass(this.inputEl.nextSibling, 'combobox-value-focused');
		}
		else this.removeFocus();
		if (this.inputEl.nextSibling) this.inputEl.parentNode.insertBefore(this.inputEl, this.inputEl.nextSibling.nextSibling);
		else this.inputEl.parentNode.appendChild(this.inputEl);
		this.inputEl.focus();
	};
	Base.prototype.onKeyUpArrow = function (ev) {
		this.moveDropdownOptionFocus('prev');
		ev.preventDefault();
	};
	Base.prototype.onKeyDownArrow = function (ev) {
		this.moveDropdownOptionFocus('next');
		ev.preventDefault();
	};
	Base.prototype.onDropdownOptionClick = function(ev){
		var el = ev.srcElement;
		if(!_hasClass(el,'combobox-option')) return;
		if(this.addValue(_attr(el,'data-value'))) {
			this.resetInput();
			this.updateDropdown();
			this.inputEl.focus();
		}
	};
	Base.prototype.updateInputSize = function () {
		this.tempEl.innerHTML = this.getInputValue();
		this.inputEl.style.width = this.tempEl.offsetWidth + 4 + 'px';
	};
	Base.prototype.toggleCompletion = function () {
		var f = this.dropdown.querySelector('.combobox-option-focused');
		var s = _attr(f,'data-value');
		var v = this.getInputValue();
		if(!f || v.length === 0 || !s || s.toLowerCase().indexOf(v.toLowerCase()) !== 0) {
			this.completionEl.textContent = '';
			if(this.completionEl.parentNode) this.completionEl.parentNode.removeChild(this.completionEl);
		}
		else {
			this.completionEl.textContent = s.substring(v.length);
			if(this.inputEl.nextSibling) this.inputEl.parentNode.insertBefore(this.completionEl, this.inputEl.nextSibling);
			else this.inputEl.parentNode.appendChild(this.completionEl);
		}
	};
	Base.prototype.togglePlaceholder = function () {
		if (!_attr(this.inputContainer,'data-completion') && this.inputEl.parentNode.childNodes.length === 1 && this.getInputValue().length === 0) _addClass(this.inputEl.parentNode, 'combobox-placeholder');
		else _removeClass(this.inputEl.parentNode, 'combobox-placeholder');
	};
	Base.prototype.removeFocus = function (){
		_removeClass(this.inputEl.parentNode.querySelectorAll('.combobox-value-focused'),'combobox-value-focused');
	};
	Base.prototype.hasFocused = function(){
		return (this.inputEl.parentNode.querySelectorAll('.combobox-value-focused').length > 0);
	};
	Base.prototype.removeFocused = function (){
		_each(this.inputEl.parentNode.querySelectorAll('.combobox-value-focused'), function(i){
			this.removeValue(i.textContent);
			i.parentNode.removeChild(i);
		}.bind(this));
		this.updateDropdown();
	};
	Base.prototype.clearDropdownOptionFocus = function(){
		var el = this.dropdown.querySelector('.combobox-option-focused');
		if(el && el.style.display == 'none') _removeClass(el,'combobox-option-focused');
	};
	Base.prototype.setDropdownOptionFocus = function(el){
		var f = this.dropdown.querySelector('.combobox-option-focused');
		if(f) _removeClass(f,'combobox-option-focused');
		if(el) _addClass(el,'combobox-option-focused');
	};
	Base.prototype.moveDropdownOptionFocus = function(direction){
		var els = this.dropdown.querySelectorAll('.combobox-option');
		if(!els) return;
		var el = this.dropdown.querySelector('.combobox-option-focused');
		if(!el) {
			_addClass(els[0],'combobox-option-focused');
			return;
		}
		var s;
		if(direction == 'next' && el.nextSibling) s = el.nextSibling;
		else if(direction == 'prev' && el.previousSibling) s = el.previousSibling;
		if(!s) return;
		s.scrollIntoView(false);
		_addClass(s,'combobox-option-focused');
		_removeClass(el,'combobox-option-focused');
		this.toggleCompletion();
	};
	Base.prototype.toggleHighlight = function() {
		var value = _trim(this.getInputValue());
		var list = _toArray(this.dropdown.childNodes);
		var re = new RegExp(value, 'i');
		var first;
	    for (var c = 0; c < list.length; c++) {
			var e = list[c];
			if(!first) first = e;
			var original = _attr(e,'data-value');
	        if(!value || value.length === 0) {
				e.innerHTML = original;
				continue;
			}
			var res = re.exec(original);
			e.innerHTML = original.replace(re,'<span class="combobox-highlight">'+res[0]+'</span>');
	    }
		if(first) this.setDropdownOptionFocus(first);
		else this.clearDropdownOptionFocus();
	};
	Base.prototype.populateDropdown = function (){
		var value = this.getInputValue();
		var arr = this.getSuggestions(value);
		this.dropdown.innerHTML = '';
		for(var i in arr){
			if(i > this.opt.maxSuggestions) break;
			var v = arr[i];
			_createElement('div.combobox-option', {
				'data-value': v
			},this.dropdown,v);
		}
	};
	Base.prototype.getSuggestions = function(value) {
		var re = new RegExp(value, 'i');
		var vals = this.values;
		var filtered = this.items.filter(function(i){
			if(vals.indexOf(i) >= 0) return false;
			return re.test(i);
		});
		filtered.sort(function(a,b){
			if(b.toLowerCase().indexOf(value) < a.toLowerCase().indexOf(value)) return 1;
			else if(b.toLowerCase().indexOf(value) > a.toLowerCase().indexOf(value)) return -1;
			return a.toLowerCase().localeCompare(b.toLowerCase());
		});
		return filtered;
	};
	Base.prototype.updateDropdown = function(force) {
		var value = this.getInputValue();
		if(force || this.lastValue != value){
			this.populateDropdown();
			this.toggleHighlight();
			this.togglePlaceholder();
			this.showDropdown();
		}
		this.lastValue = value;
		this.toggleCompletion();
	};
	Base.prototype.showDropdown = function() {
		if(this.dropdown.childNodes.length > 0) _addClass(this.container,'combobox-dropdown-visible');
		else _removeClass(this.container,'combobox-dropdown-visible');
	};
	Base.prototype.hideDropdown = function() {
		_removeClass(this.container,'combobox-dropdown-visible');
		this.setDropdownOptionFocus();
	};
	Base.prototype.removeValue = function(value){
		var i = this.values.indexOf(value);
		if(i != -1) {
			this.values.splice(i,1);
			this.updateElementValue();
			return true;
		}
		return false;
	};
	Base.prototype.addValue = function (value) {
		if (value.length === 0) return false;

		var hasOption = (this.items.indexOf(value) >= 0);
		var hasValue = (this.values.indexOf(value) >= 0);

		if (hasValue || (!hasOption && !this.opt.create) || (this.opt.onWillAdd && this.opt.onWillAdd(value) === false)) return false;

		this.values.push(value);
		if(!hasOption) this.items.push(value);

		var n = _createElement('div.combobox-value', null, null, value);
		this.inputEl.parentNode.insertBefore(n, this.inputEl);

		if (this.opt.onDidAdd) this.opt.onDidAdd(value);
		this.updateDropdown(true);
		this.resetHeight();
		this.updateElementValue();
		return true;
	};
	Base.prototype.updateElementValue = function(){
		var tn = this.el.nodeName.toLowerCase();
		if(tn == 'select') {
			this.el.innerHTML = '';
			for(var i in this.values) {
				_createElement('option',{
					selected: ''
				}, this.el, this.values[i]);
			}
		}
		else if(tn == 'input') this.el.value = this.values.join(this.opt.delimiter);
		else if(tn == 'textarea') this.el.innerHTML = this.values.join(this.opt.delimiter);
	};
	Base.prototype.focus = function(){
		this.inputEl.focus();
		this.updateDropdown(this.opt.openOnFocus);
	};
	Base.prototype.blur = function(){
		this.inputEl.blur();
		this.hideDropdown();
	};
	Base.prototype.getItems = function(){
		return this.items;
	};
	Base.prototype.getValues = function(){
		if(this.opt.maxSelected === 1) return this.values[0];
		return this.values;
	};
	Base.prototype.getInputValue = function() {
		return this.inputEl.value;
	};
	Base.prototype.resetHeight = function(){
		var r = this.inputContainer.getBoundingClientRect();
		this.container.style.maxHeight = r.height + 'px';
	};
	Base.prototype.resetInput = function () {
		this.inputEl.value = '';
		this.updateInputSize();
		this.updateDropdown(true);
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
