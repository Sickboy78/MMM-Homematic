Module.register("MMM-Homematic",{
	// default module config
	defaults: {
		initialLoadDelay: 0,
		updateInterval: 30,
		animationSpeed: 1000,
		tempUnit: "°C",
		humUnit: "%",
		shutterUnit: "%",
		ccuProtocol: 'http://',
		ccuHost: 'ccu3-webui',
		ccuXmlApiUrl: '/addons/xmlapi',
		ccuServiceUrl: '/state.cgi',
		ccuIdParameter: '?datapoint_id='
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
		if(typeof(_self.homematicData) !== 'undefined') {
			if(typeof(this.config.datapoints) === 'object') {
				$.each(this.config.datapoints,function(){
					if(typeof(this.name) === 'string' && typeof(this.id) === 'string' && typeof(this.type) === 'string') {
						let value = _self.homematicData[_self.removeSpecialChars(this.name)];
						let text_is = "";
						let text_class = "";
						if((this.type.indexOf("warn") !== -1) && (typeof(this.warnOnly) === 'string') && (this.warnOnly === 'true')) {
							text_class = "hide";
						}

						if(this.type.startsWith('window')) {
							// window/door
							if(value == 0) {
								text_is = _self.translate("IS_CLOSED");
								if(this.type === 'window_warn_closed') {
									text_class = "bright red";
								}
							} else {
								text_is = _self.translate("IS_OPEN");
								if(this.type === 'window_warn_open') {
									text_class = "bright red";
								}
							}
						} else if(this.type.startsWith('temp')) {
							// temperature
							let valueStr = Number(value).toFixed(1);
							
							if(this.type.startsWith('temp_') && typeof(this.threshold) === 'string') {
								if(this.type === 'temp_warn_high' && value >= this.threshold) {
									text_is = _self.translate("IS_TOO_HIGH") + " (" + valueStr + _self.config.tempUnit + ")";
									text_class = "bright red";
								} else if(this.type === 'temp_warn_low' && value <= this.threshold) {
									text_is = _self.translate("IS_TOO_LOW") + " (" + valueStr + _self.config.tempUnit + ")";
									text_class = "bright red";
								} else {
									text_is = _self.translate("IS_OK") + " (" + valueStr + _self.config.tempUnit + ")";
								}
							} else {
								text_is = _self.translate("IS") + " " + valueStr + _self.config.tempUnit;
							}
						} else if(this.type.startsWith('hum')) {
							// humidity
							let valueStr = Number(value).toFixed(0);

							if(this.type.startsWith('hum_') && typeof(this.threshold) === 'string') {
								if(this.type === 'hum_warn_high' && value >= this.threshold) {
									text_is = _self.translate("IS_TOO_HIGH") + " (" + valueStr + _self.config.humUnit + ")";
									text_class = "bright red";
								} else if(this.type === 'hum_warn_low' && value <= this.threshold) {
									text_is = _self.translate("IS_TOO_LOW") + " (" + valueStr + _self.config.humUnit + ")";
									text_class = "bright red";
								} else {
									text_is = _self.translate("IS_OK") + " (" + valueStr + _self.config.humUnit + ")";
								}
							} else {
								text_is = _self.translate("IS") + " " + valueStr + _self.config.humUnit;
							}
						} else if(this.type.startsWith('shutter')) {
							// shutter
							value = value*100;
							let valueStr = Number(value).toFixed(0);
							
							if(this.type.startsWith('shutter_') && typeof(this.threshold) === 'string') {
								if(this.type === 'shutter_warn_high' && value >= this.threshold) {
									text_is = _self.translate("IS_TOO_HIGH") + " (" + valueStr + _self.config.shutterUnit + ")";
									text_class = "bright red";
								} else if(this.type === 'shutter_warn_low' && value <= this.threshold) {
									text_is = _self.translate("IS_TOO_LOW") + " (" + valueStr + _self.config.shutterUnit + ")";
									text_class = "bright red";
								} else {
									text_is = _self.translate("IS_OK") + " (" + valueStr + _self.config.shutterUnit + ")";
								}
							} else {
								text_is = _self.translate("IS") + " " + valueStr + _self.config.shutterUnit;
							}
						} else if(this.type.startsWith('other')) {
							// other value/sensor
							let valueStr = value;
							if(typeof(this.precision) !== 'undefined') {
								valueStr = Number(value).toFixed(this.precision);
							}
							
							if(this.type.startsWith('other_') && typeof(this.threshold) === 'string') {
								if(this.type === 'other_warn_high' && value >= this.threshold) {
									text_is = _self.translate("IS_TOO_HIGH") + " (" + valueStr + ")";
									text_class = "bright red";
								} else if(this.type === 'other_warn_low' && value <= this.threshold) {
									text_is = _self.translate("IS_TOO_LOW") + " (" + valueStr + ")";
									text_class = "bright red";
								} else {
								text_is = _self.translate("IS_OK") + " (" + valueStr + ")";
								}
							} else {
								text_is = _self.translate("IS") + " " + valueStr;
							}
						}

						div = $("<div/>",{id: _self.identifier + "-" + _self.removeSpecialChars(this.name),class: text_class});
						div.html(this.name + " " + text_is);
						wrapper.append(div);
					}
				});
			}
		} else {
			let div = $("<div/>",{id: _self.identifier + "-loading"});
			div.html("Loading ...");
			wrapper.append(div);
		}
		return wrapper[0];
	},

	// update data from homematic
	updateHomematicData: function(){
		let _self = this;
		let url = this.config.ccuProtocol + this.config.ccuHost + this.config.ccuXmlApiUrl + this.config.ccuServiceUrl + this.config.ccuIdParameter;

		if(typeof(this.config.datapoints) === 'object') {
			_self.dataCounter = 0;
			_self.dataMax = this.config.datapoints.length;

			$.each(this.config.datapoints,function(){
				let _that = this;
				if(typeof(this.name) === 'string' && typeof(this.id) === 'string' && typeof(this.type) === 'string') {
					$.get(url + this.id, function(data) {
						let value = data.childNodes[0].childNodes[0].attributes.value.value;
						_self.homematicDataRecieved(value,_that);
					}).fail(function() {
						_self.communicationError();
					});
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

});
