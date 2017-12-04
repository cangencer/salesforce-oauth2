# salesforce-oauth2 -- Salesforce OAuth2 Web Server Authentication Flow

## Abstract

A very lightweight implementation of the [OAuth2 Web Server Authentication Flow for Salesforce](http://wiki.developerforce.com/page/Digging_Deeper_into_OAuth_2.0_on_Force.com) for Node.js.

As Salesforce already provides a very robust REST API, the aim of this module is to provide a very thin wrapper for the authentication functionality only.

## Install

	npm install salesforce-oauth2

## Usage 

An example using the express web framework:

````javascript
var express = require('express'),
	oauth2 = require('salesforce-oauth2');

var callbackUrl = "<your callback url>",
	consumerKey = "<your consumer key>",
	consumerSecret = "<your consumer secret>";

var app = express.createServer(express.logger());


app.get("/", function(request, response) {
	var uri = oauth2.getAuthorizationUrl({
		redirect_uri: callbackUrl,
		client_id: consumerKey,
		scope: 'api', // 'id api web refresh_token'
		// You can change loginUrl to connect to sandbox or prerelease env.
		//base_url: 'https://test.my.salesforce.com'
	});
	return response.redirect(uri);
});

app.get('/oauth/callback', function(request, response) {
	var authorizationCode = request.param('code');

	oauth2.authenticate({
		redirect_uri: callbackUrl,
		client_id: consumerKey,
		client_secret: consumerSecret,
		code: authorizationCode,
		// You can change loginUrl to connect to sandbox or prerelease env.
		//base_url: 'https://test.my.salesforce.com'
	}, function(error, payload) {
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

		At this point, the client application can use the access token to authorize requests 
		against the resource server (the Force.com instance specified by the instance URL) 
		via the REST APIs, providing the access token as an HTTP header in 
		each request:

		Authorization: OAuth 00D50000000IZ3Z!AQ0AQDpEDKYsn7ioKug2aSmgCjgrPjG...
		*/
	});	
});

app.listen(3000, function() {
	console.log("Listening on 3000");
});
````

## Getting refresh_token

To get refresh_token you must pass 'refresh_token' word on scope. 
Remember to add a Available OAuth Scopes - refresh_token to Selected OAuth Scopes in your console developer 
Example:
````javascript
	app.get("/", function(request, response) {
		var uri = oauth2.getAuthorizationUrl({
			redirect_uri: callbackUrl,
			client_id: consumerKey,
			scope: 'api refresh_token',
			// You can change loginUrl to connect to sandbox or prerelease env.
			//base_url: 'https://test.my.salesforce.com'
		});
		return response.redirect(uri);
	});
````

## Util links to setup your connected app salesforce
* [Create Connected App](https://help.salesforce.com/articleView?id=connected_app_create.htm&type=5)