Module.register("MMM-Homematic",{
	// default module config
	defaults: {
		initialLoadDelay: 0,
		updateInterval: 30,
		animationSpeed: 1000,
		tempUnit: "°C",
		humUnit: "%",
		shutterUnit: "%",
		ampUnit: " mA",
		voltUnit: " V",
		pwrUnit: " W",
		energyUnit: " Wh",
		energyUnitK: " kWh", 
		freqUnit: " Hz",
		numberUnit: " ",
		
		locale: config.language,
		ccuProtocol: 'http://',
		ccuHost: 'ccu3-webui',
		ccuXmlApiUrl: '/addons/xmlapi',
		ccuStateServiceUrl: '/state.cgi',
		ccuSysvarServiceUrl: '/sysvar.cgi',
		ccuDatapointIdParameter: '?datapoint_id=',
		ccuIseIdParameter: '?ise_id=',
		
		style: 'lines',	
		useShortText: 'false',
		showText: 'true',
		showValue: 'true',
	},

	// start scheduler
	start: function() {
		Log.info("Starting module: " + this.name);

		this.scheduleUpdate(this.config.initialLoadDelay);
	},

	// get additional scripts
	getScripts: function() {
		return [
			'https://code.jquery.com/jquery-1.12.4.min.js',  // this file will be loaded from the jquery servers.
		]
	},

	// get additional styles
	getStyles: function() {
		return [
			'MMM-Homematic.css',
		]
	},


	// return tranlation files
	getTranslations: function() {
		return {
				en: "translations/en.json",
				de: "translations/de.json"
		}
	},

	// Override dom generator.
	getDom: function() {
		let _self = this;
		let wrapper = $("<div/>",{class: 'small'});
		
		// rows for style table_columns
		let rowArray = [$("<div/>"),$("<div/>"),$("<div/>")];
		if(_self.config.style.startsWith("table")) {
			rowArray[0].css("display","table-row");
			rowArray[1].css("display","table-row");
			rowArray[2].css("display","table-row");
		}
		
		if(typeof(_self.homematicData) !== 'undefined') {
			if(typeof(this.config.datapoints) === 'object') {
				
				// loop over elementFromPoint
				$.each(this.config.datapoints,function(){
					if(typeof(this.name) === 'string' && typeof(this.id) === 'string' && typeof(this.type) === 'string') {
						// row or line for style lines and table_rows
						let row = $("<div/>");
						if(_self.config.style.startsWith("table")) {
							row.css("display","table-row");
						}
						// row counter for style table_columns
						let rowCounter = 0;

						// raw value of datapoint
						let value = _self.homematicData[_self.removeSpecialChars(this.name)];
						// text value of datapoint
						let value_text = "";
						// whether short or long text values are used
						let use_short_text = _self.config.useShortText === "true";
						
						// css class for text
						let text_class = "";
						// css class for text with icon
						let text_with_icon_class = "";
						// css class for icon
						let icon_class = "";
						// default warn color for text and icon
						let warn_color = "red";
						// default warn class for text
						let warn_class = "bright red";
						// default color for icon
						let icon_color = "white";
						
						// default icon size
						let icon_size = 'medium';
						// default icon position
						let icon_position = 'left';
						let symbol; 
						
						// icon dom element
						let icon_element;
						// text dom element
						let text_element;
						// value dom element
						let value_element;

						// Introduction numberUnit
						// @spitzlbergerj, 20190624
						let numberUnit = '';

						
						if((this.type.indexOf("warn") !== -1) && ((typeof(this.warnOnly) === 'string') && (this.warnOnly === 'true'))) {
							text_class = "hide";
						}

						// Setting warning color
						// @spitzlbergerj, 20190127
						if(typeof(this.warnColor) === 'string') {
							warn_color = this.warnColor;
							warn_class = "bright " + warn_color;
						}

						if(typeof(this.iconColor) === 'string') {
							icon_color = this.iconColor;
						}

						// Introduction numberUnit
						// @spitzlbergerj, 20190624
						if(typeof(this.numberUnit) === 'string') {
							numberUnit = this.numberUnit;
						}


						// Devices
						
						if(this.type.startsWith('window')) {
							// window/door
							// @spitzlberger: for HM-Sec-SCo added testing of Boolean value  
							if((value === "0") || (value === "false")) {
								value_text = _self.translateLoS("IS_CLOSED");
								if(this.type === 'window_warn_closed') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							} else {
								value_text = _self.translateLoS("IS_OPEN");
								if(this.type === 'window_warn_open') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							}
						} else if(this.type.startsWith('temp')) {
							// temperature
							let valueStr = Number(value).toLocaleString(_self.config.locale, {minimumFractionDigits: 1, maximumFractionDigits: 1});;
							
							if(this.type.startsWith('temp_') && typeof(this.threshold) === 'number') {
								if(this.type === 'temp_warn_high' && value >= this.threshold) {
									value_text = _self.translateLoS("IS_TOO_HIGH") + (use_short_text ? "" : " (" + valueStr + _self.config.tempUnit + ")");
									text_class = warn_class;
									icon_color = warn_color;
								} else if(this.type === 'temp_warn_low' && value <= this.threshold) {
									value_text = _self.translateLoS("IS_TOO_LOW") + (use_short_text ? "" : " (" + valueStr + _self.config.tempUnit + ")");
									text_class = warn_class;
									icon_color = warn_color;
								} else {
									value_text = _self.translateLoS("IS_OK") + (use_short_text ? "" : " (" + valueStr + _self.config.tempUnit + ")");
								}
							} else {
								value_text = (use_short_text ? "" : _self.translateLoS("IS") + " ") + valueStr + _self.config.tempUnit;
							}
						} else if(this.type.startsWith('hum')) {
							// humidity
							let valueStr = Number(value).toLocaleString(_self.config.locale, {minimumFractionDigits: 0, maximumFractionDigits: 0});

							if(this.type.startsWith('hum_') && typeof(this.threshold) === 'number') {
								if(this.type === 'hum_warn_high' && value >= this.threshold) {
									value_text = _self.translateLoS("IS_TOO_HIGH") + (use_short_text ? "" : " (" + valueStr + _self.config.humUnit + ")");
									text_class = warn_class;
									icon_color = warn_color;
								} else if(this.type === 'hum_warn_low' && value <= this.threshold) {
									value_text = _self.translateLoS("IS_TOO_LOW") + (use_short_text ? "" : " (" + valueStr + _self.config.humUnit + ")");
									text_class = warn_class;
									icon_color = warn_color;
								} else {
									value_text = _self.translateLoS("IS_OK") + (use_short_text ? "" : " (" + valueStr + _self.config.humUnit + ")");
								}
							} else {
								value_text = (use_short_text ? "" : _self.translateLoS("IS") + " ") + valueStr + _self.config.humUnit;
							}
						} else if(this.type.startsWith('shutter')) {
							// shutter
							value = value*100;
							let valueStr = Number(value).toLocaleString(_self.config.locale, {minimumFractionDigits: 0, maximumFractionDigits: 0});;
							
							if(this.type.startsWith('shutter_') && typeof(this.threshold) === 'number') {
								if(this.type === 'shutter_warn_high' && value >= this.threshold) {
									value_text = _self.translateLoS("IS_TOO_HIGH") + (use_short_text ? "" : " (" + valueStr + _self.config.shutterUnit + ")");
									text_class = warn_class;
									icon_color = warn_color;
								} else if(this.type === 'shutter_warn_low' && value <= this.threshold) {
									value_text = _self.translateLoS("IS_TOO_LOW") + (use_short_text ? "" : " (" + valueStr + _self.config.shutterUnit + ")");
									text_class = warn_class;
									icon_color = warn_color;
								} else {
									value_text = _self.translateLoS("IS_OK") + (use_short_text ? "" : " (" + valueStr + _self.config.shutterUnit + ")");
								}
							} else {
								value_text = (use_short_text ? "" : _self.translateLoS("IS") + " ") + valueStr + _self.config.shutterUnit;
							} 
						
						// Switch and energie
						// @spitzlbergerj, 20190206

						} else if(this.type.startsWith('switch')) {
							// switch
							if(value === "false") {
								value_text = _self.translateLoS("IS_OFF");
								if(this.type === 'switch_warn_off') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							} else {
								value_text = _self.translateLoS("IS_ON");
								if(this.type === 'switch_warn_on') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							}
						} else if(this.type.startsWith('energie')) {
							// energie
							let valueStr = Number(value).toLocaleString(_self.config.locale, {minimumFractionDigits: this.precision, maximumFractionDigits: this.precision});;
							let valueUnit = '';
							
							if (this.type.startsWith('energie_a')) {
								valueUnit = _self.config.ampUnit;
							} else if (this.type.startsWith('energie_v')) {
								valueUnit = _self.config.voltUnit;
							} else if (this.type.startsWith('energie_p')) {
								valueUnit = _self.config.pwrUnit;
							} else if (this.type.startsWith('energie_e')) {
								valueUnit = _self.config.energyUnit;
							} else if (this.type.startsWith('energie_ek')) {
								valueUnit = _self.config.energyUnitK;
							} else if (this.type.startsWith('energie_f')) {
								valueUnit = _self.config.freqUnit;
							}
							
							if( ( this.type.endsWith('_high') || this.type.endsWith('_low') ) && typeof(this.threshold) === 'number') {
								if(this.type.endsWith('_high') && value >= this.threshold) {
									value_text = _self.translateLoS("IS_TOO_HIGH") + (use_short_text ? "" : " (" + valueStr + valueUnit + ")");
									text_class = warn_class;
									icon_color = warn_color;
								} else if(this.type.endsWith('_low') && value <= this.threshold) {
									value_text = _self.translateLoS("IS_TOO_LOW") + (use_short_text ? "" : " (" + valueStr + valueUnit + ")");
									text_class = warn_class;
									icon_color = warn_color;
								} else {
									value_text = valueStr + valueUnit;
								}
							} else {
								value_text = valueStr + valueUnit;
							}
							
						} else if(this.type.startsWith('other')) {
							// other value/sensor
							let valueStr = value;
							if(typeof(this.precision) === 'number') {
								valueStr = Number(value).toLocaleString(_self.config.locale, {minimumFractionDigits: this.precision, maximumFractionDigits: this.precision});;
							}
							
							if(this.type.startsWith('other_') && typeof(this.threshold) === 'number') {
								if(this.type === 'other_warn_high' && value >= this.threshold) {
									value_text = _self.translateLoS("IS_TOO_HIGH") + (use_short_text ? "" : " (" + valueStr + ")");
									text_class = warn_class;
									icon_color = warn_color;
								} else if(this.type === 'other_warn_low' && value <= this.threshold) {
									value_text = _self.translateLoS("IS_TOO_LOW") + (use_short_text ? "" : " (" + valueStr + ")");
									text_class = warn_class;
									icon_color = warn_color;
								} else {
									value_text = _self.translateLoS("IS_OK") + (use_short_text ? "" : " (" + valueStr + ")");
								}
							} else {
								// Introduction numberUnit
								// @spitzlbergerj, 20190624
								value_text = (use_short_text ? "" : _self.translateLoS("IS") + " ") + valueStr + " " + numberUnit;
							}
						} 
						
						// SysVars
						// @spitzlbergerj, 20190127

						else if(this.type.startsWith('sysvar_boolean')) {
							// SysVar boolean
							if(value === "false") {
								value_text = _self.translateLoS("IS_FALSE");
								if(this.type === 'sysvar_boolean_warn_false') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							} else {
								value_text = _self.translateLoS("IS_TRUE");
								if(this.type === 'sysvar_boolean_warn_true') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							}
						} else if(this.type.startsWith('sysvar_alarm')) {
							// SysVar alarm
							if(value === "false") {
								value_text = _self.translateLoS("IS_NOT_TRIGGERED");
								if(this.type === 'sysvar_alarm_warn_not_triggered') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							} else {
								value_text = _self.translateLoS("IS_TRIGGERED");
								if(this.type === 'sysvar_alarm_warn_triggered') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							}
						} else if(this.type.startsWith('sysvar_mashine')) {
							// SysVar Boolean; Special type machine that can run or not run
							if(value === "false") {
								value_text = _self.translateLoS("IS_NOT_RUNNING");
								if(this.type === 'sysvar_mashine_warn_not_running') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							} else {
								value_text = _self.translateLoS("IS_RUNNING");
								if(this.type === 'sysvar_mashine_warn_running') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							}
						} else if(this.type.startsWith('sysvar_presence')) {
							// SysVar boolean, special type presence that can accept the values here or not here 
							if(value === "false") {
								value_text = _self.translateLoS("IS_AWAY");
								if(this.type === 'sysvar_presence_warn_away') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							} else {
								value_text = _self.translateLoS("IS_HERE");
								if(this.type === 'sysvar_presence_warn_here') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							}
						} else if(this.type.startsWith('sysvar_string')) {
							// SysVar String Value
							value_text = value;
							if(this.type === 'sysvar_string_warn_empty' && (value === '' || value === '???')) {
								text_class = warn_class;
								icon_color = warn_color;
							} else if (this.type === 'sysvar_string_warn_not_empty' && (value !== '' && value !== '???')) {
								text_class = warn_class;
								icon_color = warn_color;
							}
						} else if(this.type.startsWith('sysvar_valuelist')) {
							// SysVar value list
							value_text = _self.translateLoS("IS") + " " + value;
							
							if(this.type.startsWith('sysvar_valuelist_') && typeof(this.reference) !== 'undefined') {
								if(this.type === 'sysvar_valuelist_warn_equals' && (value === this.reference)) {
									text_class = warn_class;
									icon_color = warn_color;
								} else if (this.type === 'sysvar_valuelist_warn_not_equals' && (value !== this.reference)) {
									text_class = warn_class;
									icon_color = warn_color;
								}
							}
						} else if(this.type.startsWith('sysvar_number')) {
							// SysVar number
							let valnum = 0;
							let valdec = 0;
							let valwarn = 0;
							if(typeof(this.precision) === 'number') {
								valdec = this.precision;
							}
							if (typeof(this.threshold) === 'number') {
								valwarn = this.threshold;
							}
							valnum = parseFloat(value).toLocaleString(_self.config.locale, {minimumFractionDigits: valdec, maximumFractionDigits: valdec});

							// Introduction numberUnit
							// @spitzlbergerj, 20190624
							value_text = valnum.toString() + " " + numberUnit;

							if(this.type === 'sysvar_number_warn_low' && valnum <= valwarn) {
								text_class = warn_class;
								icon_color = warn_color;
							}
							if(this.type === 'sysvar_number_warn_high' && valnum >= valwarn) {
								text_class = warn_class;
								icon_color = warn_color;
							}
						}
						
						// ----------------------------------
						// Compose HTML code
						// ----------------------------------
						
						// ----------------------------------
						// icon					
						if((typeof(this.iconPosition) === 'string')) {
							icon_position = this.iconPosition;
						}

						if(typeof(this.icon) === 'string') {
							// show icon
							let icon_url;
							
							if((typeof(this.iconSize) === 'string')) {
								icon_size = this.iconSize;
							}
								
							icon_class = " icon icon-" + icon_size + " icon-" + icon_position + " " + icon_color + '-icon ';
							if(icon_position !== 'center' || _self.config.style.startsWith('table')) {
								text_with_icon_class = " text-with-icon text-with-icon-" + icon_size;
							}

							if(this.icon.startsWith('fa-')){
								symbol = document.createElement("i");
								symbol.className = "fa fa-fw " + this.icon;
								symbol.style = "color: " + icon_color;
							}
							else
							{
								if(this.icon.startsWith('default_')){
									// integrated icon
									icon_url = _self.data.path + "icons/" + this.icon.substr(8) + ".png";
								} else {
									// external icon url
									icon_url = this.icon;
								}
								icon_element = $("<div/>",{id: _self.identifier + "-" + _self.removeSpecialChars(this.name) + "-icon",class: text_class + icon_class,style: "background-image: url(" + icon_url + ");"});							
								if(_self.config.style.startsWith("table")) {
									icon_element = $("<div/>").append(icon_element);
									icon_element.css("display","table-cell");
								}
							}
						} else {
							icon_element = $("<div/>",{id: _self.identifier + "-" + _self.removeSpecialChars(this.name) + "-icon",class: text_class});
							if(_self.config.style.startsWith("table")) {
								icon_element.css("display","table-cell");
							}
						}
						
						// ----------------------------------
						// put html snippets together
						
						
						// icon left/top or center for style lines
						if(icon_position === 'left' || icon_position === 'top') {
							if(_self.config.style === "lines" && typeof(this.icon) === 'string') {
								row.append(icon_element);
							}
							if(_self.config.style === "table_rows") {
								row.append(icon_element);
							}
							if(_self.config.style === "table_columns") {
								rowArray[rowCounter].append(icon_element);
								rowCounter++;
							}
						}
						if(icon_position === 'center') {
							if(_self.config.style === "lines" && typeof(this.icon) === 'string') {
								row.append(icon_element);
								row.append($("<br/>",{class: text_class}));
							}
						}

						// text
						if(_self.config.showText === 'true') {
							let textHtml = $("<div/>",{id: _self.identifier + "-" + _self.removeSpecialChars(this.name) + "-text"});
							if((typeof(this.iconOnly) !== 'string') || (this.iconOnly !== 'true')) {
								textHtml.addClass(text_class + text_with_icon_class + " text-lines");
								textHtml.html(this.name);
								if(_self.config.style.startsWith("table")) {
									textHtml.css("display","table-cell");
								}
							} else {
								if(_self.config.style.startsWith("table")) {
									textHtml.css("display","table-cell");
								}
							}
							if(_self.config.style === "table_columns") {
								rowArray[rowCounter].append(textHtml);
								rowCounter++;
							} else {
								row.append(textHtml);
							}
						}
						
						// icon center for styles table_*
						if(icon_position === 'center'){
							if(_self.config.style === "table_columns") {
								rowArray[rowCounter].append(icon_element);
								rowCounter++;
							} else if(_self.config.style === "table_rows") {
								row.append(icon_element);
							}
						}
						
						// value
						if(_self.config.showValue === 'true') {
							let valueHtml = $("<div/>",{id: _self.identifier + "-" + _self.removeSpecialChars(this.name) + "-value"});
							if((typeof(this.iconOnly) !== 'string') || (this.iconOnly !== 'true')) {
								valueHtml.addClass(text_class + text_with_icon_class + " text-lines");
								valueHtml.html("&nbsp;" + value_text);
								if(_self.config.style.startsWith("table")) {
									valueHtml.css("display","table-cell");
								}
							} else {
								if(_self.config.style.startsWith("table")) {
									valueHtml.css("display","table-cell");
								}
							}
							if(_self.config.style === "table_columns") {
								rowArray[rowCounter].append(valueHtml);
								rowCounter++;
							} else {
								row.append(valueHtml);
							}
						}
						
						// icon right/bottom
						if(icon_position === 'right' || icon_position === 'bottom') {
							if((_self.config.style === "lines" && typeof(this.icon) === 'string') || _self.config.style === "table_rows") {
								row.append(icon_element);
							}
							if(_self.config.style === "table_columns") {
								rowArray[rowCounter].append(icon_element);
								rowCounter++;
							}
						}

						if(_self.config.style !== "table_columns") {
							wrapper.append(row);
						}
						
					} // element is valid
				}); // end of loop
				
				if(_self.config.style === "table_columns") {
					wrapper.append(rowArray[0]);
					wrapper.append(rowArray[1]);
					wrapper.append(rowArray[2]);
				}
			}
		} else {
			let textHtml = $("<div/>",{id: _self.identifier + "-loading"});
			textHtml.html("Loading ...");
			wrapper.append(textHtml);
		}
		return wrapper[0];
	},

	// update data from homematic
	updateHomematicData: function(){
		let _self = this;
		let datapointServiceUrl = this.config.ccuProtocol + this.config.ccuHost + this.config.ccuXmlApiUrl + this.config.ccuStateServiceUrl + this.config.ccuDatapointIdParameter;
		let sysvarServiceUrl = this.config.ccuProtocol + this.config.ccuHost + this.config.ccuXmlApiUrl + this.config.ccuSysvarServiceUrl + this.config.ccuIseIdParameter;

		if(typeof(this.config.datapoints) === 'object') {
			_self.dataCounter = 0;
			_self.dataMax = this.config.datapoints.length;

			$.each(this.config.datapoints,function(){
				let _that = this;
				if(typeof(this.name) === 'string' && typeof(this.id) === 'string' && typeof(this.type) === 'string') {
					if(this.type.startsWith('sysvar_valuelist')) {
						$.get(sysvarServiceUrl + this.id, function(data) {
							let idx = data.childNodes[0].childNodes[0].attributes.value.value;
							let value = data.childNodes[0].childNodes[0].attributes.value_list.value.split(";")[idx];
							_self.homematicDataRecieved(value,_that);
						}).fail(function() {
							_self.communicationError();
						});
					} else {
						$.get(datapointServiceUrl + this.id, function(data) {
							let value = data.childNodes[0].childNodes[0].attributes.value.value;
							_self.homematicDataRecieved(value,_that);
						}).fail(function() {
							_self.communicationError();
						});
					}
				}
			});
		}
	},

	// on homematic data recieved
	homematicDataRecieved: function (data, datapoint) {
		if (this.config.debug) {
			console.log('homematic data', data);
		}
		if(typeof(this.homematicData) === 'undefined') {
			this.homematicData = [];
		}
		this.homematicData[this.removeSpecialChars(datapoint.name)] = data;
		this.dataCounter++;
		if(this.dataCounter >= this.dataMax) {
			this.updateDom(this.config.animationSpeed);
			this.scheduleUpdate();
		}
	},

	// on error getting homematic data
	communicationError: function () {
		if (this.config.debug) {
			console.log('error reading homeatic data');
		}
		this.dataCounter++;
		if(this.dataCounter >= this.dataMax) {
			// try again
			this.scheduleUpdate();
		}
	},

	// schedules next update
	scheduleUpdate: function(delay) {
		let _self = this;
		let nextLoad = this.config.updateInterval;

		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		setTimeout(function() {
			_self.updateHomematicData();
		}, nextLoad * 1000);
	},

	// removes special chars and whitespaces
	removeSpecialChars: function(text) {
		return text.replace(/[^\w]/gi, '');
	},

	// translate long or short version depending on config
	translateLoS: function(text) {
		let _self = this;
		return _self.translate(text + (_self.config.useShortText === "true" ? "_SHORT": ""));;
	},

});
