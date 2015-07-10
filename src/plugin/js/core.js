(function () {
	'use strict';

	var _keyCodes = {
		leftArrow: 37,
		rightArrow: 39,
		upArrow: 38,
		downArrow: 40,
		enter: 13,
		backspace: 8,
		esc: 27
	};

	function _removeChildren(el) {
		if (!el) return;
		while (el.firstChild) {
			el.removeChild(el.firstChild);
		}
	}

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

	function _toElement(html) {
		var a = document.createElement('div');
		a.innerHTML = html;
		return a.firstChild;
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
		_on(el, 'touchstart', function(ev) {
			t = true;
		});
		_on(el, 'touchend', function(ev) {
			if (t) {
				func(ev);
				_stopEventPropagation(ev);
			}
		});
		_on(el, 'touchcancel touchleave touchmove', function(ev) {
			t = false;
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
		maxSuggestions: Infinity
	};
	var Base = function (el, options) {
		this.opt = _setOptions(options);
		this.el = el;
		if(!this.el) return;

		this.el.style.display = 'none';

		this.isSelectBox = (this.el.nodeName.toLowerCase() == 'select');

		this.container = _createElement('div.combobox');
		this.el.parentNode.insertBefore(this.container,this.el);
		this.container.appendChild(this.el);

		this.inputContainer = _createElement('div.combobox-input-container', null, this.container);
		this.dropdown = _createElement('div.combobox-dropdown',null,this.container);

		this.values = [];
		this.options = [];
		this.dropdownElements = [];

		if(this.isSelectBox) _each(this.el.querySelectorAll('option'), function (o) {
			this.options.push(o.textContent);
			if(_attr(o,'selected') !== null && _attr(o,'selected') !== undefined) {
				this.values.push(o.textContent);
			}
		}.bind(this));

		this.inputEl = _createElement('input.combobox-input', null, this.inputContainer);
		this.completionEl = _createElement('div.combobox-input-completion');
		this.addEl = _createElement('div.combobox-add');

		this.tempEl = _createElement('div.combobox-temp', null, this.container);
		this.tempEl.style.letterSpacing = this.inputEl.style.letterSpacing;
		this.tempEl.style.fontSize = this.inputEl.style.fontSize;
		this.tempEl.style.fontFamily = this.inputEl.style.fontFamily;
		this.tempEl.style.fontWeight = this.inputEl.style.fontWeight;
		this.tempEl.style.textTransform = this.inputEl.style.textTransform;

		_attr(this.inputContainer, 'placeholder', _attr(this.el, 'placeholder'));

		_on(this.inputContainer, 'focus', this.focus.bind(this));
		_on(this.inputEl, 'blur', this.blur.bind(this));
		_on(this.inputEl, 'focus', this.focus.bind(this));
		_on(this.inputEl, 'input', this.onInput.bind(this));
		_on(this.inputEl, 'keydown', this.onKeyDown.bind(this));
		_tapOn(this.inputContainer, this.onClick.bind(this));
		_tapOn(document.documentElement, this.onClick.bind(this));
		_on(document.documentElement,'mouseover',this.onHover.bind(this));

		this.renderOptions();
		this.togglePlaceholder();
		this.resetHeight();
		this.el.combobox = this;
	};
	Base.prototype.onClick = function(ev) {
		if(!document.activeElement.isSameNode(this.inputEl)) this.focus();
		this.activationEvent = ev;
		var el = ev.srcElement;
		if(!_hasParent(el,this.container)) this.blur();
		else if(_hasParent(el,this.dropdown)) this.onDropdownOptionClick(ev);
		else if(_hasClass(el,'combobox-value')) _toggleClass(el, 'combobox-value-focused');
	};
	Base.prototype.onHover = function(ev) {
		this.activationEvent = ev;
		var el = ev.srcElement;
		if(!_hasParent(el,this.container)) return;
		if(_hasClass(el,'combobox-add') || _hasClass(el,'combobox-option')) this.toggleOptionFocus(el);
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
		var f = this.dropdown.querySelector('.combobox-option-focused');
		if (f && this.addValue(_attr(f,'data-value'))) this.resetInput();
		else if ((this.values.indexOf(value) >= 0) || this.addValue(value)) this.resetInput();
	};
	Base.prototype.onKeyBackspace = function (ev) {
		if (this.getInputValue().length !== 0 && (this.inputEl.selectionStart > 0 || this.inputEl.selectionStart != this.inputEl.selectionEnd)) return;

		if(this.hasFocused()) {
			this.removeFocused();
			this.updateInputSize();
			return;
		}
		if(!this.inputEl.previousSibling) return;
		this.removeValue(_attr(this.inputEl.previousSibling,'data-value'));
		this.focusInput();
		this.updateInputSize();
		this.updateDropdown(true);
	};
	Base.prototype.onKeyLeftArrow = function (ev) {
		if (this.getInputValue().length !== 0) return;
		if(ev.shiftKey) {
			if(this.inputEl.previousSibling) _toggleClass(this.inputEl.previousSibling, 'combobox-value-focused');
		}
		else this.removeFocus();
		if (this.inputEl.previousSibling) this.inputContainer.insertBefore(this.inputEl, this.inputEl.previousSibling);
		this.focusInput();
	};
	Base.prototype.onKeyRightArrow = function (ev) {
		if (this.getInputValue().length !== 0) return;
		if(ev.shiftKey) {
			if(this.inputEl.nextSibling) _toggleClass(this.inputEl.nextSibling, 'combobox-value-focused');
		}
		else this.removeFocus();
		if (this.inputEl.nextSibling) this.inputContainer.insertBefore(this.inputEl, this.inputEl.nextSibling.nextSibling);
		else this.inputContainer.appendChild(this.inputEl);
		this.focusInput();
	};
	Base.prototype.onKeyUpArrow = function (ev) {
		this.toggleOptionFocus('prev');
		ev.preventDefault();
	};
	Base.prototype.onKeyDownArrow = function (ev) {
		this.toggleOptionFocus('next');
		ev.preventDefault();
	};
	Base.prototype.onDropdownOptionClick = function(ev){
		var el = ev.srcElement;
		if(!(_hasClass(el,'combobox-option') || _hasClass(el,'combobox-add'))) return;
		if(this.addValue(_attr(el,'data-value'))) this.resetInput();
		this.focusInput();
	};
	Base.prototype.toggleCompletion = function () {
		var f = this.dropdown.querySelector('.combobox-option-focused');
		var s = _attr(f,'data-value');
		var v = this.getInputValue();
		if(!f || v.length === 0 || !s || s.toLowerCase().indexOf(v.toLowerCase()) !== 0) {
			this.completionEl.textContent = '';
			if(this.completionEl.parentNode) this.completionEl.parentNode.removeChild(this.completionEl);
		} else {
			this.completionEl.textContent = s.substring(v.length);
			if(this.inputEl.nextSibling) this.inputContainer.insertBefore(this.completionEl, this.inputEl.nextSibling);
			else this.inputContainer.appendChild(this.completionEl);
		}
	};
	Base.prototype.togglePlaceholder = function () {
		if (!_attr(this.inputContainer,'data-completion') && this.inputContainer.childNodes.length === 1 && this.getInputValue().length === 0) _addClass(this.inputContainer, 'combobox-placeholder');
		else _removeClass(this.inputContainer, 'combobox-placeholder');
	};
	Base.prototype.toggleOptionFocus = function(){
		var f = this.dropdown.querySelector('.combobox-option-focused');
		if (arguments[0] && arguments[0].nodeName) {
			if(f) _removeClass(f,'combobox-option-focused');
			_addClass(arguments[0],'combobox-option-focused');
			return;
		}
		var els = this.dropdown.querySelectorAll('.combobox-option');

		if(!els || els.length === 0) {
			if(this.opt.create) _addClass(this.addEl,'combobox-option-focused');
			return;
		} else if(this.opt.create) _removeClass(this.addEl,'combobox-option-focused');

		if(!f) {
			_addClass(els[0],'combobox-option-focused');
			return;
		}
		if(!arguments[0]) return;
		var s;
		if(arguments[0] == 'next') s = f.nextSibling;
		else if(arguments[0] == 'prev') s = f.previousSibling;

		if(!s) return;

		_addClass(s,'combobox-option-focused');
		_removeClass(f,'combobox-option-focused');
		this.scrollFocusedOptionIntoView();
		this.toggleCompletion();
	};
	Base.prototype.toggleHighlight = function() {
		var value = _trim(this.getInputValue());
		var list = _toArray(this.dropdown.querySelectorAll('.combobox-option'));
		var re = new RegExp(value, 'i');
	    for (var c = 0; c < list.length; c++) {
			var e = list[c];
			var original = _attr(e,'data-value');
	        if(!value || value.length === 0) {
				e.innerHTML = original;
				continue;
			}
			var res = re.exec(original);
			e.innerHTML = original.replace(re,'<span class="combobox-highlight">'+res[0]+'</span>');
	    }
	};
	Base.prototype.toggleAdd = function(){
		var value = _trim(this.getInputValue());
		if((value.length === 0)) {
			this.addEl.textContent = '';
			_attr(this.addEl,'data-value','');
		} else {
			this.addEl.textContent = 'Add ' + value;
			_attr(this.addEl,'data-value',value);
		}
	};
	Base.prototype.scrollFocusedOptionIntoView = function(){
		var el = this.dropdown.querySelector('.combobox-option-focused');
		if(!el) return;
		var dropdownRect = this.dropdown.getBoundingClientRect();
		var optionRect = el.getBoundingClientRect();
		var t = optionRect.top - dropdownRect.top;
		if(t < 0) el.scrollIntoView(true);
		else if(t + optionRect.height > dropdownRect.height) el.scrollIntoView(false);
	};
	Base.prototype.renderOptions = function (clear){
		if(clear) this.dropdownElements = [];
		for(var i in this.options){
			var v = this.options[i], el;
			if(this.dropdownElements[v]) continue;
			if(this.onRenderOption) {
				el = this.onRenderOption(v);
				if(_isString(el)) el = _toElement(el);
			} else {
				el = _createElement('div.combobox-option');
				el.textContent = v;
			}
			_attr(el, 'data-value', v);
			this.dropdownElements[v] = el;
		}
	};
	Base.prototype.populateDropdown = function (){
		var value = this.getInputValue(),
			arr = this.getSuggestions(value);
		_removeChildren(this.dropdown);
		if(this.opt.create) this.dropdown.appendChild(this.addEl);
		for(var i in arr){
			if(i > this.opt.maxSuggestions) break;
			var el = this.dropdownElements[arr[i]];
			if(el) this.dropdown.appendChild(el);
		}
	};
	Base.prototype.getSuggestions = function(value) {
		var re = new RegExp(value, 'i');
		var vals = this.values;
		var filtered = this.options.filter(function(i){
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
			this.showDropdown();
		}
		this.lastValue = value;
		this.toggleOptionFocus();
		this.toggleCompletion();
		this.togglePlaceholder();
		this.toggleAdd();
	};
	Base.prototype.showDropdown = function() {
		if(this.dropdown.childNodes.length > 0) _addClass(this.container,'combobox-dropdown-visible');
		else _removeClass(this.container,'combobox-dropdown-visible');
	};
	Base.prototype.hideDropdown = function() {
		_removeClass(this.container,'combobox-dropdown-visible');
		this.toggleOptionFocus();
	};
	Base.prototype.addValue = function (value) {
		if (value.length === 0) return false;

		var hasOption = (this.options.indexOf(value) >= 0);
		var hasValue = (this.values.indexOf(value) >= 0);

		if (hasValue || (!hasOption && !this.opt.create) || (this.onWillAdd && this.onWillAdd(value) === false)) return false;

		this.values.push(value);
		var el;
		if(this.onRenderValue) {
			el = this.onRenderValue(value);
			if(_isString(el)) el = _toElement(el);
		} else {
			el = _createElement('div.combobox-value');
			el.textContent = value;
		}
		_attr(el, 'data-value', value);

		this.inputContainer.insertBefore(el, this.inputEl);
		if (this.onDidAdd) this.onDidAdd(value);
		var o = this.dropdownElements[value];
		if(o){
			if(o.nextSibling) this.toggleOptionFocus(o.nextSibling);
			else if(o.previousSilbing) this.toggleOptionFocus(o.previousSilbing);
		}
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
	Base.prototype.updateInputSize = function () {
		this.tempEl.innerHTML = this.getInputValue();
		this.inputEl.style.width = this.tempEl.offsetWidth + 4 + 'px';
	};
	Base.prototype.focusInput = function () {
		this.inputEl.focus();
	};
	Base.prototype.focus = function(ev){
		this.focusInput();
		this.updateDropdown(this.opt.openOnFocus);
	};
	Base.prototype.blur = function(ev){
		if(ev !== true && _hasParent(this.activationEvent.srcElement,this.container)) {
			if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
			if(ev.preventDefault) ev.preventDefault();
			return;
		}
		this.inputEl.blur();
		this.hideDropdown();
	};
	Base.prototype.getItems = function(){
		return this.options;
	};
	Base.prototype.getValues = function(){
		if(this.opt.maxSelected === 1) return this.values[0];
		return this.values;
	};
	Base.prototype.getInputValue = function() {
		return this.inputEl.value;
	};
	Base.prototype.hasFocused = function(){
		return (this.inputContainer.querySelectorAll('.combobox-value-focused').length > 0);
	};
	Base.prototype.removeFocus = function (){
		_removeClass(this.inputContainer.querySelectorAll('.combobox-value-focused'),'combobox-value-focused');
	};
	Base.prototype.removeFocused = function (){
		_each(this.inputContainer.querySelectorAll('.combobox-value-focused'), function(i){
			this.removeValue(_attr(i,'data-value'));
		}.bind(this));
		this.updateDropdown();
	};
	Base.prototype.removeValue = function(value){
		if (value.length === 0 || (this.onWillRemove && !this.onWillRemove(value))) return false;
		var i = this.values.indexOf(value);
		if(i != -1) this.values.splice(i,1);
		var el = this.inputContainer.querySelector('[data-value="'+value+'"]');
		if(el) this.inputContainer.removeChild(el);
		if(this.onDidRemove) this.onDidRemove(value);
		this.updateElementValue();
		return true;
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

	var instances = [];
	this.ComboBox = function (el, options) {
		var e;
		if(_isString(el)) e = document.querySelector(el);
		else e = el;
		for(var i in instances){
			if(instances[i].el.isSameNode(e)) return instances[i];
		}
		var instance = new Base(e, options);
		instances.push(instance);
		return instance;
	};

	this.ComboBox.globals = defaults;

}).call(this);
