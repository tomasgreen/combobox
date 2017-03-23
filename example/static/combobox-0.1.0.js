(function() {
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

    function _removeNode(els) {
        if (!els) return;
        _each(els, function(el) {
            if (!el || !el.parentNode) return;
            el.parentNode.removeChild(el);
        });
    }

    function _each(o, func) {
        if (!o || (o.length === 0 && o != window)) return;
        if (!o.length) func(o);
        else Array.prototype.forEach.call(o, function(el, i) {
            func(el);
        });
    }

    function _hasParent(el, p) {
        if (!el) return false;
        if (el.parentNode == p) return true;
        return _hasParent(el.parentNode, p);
    }

    function _toElement(html) {
        var a = document.createElement('div');
        a.innerHTML = html;
        return a.firstChild;
    }

    function _isString(obj) {
        return (typeof obj === 'string');
    }

    function _on(els, events, func, useCapture) {
        _each(els, function(el) {
            var ev = events.split(' ');
            for (var e in ev) el.addEventListener(ev[e], func, useCapture);
        });
    }

    function _off(els, events, func, useCapture) {
        _each(els, function(el) {
            var ev = events.split(' ');
            for (var e in ev) el.removeEventListener(ev[e], func, useCapture);
        });
    }

    function _addClass(els, cls) {
        _each(els, function(el) {
            if (el.classList) {
                var arr = cls.split(' ');
                for (var i in arr) el.classList.add(arr[i]);
            } else el.className += ' ' + cls;
        });
    }

    function _removeClass(els, cls) {
        _each(els, function(el) {
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
        if (!el) return;
        if (el.classList) return el.classList.contains(cls);
        else return new RegExp('(^| )' + cls + '( |$)', 'gi').test(el.className);
    }

    function _toggleClass(els, cls) {
        _each(els, function(el) {
            if (_hasClass(el, cls)) _removeClass(el, cls);
            else _addClass(el, cls);
        });
    }

    function _attr(els, attrib, value) {
        if (value === undefined && els && els.getAttribute !== undefined) return els.getAttribute(attrib);
        _each(els, function(el) {
            el.setAttribute(attrib, value);
        });
    }

    function _removeAttr(els, attrib) {
        _each(els, function(el) {
            el.removeAttribute(attrib);
        });
    }

    function _trim(str) {
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
        context: null,
        items: null,
        delimiter: ',',
        create: true,
        createOnBlur: true,
        openOnFocus: true,
        closeAfterSelect: true,
        selectOnTab: true,
        maxSelected: 0,
        maxSuggestions: Infinity
    };
    var ComboBox = function(el, options) {
        if (_isString(el)) this.el = document.querySelector(el);
        else this.el = el
        this.opt = _setOptions(options);
        if (!this.el) return;

        this.el.style.display = 'none';
        if (!this.opt.context) this.opt.context = document.documentElement || document.body
        this.isSelectBox = (this.el.nodeName.toLowerCase() == 'select');

        this.container = _createElement('div.combobox');
        this.el.parentNode.insertBefore(this.container, this.el);
        this.container.appendChild(this.el);

        this.inputContainer = _createElement('div.combobox-input-container', null, this.container);
        this.dropdown = _createElement('div.combobox-dropdown', null, this.container);

        this.items = this.opt.items || [];
        this.options = this.opt.options || [];
        this.dropdownElements = [];

        if (this.isSelectBox) _each(this.el.querySelectorAll('option'), function(o) {
            var obj = {
                value: o.textContent,
                label: o.textContent
            }
            this.options.push(obj);
            if (_attr(o, 'selected') !== null && _attr(o, 'selected') !== undefined) {
                this.items.push(obj);
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
        _on(this.opt.context, 'click', this.onClick.bind(this), false);
        _on(this.opt.context, 'mouseover', this.onHover.bind(this));

        this.renderItems();
        this.renderOptions();
        this.togglePlaceholder();
        this.resetHeight();
        this.el.combobox = this;
    };
    ComboBox.prototype.onClick = function(ev) {

        this.activationEvent = ev;
        var el = ev.srcElement;
        if (!_hasParent(el, this.container)) {
            this.blur();
            return;
        } else if (_hasParent(el, this.dropdown)) this.onDropdownOptionClick(ev);
        else if (_hasClass(el, 'combobox-item')) _toggleClass(el, 'combobox-item-focused');
        if (!document.activeElement.isSameNode(this.inputEl)) this.focus();
    };
    ComboBox.prototype.onHover = function(ev) {
        this.activationEvent = ev;
        var el = ev.srcElement;
        if (!_hasParent(el, this.container)) return;
        if (_hasClass(el, 'combobox-add') || _hasClass(el, 'combobox-option')) this.toggleOptionFocus(el);
    };
    ComboBox.prototype.onInput = function(ev) {
        this.updateInputSize();
        this.updateDropdown();
        if (this.onInputDidChange) this.onInputDidChange(this.getInputValue())
    };
    ComboBox.prototype.onKeyDown = function(ev) {
        switch (ev.keyCode) {
            case _keyCodes.rightArrow:
                this.onKeyRightArrow(ev);
                break;
            case _keyCodes.leftArrow:
                this.onKeyLeftArrow(ev);
                break;
            case _keyCodes.downArrow:
                this.onKeyDownArrow(ev);
                break;
            case _keyCodes.upArrow:
                this.onKeyUpArrow(ev);
                break;
            case _keyCodes.backspace:
                this.onKeyBackspace(ev);
                break;
            case _keyCodes.esc:
                this.onKeyEsc(ev);
                break;
            case _keyCodes.enter:
                this.onKeyEnter(ev);
                break;
            default:
                break;
        }
    };
    ComboBox.prototype.onKeyEsc = function(ev) {
        this.hideDropdown();
    };
    ComboBox.prototype.onKeyEnter = function(ev) {
        var value = this.inputEl.value = _trim(this.getInputValue());
        var f = this.dropdown.querySelector('.combobox-option-focused');
        if (f && this.addValue(_attr(f, 'data-value'))) this.resetInput();
        else if ((this.findItemByValue(value) >= 0) || this.addValue(value)) this.resetInput();
    };
    ComboBox.prototype.findItemByValue = function(value) {
        return this.items.find(function(item) {
            return (item.value == value)
        })
    }
    ComboBox.prototype.findItemByLabel = function(label) {
        return this.items.find(function(item) {
            return (item.label == label)
        })
    }
    ComboBox.prototype.findOptionByLabel = function(label) {
        return this.options.find(function(option) {
            return (option.label == label)
        })
    }
    ComboBox.prototype.findOptionByValue = function(value) {
        return this.options.find(function(option) {
            return (option.value == value)
        })
    }
    ComboBox.prototype.onKeyBackspace = function(ev) {
        if (this.getInputValue().length !== 0 && (this.inputEl.selectionStart > 0 || this.inputEl.selectionStart != this.inputEl.selectionEnd)) return;

        if (this.hasFocused()) {
            this.removeFocused();
            this.updateInputSize();
            return;
        }
        if (!this.inputEl.previousSibling) return;
        this.removeValue(_attr(this.inputEl.previousSibling, 'data-value'));
        this.focusInput();
        this.updateInputSize();
        this.updateDropdown(true);
    };
    ComboBox.prototype.onKeyLeftArrow = function(ev) {
        if (this.getInputValue().length !== 0) return;
        if (ev.shiftKey) {
            if (this.inputEl.previousSibling) _toggleClass(this.inputEl.previousSibling, 'combobox-item-focused');
        } else this.removeFocus();
        if (this.inputEl.previousSibling) this.inputContainer.insertBefore(this.inputEl, this.inputEl.previousSibling);
        this.focusInput();
    };
    ComboBox.prototype.onKeyRightArrow = function(ev) {
        if (this.getInputValue().length !== 0) return;
        if (ev.shiftKey) {
            if (this.inputEl.nextSibling) _toggleClass(this.inputEl.nextSibling, 'combobox-item-focused');
        } else this.removeFocus();
        if (this.inputEl.nextSibling) this.inputContainer.insertBefore(this.inputEl, this.inputEl.nextSibling.nextSibling);
        else this.inputContainer.appendChild(this.inputEl);
        this.focusInput();
    };
    ComboBox.prototype.onKeyUpArrow = function(ev) {
        this.toggleOptionFocus('prev');
        ev.preventDefault();
    };
    ComboBox.prototype.onKeyDownArrow = function(ev) {
        this.toggleOptionFocus('next');
        ev.preventDefault();
    };
    ComboBox.prototype.onDropdownOptionClick = function(ev) {
        var el = ev.srcElement;
        if (!(_hasClass(el, 'combobox-option') || _hasClass(el, 'combobox-add'))) return;
        if (this.addValue(_attr(el, 'data-value'))) this.resetInput();
        this.focusInput();
    };
    ComboBox.prototype.toggleCompletion = function() {
        var f = this.dropdown.querySelector('.combobox-option-focused');
        var s = _attr(f, 'data-value');
        var v = this.getInputValue();
        if (!f || v.length === 0 || !s || s.toLowerCase().indexOf(v.toLowerCase()) !== 0) {
            this.completionEl.textContent = '';
            if (this.completionEl.parentNode) this.completionEl.parentNode.removeChild(this.completionEl);
        } else {
            this.completionEl.textContent = s.substring(v.length);
            if (this.inputEl.nextSibling) this.inputContainer.insertBefore(this.completionEl, this.inputEl.nextSibling);
            else this.inputContainer.appendChild(this.completionEl);
        }
    };
    ComboBox.prototype.togglePlaceholder = function() {
        if (!_attr(this.inputContainer, 'data-completion') && this.inputContainer.childNodes.length === 1 && this.getInputValue().length === 0) _addClass(this.inputContainer, 'combobox-placeholder');
        else _removeClass(this.inputContainer, 'combobox-placeholder');
    };
    ComboBox.prototype.toggleOptionFocus = function() {
        var f = this.dropdown.querySelector('.combobox-option-focused');
        if (arguments[0] && arguments[0].nodeName) {
            if (f) _removeClass(f, 'combobox-option-focused');
            _addClass(arguments[0], 'combobox-option-focused');
            return;
        }
        var els = this.dropdown.querySelectorAll('.combobox-option');

        if (!els || els.length === 0) {
            if (this.opt.create) _addClass(this.addEl, 'combobox-option-focused');
            return;
        } else if (this.opt.create) _removeClass(this.addEl, 'combobox-option-focused');

        if (!f) {
            _addClass(els[0], 'combobox-option-focused');
            return;
        }
        if (!arguments[0]) return;
        var s;
        if (arguments[0] == 'next') s = f.nextSibling;
        else if (arguments[0] == 'prev') s = f.previousSibling;

        if (!s) return;

        _addClass(s, 'combobox-option-focused');
        _removeClass(f, 'combobox-option-focused');
        this.scrollFocusedOptionIntoView();
        this.toggleCompletion();
    };
    ComboBox.prototype.toggleAdd = function() {
        var value = _trim(this.getInputValue());
        if ((value.length === 0)) {
            this.addEl.textContent = '';
            _attr(this.addEl, 'data-value', '');
        } else {
            this.addEl.textContent = 'Add ' + value;
            _attr(this.addEl, 'data-value', value);
        }
    };
    ComboBox.prototype.scrollFocusedOptionIntoView = function() {
        var el = this.dropdown.querySelector('.combobox-option-focused');
        if (!el) return;
        var dropdownRect = this.dropdown.getBoundingClientRect();
        var optionRect = el.getBoundingClientRect();
        var t = optionRect.top - dropdownRect.top;
        if (t < 0) el.scrollIntoView(true);
        else if (t + optionRect.height > dropdownRect.height) el.scrollIntoView(false);
    };
    ComboBox.prototype.renderItems = function(clear) {
        if (clear) {
            _removeNode(this.inputContainer.querySelectorAll('[data-value]'))
        }
        for (var i in this.items) {
            var item = this.items[i];
            var el;
            if (this.onRenderItem) {
                el = this.onRenderItem(item);
                if (_isString(el)) el = _toElement(el);
            } else {
                el = _createElement('div.combobox-item');
                el.textContent = item.label;
            }
            _attr(el, 'data-value', item.value);
            _attr(el, 'data-label', item.label);
            this.inputContainer.insertBefore(el, this.inputEl);
        }
    }
    ComboBox.prototype.renderOptions = function(clear) {
        if (clear) this.dropdownElements = [];
        for (var i in this.options) {
            var v = this.options[i],
                el;
            if (this.dropdownElements[v.value]) continue;
            if (this.onRenderOption) {
                el = this.onRenderOption(v);
                if (_isString(el)) el = _toElement(el);
            } else {
                el = _createElement('div.combobox-option');
                el.textContent = v.label;
            }
            _attr(el, 'data-value', v.value);
            _attr(el, 'data-label', v.label);
            this.dropdownElements[v.value] = el;
        }
    };
    ComboBox.prototype.populateDropdown = function() {
        var value = this.getInputValue(),
            arr = this.getSuggestions(value);
        _removeChildren(this.dropdown);
        if (this.opt.create) this.dropdown.appendChild(this.addEl);
        if (arr.length < 1) _addClass(this.dropdown, 'combobox-dropdown-empty');
        else _removeClass(this.dropdown, 'combobox-dropdown-empty');
        for (var i in arr) {
            if (i > this.opt.maxSuggestions) break;
            var el = this.dropdownElements[arr[i].value];
            if (el) this.dropdown.appendChild(el);
        }
    };
    ComboBox.prototype.getSuggestions = function(value) {
        var _this = this
        var re = new RegExp(value, 'i');
        var filtered = this.options.filter(function(i) {
            if (_this.findItemByValue(i.value)) return false;
            return re.test(i.label);
        });
        filtered.sort(function(a, b) {
            if (b.label.toLowerCase().indexOf(value) < a.label.toLowerCase().indexOf(value)) return 1;
            else if (b.label.toLowerCase().indexOf(value) > a.label.toLowerCase().indexOf(value)) return -1;
            return a.label.toLowerCase().localeCompare(b.label.toLowerCase());
        });
        return filtered;
    };
    ComboBox.prototype.toggleHighlight = function() {
        var value = _trim(this.getInputValue());
        var list = _toArray(this.dropdown.querySelectorAll('.combobox-option'));
        var re = new RegExp(value, 'i');
        for (var c = 0; c < list.length; c++) {
            var e = list[c];
            var original = _attr(e, 'data-label');
            if (!value || value.length === 0) {
                e.innerHTML = original;
                continue;
            }
            var res = re.exec(original);
            e.innerHTML = original.replace(re, '<span class="combobox-highlight">' + res[0] + '</span>');
        }
    };
    ComboBox.prototype.updateDropdown = function(force) {
        var value = this.getInputValue();
        if (force || this.lastValue != value) {
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
    ComboBox.prototype.showDropdown = function() {
        if (this.dropdown.childNodes.length > 0) _addClass(this.container, 'combobox-dropdown-visible');
        else _removeClass(this.container, 'combobox-dropdown-visible');
    };
    ComboBox.prototype.hideDropdown = function() {
        _removeClass(this.container, 'combobox-dropdown-visible');
        this.toggleOptionFocus();
    };
    ComboBox.prototype.addValue = function(value) {
        if (value.length === 0) return false;

        var option = this.findOptionByValue(value);
        var item = this.findItemByValue(value);
        if (item || (!option && !this.opt.create) || (this.onWillAdd && this.onWillAdd(value) === false)) return false;
        var val = {
            value: (option) ? option.value : value,
            label: (option) ? option.label : value,
        }
        this.items.push(val);
        var el;
        if (this.onRenderItem) {
            el = this.onRenderItem(val);
            if (_isString(el)) el = _toElement(el);
        } else {
            el = _createElement('div.combobox-item');
            el.textContent = val.label;
        }
        _attr(el, 'data-value', val.value);
        _attr(el, 'data-label', val.label);

        this.inputContainer.insertBefore(el, this.inputEl);
        if (this.onDidAdd) this.onDidAdd(value);
        var o = this.dropdownElements[value];
        if (o) {
            if (o.nextSibling) this.toggleOptionFocus(o.nextSibling);
            else if (o.previousSilbing) this.toggleOptionFocus(o.previousSilbing);
        }
        this.updateDropdown(true);
        this.resetHeight();
        return true;
    };
    ComboBox.prototype.updateElementValue = function() {
        return
        var tn = this.el.nodeName.toLowerCase();
        if (tn == 'select') {
            this.el.innerHTML = '';
            for (var i in this.items) {
                _createElement('option', {
                    selected: ''
                }, this.el, this.items[i]);
            }
        } else if (tn == 'input') this.el.value = this.items.join(this.opt.delimiter);
        else if (tn == 'textarea') this.el.innerHTML = this.items.join(this.opt.delimiter);
    };
    ComboBox.prototype.updateInputSize = function() {
        this.tempEl.innerHTML = this.getInputValue();
        this.inputEl.style.width = this.tempEl.offsetWidth + 4 + 'px';
    };
    ComboBox.prototype.focusInput = function() {
        this.inputEl.focus();
    };
    ComboBox.prototype.focus = function(ev) {
        this.focusInput();
        this.updateDropdown(this.opt.openOnFocus);
    };
    ComboBox.prototype.blur = function(ev) {
        if (ev !== true && _hasParent(this.activationEvent.srcElement, this.container)) {
            if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
            if (ev.preventDefault) ev.preventDefault();
            return;
        }
        this.inputEl.blur();
        this.hideDropdown();
    };
    ComboBox.prototype.getItems = function() {
        if (this.opt.maxSelected === 1) return this.items[0];
        return this.items;
    };
    ComboBox.prototype.getInputValue = function() {
        return this.inputEl.value;
    };
    ComboBox.prototype.hasFocused = function() {
        return (this.inputContainer.querySelectorAll('.combobox-item-focused').length > 0);
    };
    ComboBox.prototype.removeFocus = function() {
        _removeClass(this.inputContainer.querySelectorAll('.combobox-item-focused'), 'combobox-item-focused');
    };
    ComboBox.prototype.removeFocused = function() {
        _each(this.inputContainer.querySelectorAll('.combobox-item-focused'), function(i) {
            this.removeValue(_attr(i, 'data-value'));
        }.bind(this));
        this.updateDropdown();
    };
    ComboBox.prototype.removeValue = function(value) {
        if (value.length === 0 || (this.onWillRemove && !this.onWillRemove(value))) return false;
        var item = null;
        var i = this.items.findIndex(function(i) {
            if (i.value == value) {
                item = i
                return true
            }
            return false;
        });
        if (i != -1) this.items.splice(i, 1);
        var el = this.inputContainer.querySelector('[data-value="' + item.value + '"]');
        if (el) this.inputContainer.removeChild(el);
        if (this.onDidRemove) this.onDidRemove(item);
        this.updateElementValue();
        return true;
    };
    ComboBox.prototype.resetHeight = function() {
        var r = this.inputContainer.getBoundingClientRect();
        if (r.height > 0) this.container.style.maxHeight = r.height + 'px';
    };
    ComboBox.prototype.resetInput = function() {
        this.inputEl.value = '';
        this.updateInputSize();
        this.updateDropdown(true);
    };
    this.ComboBox = ComboBox;
}).call(this);