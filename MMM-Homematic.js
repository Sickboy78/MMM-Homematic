/* global Module */
/* global Log */
/* global config */

/*
 * Magic Mirror
 * Module: MMM-Homematic
 *
 * By Sickboy78, spitzlbergerj
 * GPL Licensed.
 */

Module.register('MMM-Homematic',{

	// default module config
	defaults: {
		initialLoadDelay: 0,
		updateInterval: 30,
		animationSpeed: 1000,
		tempUnit: '°C',
		humUnit: '%',
		shutterUnit: '%',
		ampUnit: ' mA',
		voltUnit: ' V',
		pwrUnit: ' W',
		energyUnit: ' Wh',
		energyUnitK: ' kWh',
		freqUnit: ' Hz',

		locale: config.language,
		ccuProtocol: 'http://',
		ccuHost: 'ccu3-webui',
		ccuXmlApiUrl: '/addons/xmlapi',
		ccuXmlApiTokenId: '',
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
		Log.info('Starting module: ' + this.name);
		this.scheduleUpdate(this.config.initialLoadDelay);
	},

	// get additional scripts
	getScripts: function() {
		return [
			'https://code.jquery.com/jquery-1.12.4.min.js',  // this file will be loaded from the jquery servers.
		];
	},

	// get additional styles
	getStyles: function() {
		return [
			'MMM-Homematic.css',
		];
	},


	// return tranlation files
	getTranslations: function() {
		return {
			en: 'translations/en.json',
			de: 'translations/de.json'
		};
	},

	// Override dom generator.
	getDom: function() {
		const _self = this;
		// main wrapper
		const wrapper = $('<div/>',{class: 'small'});
		// add table class for style table_*
		if(_self.config.style.startsWith('table')) {
			wrapper.addClass('table');
			if(_self.config.style === 'table_rows' || _self.config.style === 'single_line') {
				wrapper.addClass('table-rows');
			}
			if(_self.config.style === 'table_columns') {
				wrapper.addClass('table-columns');
			}
		}

		// rows for style table_columns
		const rowArray = [$('<div/>',{class: 'table-row'}),$('<div/>',{class: 'table-row'}),$('<div/>',{class: 'table-row'})];

		if(typeof(_self.homematicData) !== 'undefined') {
			if(typeof(this.config.datapoints) === 'object') {

				// loop over datapoints
				$.each(this.config.datapoints,function() {
					// check name, id and type is set for datapoint
					if(typeof(this.name) === 'string' && typeof(this.id) === 'string' && typeof(this.type) === 'string') {
						// row or line for style lines and single_line and table_rows
						const row = $('<div/>');
						// row counter for style table_columns
						let rowCounter = 0;

						// raw value of datapoint
						let value = _self.homematicData[_self.removeSpecialChars(this.name) + '_' + _self.removeSpecialChars(this.id)];
						// text value of datapoint
						let value_text = '';
						// whether short or long text values are used
						const use_short_text = _self.config.useShortText === 'true';

						// css class for text
						let text_class = '';
						// css class for text with icon
						let text_with_icon_class = '';
						// css class for icon
						let icon_class = '';
						// default warn color for text and icon
						let warn_color = 'red';
						// default warn class for text
						let warn_class = 'bright red';
						// default color for icon
						let icon_color = 'white';

						// default icon size
						let icon_size = 'medium';
						// default icon position
						let icon_position = 'left';

						// icon dom element
						let icon_element;

						// add class table-row for style table_*
						if(_self.config.style.startsWith('table')) {
							row.addClass('table-row');
						}
						// add class single_line for style single_line
                        if(_self.config.style === 'single_line') {
							row.addClass('single-line');
                        }

						// ------------------------------------
						// consider config values for datapoint
						// ------------------------------------

						// Introduction numberUnit
						// @spitzlbergerj, 20190624
						const numberUnit = typeof(this.numberUnit) === 'string' ? this.numberUnit : '';

						// hide element is default when warnOnly is true
						if((this.type.indexOf('warn') !== -1) && ((typeof(this.warnOnly) === 'string') && (this.warnOnly === 'true'))) {
							text_class = 'hide';
						}

						// Setting warning color
						// @spitzlbergerj, 20190127
						if(typeof(this.warnColor) === 'string') {
							warn_color = this.warnColor;
							warn_class = 'bright ' + warn_color;
						}

						if(typeof(this.iconColor) === 'string') {
							icon_color = this.iconColor;
						}

						// -----------------------------------------------------------
						// read values from devices and sysvars and compose value text
						// -----------------------------------------------------------

						// devices

						if(this.type.startsWith('window')) {
							// window/door
							// @spitzlberger: for HM-Sec-SCo added testing of Boolean value
							if((value === '0') || (value === 'false')) {
								value_text = _self.translateLoS('IS_CLOSED');
								if(this.type === 'window_warn_closed') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							} else {
								value_text = _self.translateLoS('IS_OPEN');
								if(this.type === 'window_warn_open') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							}
						} else if(this.type.startsWith('temp')) {
							// temperature sensor
							const valueStr = Number(value).toLocaleString(_self.config.locale, {minimumFractionDigits: 1, maximumFractionDigits: 1});

							if(this.type.startsWith('temp_') && typeof(this.threshold) === 'number') {
								if(this.type === 'temp_warn_high' && value >= this.threshold) {
									value_text = _self.translateLoS('IS_TOO_HIGH') + (use_short_text ? '' : ' (' + valueStr + _self.config.tempUnit + ')');
									text_class = warn_class;
									icon_color = warn_color;
								} else if(this.type === 'temp_warn_low' && value <= this.threshold) {
									value_text = _self.translateLoS('IS_TOO_LOW') + (use_short_text ? '' : ' (' + valueStr + _self.config.tempUnit + ')');
									text_class = warn_class;
									icon_color = warn_color;
								} else {
									value_text = _self.translateLoS('IS_OK') + (use_short_text ? '' : ' (' + valueStr + _self.config.tempUnit + ')');
								}
							} else {
								value_text = (use_short_text ? '' : _self.translateLoS('IS') + ' ') + valueStr + _self.config.tempUnit;
							}
						} else if(this.type.startsWith('hum')) {
							// humidity sensor
							const valueStr = Number(value).toLocaleString(_self.config.locale, {minimumFractionDigits: 0, maximumFractionDigits: 0});

							if(this.type.startsWith('hum_') && typeof(this.threshold) === 'number') {
								if(this.type === 'hum_warn_high' && value >= this.threshold) {
									value_text = _self.translateLoS('IS_TOO_HIGH') + (use_short_text ? '' : ' (' + valueStr + _self.config.humUnit + ')');
									text_class = warn_class;
									icon_color = warn_color;
								} else if(this.type === 'hum_warn_low' && value <= this.threshold) {
									value_text = _self.translateLoS('IS_TOO_LOW') + (use_short_text ? '' : ' (' + valueStr + _self.config.humUnit + ')');
									text_class = warn_class;
									icon_color = warn_color;
								} else {
									value_text = _self.translateLoS('IS_OK') + (use_short_text ? '' : ' (' + valueStr + _self.config.humUnit + ')');
								}
							} else {
								value_text = (use_short_text ? '' : _self.translateLoS('IS') + ' ') + valueStr + _self.config.humUnit;
							}
						} else if(this.type.startsWith('shutter')) {
							// shutter actuator
							value = value*100;
							const valueStr = Number(value).toLocaleString(_self.config.locale, {minimumFractionDigits: 0, maximumFractionDigits: 0});

							if(this.type.startsWith('shutter_') && typeof(this.threshold) === 'number') {
								if(this.type === 'shutter_warn_high' && value >= this.threshold) {
									value_text = _self.translateLoS('IS_TOO_HIGH') + (use_short_text ? '' : ' (' + valueStr + _self.config.shutterUnit + ')');
									text_class = warn_class;
									icon_color = warn_color;
								} else if(this.type === 'shutter_warn_low' && value <= this.threshold) {
									value_text = _self.translateLoS('IS_TOO_LOW') + (use_short_text ? '' : ' (' + valueStr + _self.config.shutterUnit + ')');
									text_class = warn_class;
									icon_color = warn_color;
								} else {
									value_text = _self.translateLoS('IS_OK') + (use_short_text ? '' : ' (' + valueStr + _self.config.shutterUnit + ')');
								}
							} else {
								value_text = (use_short_text ? '' : _self.translateLoS('IS') + ' ') + valueStr + _self.config.shutterUnit;
							}

							// Switch and energie
							// @spitzlbergerj, 20190206

						} else if(this.type.startsWith('switch')) {
							// switch actuator
							if(value === 'false') {
								value_text = _self.translateLoS('IS_OFF');
								if(this.type === 'switch_warn_off') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							} else {
								value_text = _self.translateLoS('IS_ON');
								if(this.type === 'switch_warn_on') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							}
						} else if(this.type.startsWith('energie')) {
							// switch actuator with power metering
							let valueUnit = '';
							let precision = 0;
							if(typeof(this.precision) === 'number') {
								precision = this.precision;
							}
							const valueStr = Number(value).toLocaleString(_self.config.locale, {minimumFractionDigits: precision, maximumFractionDigits: precision});

							if (this.type.startsWith('energie_a')) {
								valueUnit = _self.config.ampUnit;
							} else if (this.type.startsWith('energie_v')) {
								valueUnit = _self.config.voltUnit;
							} else if (this.type.startsWith('energie_p')) {
								valueUnit = _self.config.pwrUnit;
							} else if (this.type.startsWith('energie_ek')) {
								valueUnit = _self.config.energyUnitK;
							} else if (this.type.startsWith('energie_e')) {
								valueUnit = _self.config.energyUnit;
							} else if (this.type.startsWith('energie_f')) {
								valueUnit = _self.config.freqUnit;
							}

							if( ( this.type.endsWith('_high') || this.type.endsWith('_low') ) && typeof(this.threshold) === 'number') {
								if(this.type.endsWith('_high') && value >= this.threshold) {
									value_text = _self.translateLoS('IS_TOO_HIGH') + (use_short_text ? '' : ' (' + valueStr + valueUnit + ')');
									text_class = warn_class;
									icon_color = warn_color;
								} else if(this.type.endsWith('_low') && value <= this.threshold) {
									value_text = _self.translateLoS('IS_TOO_LOW') + (use_short_text ? '' : ' (' + valueStr + valueUnit + ')');
									text_class = warn_class;
									icon_color = warn_color;
								} else {
									value_text = valueStr + valueUnit;
								}
							} else {
								value_text = valueStr + valueUnit;
							}

						} else if(this.type.startsWith('other')) {
							// other sensor/actuator
							let precision = 0;
							if(typeof(this.precision) === 'number') {
								precision = this.precision;
							}
							const valueStr = Number(value).toLocaleString(_self.config.locale, {minimumFractionDigits: precision, maximumFractionDigits: precision});

							if(this.type.startsWith('other_') && typeof(this.threshold) === 'number') {
								if(this.type === 'other_warn_high' && value >= this.threshold) {
									value_text = _self.translateLoS('IS_TOO_HIGH') + (use_short_text ? '' : ' (' + valueStr + ')');
									text_class = warn_class;
									icon_color = warn_color;
								} else if(this.type === 'other_warn_low' && value <= this.threshold) {
									value_text = _self.translateLoS('IS_TOO_LOW') + (use_short_text ? '' : ' (' + valueStr + ')');
									text_class = warn_class;
									icon_color = warn_color;
								} else {
									value_text = _self.translateLoS('IS_OK') + (use_short_text ? '' : ' (' + valueStr + ')');
								}
							} else {
								// Introduction numberUnit
								// @spitzlbergerj, 20190624
								value_text = (use_short_text ? '' : _self.translateLoS('IS') + ' ') + valueStr + ' ' + numberUnit;
							}
						}

						// sysvars
						// @spitzlbergerj, 20190127

						else if(this.type.startsWith('sysvar_boolean')) {
							// SysVar boolean
							if(value === 'false') {
								value_text = _self.translateLoS('IS_FALSE');
								if(this.type === 'sysvar_boolean_warn_false') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							} else {
								value_text = _self.translateLoS('IS_TRUE');
								if(this.type === 'sysvar_boolean_warn_true') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							}
						} else if(this.type.startsWith('sysvar_alarm')) {
							// SysVar alarm
							if(value === 'false') {
								value_text = _self.translateLoS('IS_NOT_TRIGGERED');
								if(this.type === 'sysvar_alarm_warn_not_triggered') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							} else {
								value_text = _self.translateLoS('IS_TRIGGERED');
								if(this.type === 'sysvar_alarm_warn_triggered') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							}
						} else if(this.type.startsWith('sysvar_mashine')) {
							// SysVar Boolean; Special type machine that can run or not run
							if(value === 'false') {
								value_text = _self.translateLoS('IS_NOT_RUNNING');
								if(this.type === 'sysvar_mashine_warn_not_running') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							} else {
								value_text = _self.translateLoS('IS_RUNNING');
								if(this.type === 'sysvar_mashine_warn_running') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							}
						} else if(this.type.startsWith('sysvar_presence')) {
							// SysVar boolean, special type presence that can accept the values here or not here
							if(value === 'false') {
								value_text = _self.translateLoS('IS_AWAY');
								if(this.type === 'sysvar_presence_warn_away') {
									text_class = warn_class;
									icon_color = warn_color;
								}
							} else {
								value_text = _self.translateLoS('IS_HERE');
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
							value_text = _self.translateLoS('IS') + ' ' + value;

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
							let precision = 0;
							if(typeof(this.precision) === 'number') {
								precision = this.precision;
							}
							const valueStr = Number(value).toLocaleString(_self.config.locale, {minimumFractionDigits: precision, maximumFractionDigits: precision});

							if(this.type.startsWith('sysvar_number_') && typeof(this.threshold) === 'number') {
								if(this.type === 'sysvar_number_warn_high' && value >= this.threshold) {
									text_class = warn_class;
									icon_color = warn_color;
								} else if(this.type === 'sysvar_number_warn_low' && value <= this.threshold) {
									text_class = warn_class;
									icon_color = warn_color;
								}
							}

							// Introduction numberUnit
							// @spitzlbergerj, 20190624
							value_text = valueStr + ' ' + numberUnit;
						}

						// ------------
						// compose icon
						// ------------

						if((typeof(this.iconPosition) === 'string')) {
							icon_position = this.iconPosition;
						}

						if(typeof(this.icon) === 'string') {
							// show icon
							let icon_url;

							if((typeof(this.iconSize) === 'string')) {
								icon_size = this.iconSize;
							}

							icon_class = ' icon icon-' + icon_size + ' icon-' + icon_position + ' icon-' + icon_color;
							if(icon_position !== 'center' || _self.config.style.startsWith('table')) {
								text_with_icon_class = ' text-with-icon text-with-icon-' + icon_size;
							}

							if(this.icon.startsWith('fa-')){
								icon_element = $('<i/>',{id: _self.identifier + '-' + _self.removeSpecialChars(this.name) + '-icon',class: text_class + icon_class + ' fa fa-fw ' + this.icon});
							}
							else
							{
								if(this.icon.startsWith('default_')){
									// integrated icon
									icon_url = _self.data.path + 'icons/' + this.icon.substr(8) + '.png';
								} else {
									// external icon url
									icon_url = this.icon;
								}
								icon_element = $('<div/>',{id: _self.identifier + '-' + _self.removeSpecialChars(this.name) + '-icon',class: text_class + icon_class,style: 'background-image: url(' + icon_url + ');'});
							}
							if(_self.config.style.startsWith('table')) {
								icon_element = $('<div/>').append(icon_element);
								icon_element.addClass(text_class + ' table-cell align-top');
								if(this.icon.startsWith('fa-')){
									//icon_element.addClass("align-top");
								}
							}
						} else {
							icon_element = $('<div/>',{id: _self.identifier + '-' + _self.removeSpecialChars(this.name) + '-icon',class: text_class});
							if(_self.config.style.startsWith('table')) {
								icon_element.addClass('table-cell');
							}
						}

						// ---------------------------------
						// combine icon, name and value text
						// ---------------------------------

						// icon left/top or center for style lines
						if(icon_position === 'left' || icon_position === 'top') {
							if(_self.config.style === 'lines' && typeof(this.icon) === 'string') {
								row.append(icon_element);
							}
							if(_self.config.style === 'table_rows' || _self.config.style === 'single_line') {
								row.append(icon_element);
							}
							if(_self.config.style === 'table_columns') {
								rowArray[rowCounter++].append(icon_element);
							}
						}
						if(icon_position === 'center') {
							if(_self.config.style === 'lines' && typeof(this.icon) === 'string') {
								row.append(icon_element);
								row.append($('<br/>',{class: text_class}));
							}
						}

						// text
						if(_self.config.showText === 'true') {
							const textHtml = $('<div/>',{id: _self.identifier + '-' + _self.removeSpecialChars(this.name) + '-text'});
							if((typeof(this.iconOnly) !== 'string') || (this.iconOnly !== 'true')) {
								textHtml.addClass(text_class + text_with_icon_class + ' text-lines');
								if(this.replaceNameWithDatapointId != undefined && typeof(this.replaceNameWithDatapointId) === 'string' && _self.homematicData[_self.removeSpecialChars(this.name) + '_' + _self.removeSpecialChars(this.replaceNameWithDatapointId)] != undefined) {
									textHtml.html(_self.homematicData[_self.removeSpecialChars(this.name) + '_' + _self.removeSpecialChars(this.replaceNameWithDatapointId)]);
								} else {
									textHtml.html(this.name);
								}
								if(_self.config.style.startsWith('table')) {
									textHtml.addClass('table-cell');
								}
							} else {
								if(_self.config.style.startsWith('table')) {
									textHtml.addClass('table-cell');
								}
							}
							if(_self.config.style === 'table_columns') {
								rowArray[rowCounter++].append(textHtml);
							} else {
								row.append(textHtml);
							}
						}

						// icon center for styles table_*
						if(icon_position === 'center'){
							if(_self.config.style === 'table_columns') {
								rowArray[rowCounter++].append(icon_element);
							} else if(_self.config.style === 'table_rows' || _self.config.style === 'single_line') {
								row.append(icon_element);
							}
						}

						// value
						if(_self.config.showValue === 'true') {
							const valueHtml = $('<div/>',{id: _self.identifier + '-' + _self.removeSpecialChars(this.name) + '-value'});
							if((typeof(this.iconOnly) !== 'string') || (this.iconOnly !== 'true')) {
								valueHtml.addClass(text_class + text_with_icon_class + ' text-lines');
								valueHtml.html('&nbsp;' + value_text);
								if(_self.config.style.startsWith('table')) {
									valueHtml.addClass('table-cell');
								}
							} else {
								if(_self.config.style.startsWith('table')) {
									valueHtml.addClass('table-cell');
								}
							}
							if(_self.config.style === 'table_columns') {
								rowArray[rowCounter++].append(valueHtml);
							} else {
								row.append(valueHtml);
							}
						}

						// icon right/bottom
						if(icon_position === 'right' || icon_position === 'bottom') {
							if((_self.config.style === 'lines' && typeof(this.icon) === 'string') || _self.config.style === 'table_rows' || _self.config.style === 'single_line') {
								row.append(icon_element);
							}
							if(_self.config.style === 'table_columns') {
								rowArray[rowCounter++].append(icon_element);
							}
						}

						// output for style lines and single_line and table_rows
						if(_self.config.style !== 'table_columns') {
							wrapper.append(row);
						}

					}
				}); // end of loop over datapoints

				// output for style table_columns
				if(_self.config.style === 'table_columns') {
					wrapper.append(rowArray);
				}
			}
		} else {
			// loading screen
			const textHtml = $('<div/>',{id: _self.identifier + '-loading'});
			textHtml.html('Loading ...');
			wrapper.append(textHtml);
		}
		return wrapper[0];
	},

	// notification recieved
	socketNotificationReceived: function (notification, payload) {
		const _self = this;
		this.debug = '';

		if (notification === 'HOMEMATIC_DATA_RECIEVED') {
			// make sure notification is intended for this isntance
			let containsAllConfigDatapoints = false;
			if(typeof(payload) === 'object' && typeof(this.config.datapoints) === 'object' && this.config.datapoints.length > 0) {
				containsAllConfigDatapoints = true;
				this.config.datapoints.forEach(function(datapoint){
					let containsConfigDatapoint = false;
					payload.forEach(function(data){
						if((data.type === 'datapoint' || data.type === 'sysvar') && data.datapoint.name == datapoint.name && data.datapoint.id == datapoint.id) {
							containsConfigDatapoint = true;
						}
					});
					if(datapoint.replaceNameWithDatapointId != undefined && typeof(datapoint.replaceNameWithDatapointId) === 'string') {
						let containsConfigReplaceDatapoint = false;
						payload.forEach(function(data){
							if(data.type === 'datapoint_replace_name' && data.datapoint.name == datapoint.name && data.datapoint.id == datapoint.id && data.datapoint.replaceNameWithDatapointId == datapoint.replaceNameWithDatapointId) {
								containsConfigReplaceDatapoint = true;
							}
						});
						containsConfigDatapoint = containsConfigReplaceDatapoint && containsConfigDatapoint;
					}
					containsAllConfigDatapoints = containsConfigDatapoint && containsAllConfigDatapoints;
				});
			}
			if(containsAllConfigDatapoints) {
				if(typeof(this.homematicData) === 'undefined') {
					this.homematicData = [];
				}
				try {
					payload.forEach(function(data){
						const xmlData = $.parseXML(data.value);
						let value = xmlData.childNodes[0].childNodes[0].attributes.value.value;
						if(data.type.startsWith('sysvar')) {
							value = xmlData.childNodes[0].childNodes[0].attributes.value_list.value.split(';')[value];
						}
						if(data.type === 'datapoint' || data.type === 'sysvar') {
							_self.homematicData[_self.removeSpecialChars(data.datapoint.name) + '_' + _self.removeSpecialChars(data.datapoint.id)] = value;
							_self.debug = _self.debug + _self.removeSpecialChars(data.datapoint.name) + '_' + _self.removeSpecialChars(data.datapoint.id) + '-';
						} else if(data.type === 'datapoint_replace_name') {
							_self.homematicData[_self.removeSpecialChars(data.datapoint.name) + '_' + _self.removeSpecialChars(data.datapoint.replaceNameWithDatapointId)] = value;
							_self.debug = _self.debug + _self.removeSpecialChars(data.datapoint.name) + '_' + _self.removeSpecialChars(data.datapoint.replaceNameWithDatapointId) + '-';
						}
					});
					if (this.config.debug) {
						console.log('[' + new Date().toLocaleString() + '] Info: homematic data recieved for: ' + this.debug);
					}
					this.updateDom(this.config.animationSpeed);
				} catch(err) {
					console.log('[' + new Date().toLocaleString() + '] Error: Could not parse recieved data because: ' + err);
				}
			}
		}
	},

	// schedules next update
	scheduleUpdate: function(delay) {
		const _self = this;
		const nextLoad = (delay != undefined && delay >= 0) ? delay : this.config.updateInterval;

		setTimeout(function() {
			const payload = {};
			payload.config = _self.config;
			if (_self.config.debug) {
				console.log('[' + new Date().toLocaleString() + '] Info: sending homematic data request.');
			}
			_self.sendSocketNotification('GET_HOMEMATIC_DATA', payload);
			_self.scheduleUpdate();
		}, nextLoad * 1000);
	},

	// removes special chars and whitespaces
	removeSpecialChars: function(text) {
		return text.replace(/[^\w]/gi, '');
	},

	// translate long or short version depending on config
	translateLoS: function(text) {
		const _self = this;
		return _self.translate(text + (_self.config.useShortText === 'true' ? '_SHORT': ''));
	},

});
