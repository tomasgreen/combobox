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

	function _focusPrev(el){
		_toggleClass(el.previousSibling, 'combobox-option-focused');
	}

	function _focusNext(el){
		_toggleClass(el.nextSibling, 'combobox-option-focused');
	}

	function _findVisible(el, direction){
		if(direction == 'next'){
			if(!el.nextSibling) return null;
			if(el.nextSibling.style.display != 'none') return el.nextSibling;
			else return _findVisible(el.nextSibling,direction);
		}
		if(direction == 'prev'){
			if(!el.previousSibling) return null;
			if(el.previousSibling.style.display != 'none') return el.previousSibling;
			else return _findVisible(el.previousSibling,direction);
		}
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
				this.values.push(o.textContent);
			}
		}.bind(this));

		this.inputEl = _createElement('input.combobox-input', null, this.inputContainer);

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
		else if(_hasClass(ev.srcElement,'combobox-dropdown-option')) this.setDropdownOptionFocus(ev.srcElement);
	};
	Base.prototype.onInput = function(){
		this.updateInputSize();
		var value = _trim(this.getValue());
		this.filterDropdown(value);
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
		this.togglePlaceholder();
	};
	Base.prototype.onKeyEsc = function (ev) {
		this.hideDropdown();
	};
	Base.prototype.onKeyEnter = function (ev) {
		var value = this.inputEl.value = _trim(this.getValue());
		var hasValue = (this.values.indexOf(value) >= 0);
		var foc = this.dropdown.querySelector('.combobox-dropdown-option-focused');
		if (foc && this.addValue(_attr(foc,'data-value'))) {
			this.moveDropdownOptionFocus('next');
			this.resetInput();
		}
		else if (hasValue || this.addValue(value)) this.resetInput();
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
		this.showDropdown();
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
	Base.prototype.onKeyUpArrow = function (ev) {
		this.moveDropdownOptionFocus('prev');
	};
	Base.prototype.onKeyDownArrow = function (ev) {
		this.moveDropdownOptionFocus('next');
	};
	Base.prototype.onDropdownOptionClick = function(ev){
		var el = ev.srcElement;
		if(!_hasClass(el,'combobox-dropdown-option')) return;
		if(this.addValue(el.textContent)) {
			this.resetInput();
			this.showDropdown();
			this.inputEl.focus();
		}
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
		this.showDropdown();
	};
	Base.prototype.clearDropdownOptionFocus = function(){
		var el = this.dropdown.querySelector('.combobox-dropdown-option-focused');
		if(el && el.style.display == 'none') _removeClass(el,'combobox-dropdown-option-focused');
	};
	Base.prototype.setDropdownOptionFocus = function(el){
		var f = this.dropdown.querySelector('.combobox-dropdown-option-focused');
		if(f) _removeClass(f,'combobox-dropdown-option-focused');
		if(el) _addClass(el,'combobox-dropdown-option-focused');
	};
	Base.prototype.moveDropdownOptionFocus = function(direction){
		var els = this.dropdown.querySelectorAll('.combobox-dropdown-option');
		if(!els) return;
		var el = this.dropdown.querySelector('.combobox-dropdown-option-focused');
		if(!el) {
			_addClass(els[0],'combobox-dropdown-option-focused');
			return;
		}
		var s = _findVisible(el,direction);
		if(!s) return;
		s.scrollIntoView(false);
		_addClass(s,'combobox-dropdown-option-focused');
		_removeClass(el,'combobox-dropdown-option-focused');
	};
	Base.prototype.filterDropdown = function(val) {
		var list = _toArray(this.dropdown.childNodes);
		var re = new RegExp(val, 'i');
		var first;
	    for (var c = 0; c < list.length; c++) {
			var e = list[c];
			var original = _attr(e,'data-value');
	        if(!val || val.length === 0) {
				e.style.display = 'block';
				e.innerHTML = original;
				continue;
			}
			var res = re.exec(original);
			if(res) {
				e.style.display = 'block';
				e.innerHTML = original.replace(re,'<span class="combobox-highlight">'+res[0]+'</span>');
				if(!first) first = e;
			}
			else e.style.display = 'none';
	    }
		if(first) this.setDropdownOptionFocus(first);
		else this.clearDropdownOptionFocus();
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
	        return _attr(a,'data-value').toLowerCase().localeCompare(_attr(b,'data-value').toLowerCase());
	    });
	    for (var c = 0; c < list.length; c++) {
	        list[c].parentNode.appendChild(list[c]);
	    }
	};
	
	Base.prototype.showDropdown = function() {
		this.populateDropdown();
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
			return true;
		}
		return false;
	};
	Base.prototype.addValue = function (value) {
		if (value.length === 0) return false;

		var hasOption = (this.items.indexOf(value) >= 0);
		var hasValue = (this.values.indexOf(value) >= 0);

		if (hasValue) return false;
		if (!hasOption && !this.opt.create) return false;
		if (this.opt.onWillAdd && this.opt.onWillAdd(value) === false) return false;

		this.values.push(value);
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

		if (this.opt.onDidAdd) this.opt.onDidAdd(value);
		this.showDropdown();
		this.togglePlaceholder();
		this.resetHeight();
		return true;
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
		this.showDropdown();
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
	Base.prototype.resetHeight = function(){
		var r = this.inputContainer.getBoundingClientRect();
		this.container.style.maxHeight = r.height + 'px';
	};
	Base.prototype.resetInput = function () {
		this.inputEl.value = '';
		this.updateInputSize();
		this.filterDropdown();
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
