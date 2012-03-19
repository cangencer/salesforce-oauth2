/**
 *  Salesforce OAuth2 Web Server Authentication Flow.
 *  See Also: http://wiki.developerforce.com/page/Digging_Deeper_into_OAuth_2.0_on_Force.com
 */

var qs = require("querystring"),
    _ = require("underscore"),
    request = require("request"),
    crypto = require("crypto");

var authorizeUrl = "https://login.salesforce.com/services/oauth2/authorize",
    tokenUrl = "https://login.salesforce.com/services/oauth2/token";

/**
 *    Get the URL to redirect to get the user approval.
 *    @options should contain:
 *      client_id: the app's consumer key.
 *      redirect_uri: the app's callback URL
 *      scope: A space separated list of scope values. sample: api chatter
 *
 *      For a full list of parameters see http://wiki.developerforce.com/page/Digging_Deeper_into_OAuth_2.0_on_Force.com
 */
module.exports.getAuthorizationUrl = function (options) {
    options = _.extend({
        "response_type":"code"
    }, options);

    return authorizeUrl + "?" + qs.stringify(options);
};

/**
 *  Send the authentication code to the server and get the access token.
 *  @options should contain the following:
 *      client_id: the app's consumer key
 *      redirect_uri: the app's callback URL
 *      code: authorization code
 *      client_secret: the app's consumer secret
 */
module.exports.authenticate = function (options, callback) {
    options = _.extend({
        "grant_type":"authorization_code"
    }, options);
    getToken(options, callback);
};

/**
 *  Send the refresh token in order to renew the access token
 *  @options should contain the following:
 *      client_id: the app's consumer key
 *      redirect_uri: the app's callback URL
 *      client_secret: the app's consumer secret
 *      refresh_token: the refresh token
 */
module.exports.refresh = function (options, callback) {
    options = _.extend({
        "grant_type":"refresh_token"
    }, options);
    return getToken(options, callback);
}

function getToken(params, callback) {
    var uri = tokenUrl + "?" + qs.stringify(params);
    return request.post(uri, function (err, response) {
        if (err) {
            return callback(err);
        }

        if (response.statusCode >= 400) {
            return callback({
                message:response.body,
                statusCode:response.statusCode
            });
        }
        var payload = JSON.parse(response.body);
        if (verifySignature(payload, params.client_secret)) {
            return callback(null, payload);
        } else {
            return callback({
                message:"The signature could not be verified.",
                payload:payload
            });
        }
    });
}

function verifySignature(payload, consumerSecret) {
    var hmac = crypto.createHmac("sha256", consumerSecret);
    hmac.update(payload.id);
    hmac.update(payload.issued_at);

    return hmac.digest("base64") === payload.signature;
}

