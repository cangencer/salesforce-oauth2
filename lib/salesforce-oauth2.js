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

//try to use proxy if available
var proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;

/**
 *  Authenticate with the server to get the access token
 */
var oauth2 = module.exports = function (options, rejectInvalidCertificates, callback) {
    var uri = tokenUrl + "?" + qs.stringify(options);    

    return request.post({
        url: uri,
        proxy: proxyUrl,
        rejectUnauthorized: rejectInvalidCertificates
    }, function (err, response) {
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
        if (verifySignature(payload, options.client_secret)) {
            return callback(null, payload);
        } else {
            return callback({
                message:"The signature could not be verified.",
                payload:payload
            });
        }
    });    
};

/**
 *    Get the URL to redirect to get the user approval.
 *    @options should contain:
 *      client_id: the app's consumer key.
 *      redirect_uri: the app's callback URL
 *      scope: A space separated list of scope values. sample: api chatter
 *
 *      For a full list of parameters see http://wiki.developerforce.com/page/Digging_Deeper_into_OAuth_2.0_on_Force.com
 */
oauth2.getAuthorizationUrl = function (options) {
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
 *  @rejectInvalidCertificates whether a server should automatically reject clients with invalid certificates
 */
oauth2.authenticate = function (options, rejectInvalidCertificates, callback) {
    options = _.extend({
        "grant_type":"authorization_code"
    }, options);
    return oauth2(options, rejectInvalidCertificates, callback);
};

/**
 *  Send the username and password to the server and get the access token.
 *  @options should contain the following:
 *      client_id: the app's consumer key
 *      client_secret: the app's consumer secret
 *      username: The API user's Salesforce.com username, of the form user@example.com
 *      password: The API user's Salesforce.com password. If the client's IP address has not
 *                been whitelisted in your org, you must concatenate the security token with 
 *                the password.
 *  @rejectInvalidCertificates whether a server should automatically reject clients with invalid certificates
 */
oauth2.password = function(options, rejectInvalidCertificates, callback) {
    options = _.extend({
        "grant_type": "password"
    }, options);
    return oauth2(options, rejectInvalidCertificates, callback);
}

/**
 *  Send the refresh token in order to renew the access token
 *  @options should contain the following:
 *      client_id: the app's consumer key
 *      redirect_uri: the app's callback URL
 *      client_secret: the app's consumer secret
 *      refresh_token: the refresh token
 *  @rejectInvalidCertificates whether a server should automatically reject clients with invalid certificates
 */
oauth2.refresh = function (options, rejectInvalidCertificates, callback) {
    options = _.extend({
        "grant_type":"refresh_token"
    }, options);
    return oauth2(options, rejectInvalidCertificates, callback);
}

function verifySignature(payload, consumerSecret) {
    var hmac = crypto.createHmac("sha256", consumerSecret);
    hmac.update(payload.id);
    hmac.update(payload.issued_at);

    return hmac.digest("base64") === payload.signature;
}
