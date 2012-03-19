var should = require("should"),
    _ = require('underscore'),
    nock = require('nock');

var oauth2 = require("../lib/salesforce-oauth2");

describe("when getting the authorization url", function () {
    it("should return url with correct parameters", function () {
        var uri = oauth2.getAuthorizationUrl({
            redirect_uri:"http://some/callback/url",
            client_id:"someconsumerkey",
            scope:"api"
        });
        uri.should.equal("https://login.salesforce.com/services/oauth2/authorize?response_type=code&redirect_uri=http%3A%2F%2Fsome%2Fcallback%2Furl&client_id=someconsumerkey&scope=api");
    });
});

describe("tokens", function () {
    var mockResponse = {
        id:"https://login.salesforce.com/id/00Dd0000000dsWLEAY/005d0000000b8kWAAQ",
        issued_at:"1332093834282",
        scope:"api",
        instance_url:"https://na14.salesforce.com",
        signature:"tDZZRHgqtJWXw1cEjyuazDNkonKuIYT2EYnJrC7zbc8=",
        access_token:"00Dd0000000dsWL!AR8AQCKKVxOwRhqhwXqNthdufggKWdUOOrp866CrJeEqF41eYP1kxtYmLMGxTkfRjFbzsD.Aqh8wvDyKyOPAVrDuyJS_bh2."
    };

    describe("when getting the access token", function () {
        var expectedPath = "/services/oauth2/token?grant_type=authorization_code&redirect_uri=http%3A%2F%2Fsome%2Fcallback%2Furl&client_id=some%20consumer%20key&client_secret=some%20consumer%20secret&code=some%20authorization%20code",
            options = {
                redirect_uri:"http://some/callback/url",
                client_id:"some consumer key",
                client_secret:"some consumer secret",
                code:"some authorization code"
            };

        it("should parse and verify the response", function (done) {
            var login = nock("https://login.salesforce.com")
                .post(expectedPath)
                .reply(200, mockResponse);

            oauth2.authenticate(options, function (error, payload) {
                should.not.exist(error);
                payload.should.eql(mockResponse);
                login.done();
                done();
            });
        });

        it("should have error if http status code > 400", function (done) {
            var login = nock("https://login.salesforce.com")
                .post(expectedPath)
                .reply(401, "");

            oauth2.authenticate(options, function (error, payload) {
                should.not.exist(payload);
                should.exist(error);
                login.done();
                done();
            });
        });

        it("should have error if signature is invalid", function (done) {
            var invalidResponse = _.clone(mockResponse);
            invalidResponse.signature = "invalid signature";

            var login = nock("https://login.salesforce.com")
                .post(expectedPath)
                .reply(200, invalidResponse);

            oauth2.authenticate(options, function (error, payload) {
                should.exist(error);
                should.not.exist(payload);
                login.done();
                done();
            });
        });
    });

    describe("when getting the refresh token", function () {
        var expectedPath = "/services/oauth2/token?grant_type=refresh_token&client_id=some%20consumer%20key&client_secret=some%20consumer%20secret&refresh_token=some%20refresh%20token",
            options = {
                client_id:"some consumer key",
                client_secret:"some consumer secret",
                refresh_token:"some refresh token"
            };

        it("should parse and verify the response", function (done) {
            var login = nock("https://login.salesforce.com")
                .post(expectedPath)
                .reply(200, mockResponse);

            oauth2.refresh(options, function (error, payload) {
                should.not.exist(error);
                payload.should.eql(mockResponse);
                login.done();
                done();
            });
        });

        it("should have error if http status code > 400", function (done) {
            var login = nock("https://login.salesforce.com")
                .post(expectedPath)
                .reply(401, "");

            oauth2.refresh(options, function (error, payload) {
                should.not.exist(payload);
                should.exist(error);
                login.done();
                done();
            });
        });

        it("should have error if signature is invalid", function (done) {
            var invalidResponse = _.clone(mockResponse);
            invalidResponse.signature = "invalid signature";

            var login = nock("https://login.salesforce.com")
                .post(expectedPath)
                .reply(200, invalidResponse);

            oauth2.refresh(options, function (error, payload) {
                should.exist(error);
                should.not.exist(payload);
                login.done();
                done();
            });
        });
    });
});
