/**
 *  Salesforce OAuth2 Web Server Authentication Flow.
 *  See Also: http://wiki.developerforce.com/page/Digging_Deeper_into_OAuth_2.0_on_Force.com
 */

var qs = require('querystring'),
	_ = require('underscore'),
	request = require('request'),
	crypto = require('crypto');

/**
 * @options Object containing consumerKey and callbackUrl
 * as defined for the app.
 */
var Auth = function(options) {
	options = _.extend({
		loginUrl: 'https://login.salesforce.com'
	}, options);

	this.authorizeUrl = options.loginUrl + '/services/oauth2/authorize';
	this.tokenUrl = options.loginUrl + '/services/oauth2/token';
	this.clientId = options.consumerKey;
	this.redirectUri = options.callbackUrl;
};

/**
 *	Get the URL to redirect to get the user approval.
 *	@params should contain the additional parameters such as scope
 *  For a full list of parameters see http://wiki.developerforce.com/page/Digging_Deeper_into_OAuth_2.0_on_Force.com
 */
Auth.prototype.getAuthorizationUrl = function(params) {
	params = _.extend({
		'response_type': 'code',
		'client_id': this.clientId,
		'redirect_uri': this.redirectUri
	}, params);

	return this.authorizeUrl + '?' + qs.stringify(params);
};

/**
 *  Send the authentication code to the server and get the access token.
 *  @consumerSecret The consumer secret for the app
 *  @code Authorization code retrieved via the callback URL
 */
Auth.prototype.authenticate = function(consumerSecret, code, callback) {
	var params = {
		'grant_type': 'authorization_code',
		'client_id': this.clientId,
		'redirect_uri': this.redirectUri,
		'code': code,
		'client_secret': consumerSecret
	};
	var uri = this.tokenUrl + '?' + qs.stringify(params);
	request.post(uri, function(err, response) {
		if (err) {
			return callback(err);
		}

		if (response.statusCode >= 400) {
			return callback({
				message: response.body
			});
		}

		var payload = JSON.parse(response.body);
		if (verifySignature(payload, consumerSecret)) {
			return callback(null, payload);
		} else {
			return callback({
				message: 'The signature could not be verified.',
				payload: payload
			});
		}
	});
};

var verifySignature = function(payload, consumerSecret) {
	var hmac = crypto.createHmac('sha256', consumerSecret);
	hmac.update(payload.id);
	hmac.update(payload.issued_at);

	return hmac.digest('base64') === payload.signature;
};

module.exports = Auth;
