# salesforce-oauth2 -- Salesforce OAuth2 Web Server Authentication Flow

## Abstract

This is a very lightweight implementation of the [OAuth2 Web Server Authentication Flow for Salesforce](http://wiki.developerforce.com/page/Digging_Deeper_into_OAuth_2.0_on_Force.com).

As Salesforce already provides a very robust REST API, the aim of this module is to provide a very thin wrapper for the authentication functionality only.

## Usage 

An example using the express web framework:

````javascript
var OAuth2 = require('salesforce-oauth2');

var auth = new OAuth2({
	'consumerKey': '<your consumer key>',
	'callbackUrl': '<your callback url>'
});

app.get('/', function(request, response) {
	var uri = auth.getAuthorizationUrl({
		scope: 'api'
	});
	return response.redirect(uri);
});

app.get('/oauth/callback', function(request, response) {	
	var consumerSecret = '<your consumer secret>';
	auth.authorize(consumerSecret, request.param('code'), function(error, payload) {		
		/*

		The payload should contain the following fields:
		
		id 				A URL, representing the authenticated user,
						which can be used to access the Identity Service.
		
		issued_at		The time of token issue, represented as the 
						number of seconds since the Unix epoch
						(00:00:00 UTC on 1 January 1970).
		
		refresh_token	A long-lived token that may be used to obtain
						a fresh access token on expiry of the access 
						token in this response. 

		instance_url	Identifies the Salesforce instance to which API
						calls should be sent.
		
		access_token	The short-lived access token.

		The signature field will be verified automatically and can be ignored.

		*/
	});
});
````