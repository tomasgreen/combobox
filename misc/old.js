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