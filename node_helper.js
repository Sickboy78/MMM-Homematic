const NodeHelper = require('node_helper');
const Log = require('logger');
const request = require('request');
const crypto = require('crypto');

module.exports = NodeHelper.create({

	start: function () {
		Log.log('Starting node helper for: ' + this.name);
		this.fetchers = {};
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification === 'GET_HOMEMATIC_DATA') {
			if(typeof(payload) === 'object' && payload.config != undefined) {
				// remember requests by hash of config from payload
				const md5Hasher = crypto.createHmac('md5', 'secret');
				const hash = md5Hasher.update(JSON.stringify(payload.config)).digest('base64');

				if(this.fetchers[hash] == undefined) {
					if (payload.config.debug) {
						Log.log('Recieved first request for data.');
					}
					this.fetchers[hash] = Date.now();
					this.getHomematicData(payload.config);
				} else {
					// only answer to request after 95% of update interval specified in config has passed
					// this ensures in case of multiple clients they don't spawn exponentially more requests
					if(Date.now() - this.fetchers[hash] > payload.config.updateInterval * 950) {
						if (payload.config.debug) {
							Log.log('Recieved request for data after update interval has passed.');
						}
						this.fetchers[hash] = Date.now();
						this.getHomematicData(payload.config);
					} else {
						if (payload.config.debug) {
							Log.log('Recieved request for data, but update interval has not passed yet.');
						}
					}
				}
			}
		}
	},

	getHomematicData: function(config) {
		// different service endpoints for datapoints and system variables
		const datapointServiceUrl = config.ccuProtocol + config.ccuHost + config.ccuXmlApiUrl + config.ccuStateServiceUrl + config.ccuDatapointIdParameter;
		const sysvarServiceUrl = config.ccuProtocol + config.ccuHost + config.ccuXmlApiUrl + config.ccuSysvarServiceUrl + config.ccuIseIdParameter;

		if(typeof(config.datapoints) === 'object') {
			const promiseArray = [];

			config.datapoints.forEach(function(datapoint) {
				if(typeof(datapoint.name) === 'string' && typeof(datapoint.id) === 'string' && typeof(datapoint.type) === 'string') {
					const type = datapoint.type.startsWith('sysvar_valuelist') ? 'sysvar' : 'datapoint';
					promiseArray.push(
						new Promise((resolve, reject) => {
							request({url: (type === 'sysvar' ? sysvarServiceUrl : datapointServiceUrl) + datapoint.id}, function(error, response, body) {
								if (!error && response.statusCode == 200) {
									return resolve({
										'type': type,
										'datapoint': datapoint,
										'value': body
									});
								} else {
									return reject(error != undefined ? error : 'Homematic XML-API Request returned status ' + response.statusCode);
								}
							});
						})
					);
				}
			});

			Promise.all(promiseArray).then((data) => {
				// all requests successfully returned data
				if (config.debug) {
					Log.log('All data collected, sending data notification.');
				}
				this.sendSocketNotification('HOMEMATIC_DATA_RECIEVED', data);
			}).catch((err) => {
				Log.log('Error: Could not get data from Homematic XML-API because:');
				Log.log(err);
			});
		}
	},
});