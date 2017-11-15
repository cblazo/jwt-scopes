'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');

// Required packages
var jwt = require('express-jwt');
var jwks = require('jwks-rsa');
var unless = require('express-unless');
var validateScope = require('validate-scope');

// All allowed scopes. Predefined.
var scopeList = require('./scope-list.json');

var app = module.exports = loopback();

////////////////////////////////
// JWT authorization middleware
////////////////////////////////

var requireAuth = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    // YOUR-AUTH0-DOMAIN name e.g https://prosper.auth0.com
    jwksUri: "https://clazo.eu.auth0.com/.well-known/jwks.json"
  }),
  // This is the identifier we set when we created the API
  audience: 'https://your-apiendpoint.nl/',
  issuer: 'https://clazo.eu.auth0.com/',
  algorithms: ['RS256']
});

// Protect the endpoints
app.use(requireAuth);

//////////////////////////
// Scope check middleware
//////////////////////////
// TODO Differentiate scopes between model attributes (e.g. customerApp can't see Product.stock)
// TODO Make scalable in such a way that you only have to define new scopes only in 1 place instead of both Auth0 and scope-list.json
// TODO In ValidateRequest, the current split-path splits by "/" and would not work with e.g. /api/products/stock/isInStock

//Upon these requests, validate the access token scope
app.get('/api*', validateRequest(), function(req,res,next){ return next(); })
app.post('/api*', validateRequest(), function(req,res,next){ return next(); })
app.put('/api*', validateRequest(), function(req,res,next){ return next(); })
app.patch('/api*', validateRequest(), function(req,res,next){ return next(); })
app.head('/api*', validateRequest(), function(req,res,next){ return next(); })
app.delete('/api*', validateRequest(), function(req,res,next){ return next(); })
//All other kinds of requests are unauthorized

// Catch error when an invalid token is supplied.
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    console.log("Application has an invalid token, or no token supplied!");
    return res.status(401).send('Application has an invalid token, or no token supplied.');
  }
  else {
    console.log(err);
    return res.status(500).send(err);
    //return next();
  }
});

/** Retrieve the required scope and compare to the token scope
*/
function validateRequest() {
  return function(req, res, next) {
    var requiredScope = "tempScope"; //value must be overwritten, otherwise it is an invalid request
    var reqMethod = req.method;
    var fullPath = req.path;
    var splitPath = fullPath.split('/');
    var model = splitPath[2];
    var path = splitPath[3];

    //retrieve the right required scope
    //Lookup the HTTP request method
    var methods = scopeList.methods;
    for(var i in methods){
      if(methods[i].method == reqMethod){
        console.log("Validating " + reqMethod + "-request");
        var models = methods[i].models;
        //Lookup the Model
        for(var j in models){
          if (models[j].model == model){
            var scopes = models[j].scopes;
            //Lookup the path and corresponding scopes
            for(var k in scopes){
              if (scopes[k].path == path){
                requiredScope = scopes[k].scope;
              }
            }
            // if scope hasn't changed, use Model's default scopes
            if(requiredScope == "tempScope"){
              requiredScope = models[j].defaultScopes;
            }
          }
        }
      }
    }
    checkScopes(requiredScope, req, res, next);
  }
}

function checkScopes(requiredScopes, req, res, next) {
  //
  // check if any of the scopes defined in the token,
  // is one of the scopes declared on check_scopes
  //
  var validate = validateScope(requiredScopes);
  var scope = req.user.scope;
  console.log("Required scope: " + requiredScopes + "\nTokens'  scope: "+ scope);
  if (scope == undefined) {
    if(requiredScopes == null){
      console.log("Application has a valid token with sufficient scope for this request (requires no scopes).");
      return next();
    } else {
      console.log("Application has a valid token, but insufficient scope for this request (no scopes).");
      return res.status(401).send('Application has a valid token, but insufficient scope for this request (no scopes).');
    }
  } else if (validate(scope)) {
    console.log("Application has a valid token with sufficient scope for this request.");
    return next();
  } else {
    console.log("Application has a valid token, but insufficient scope for this request (does not contain required scope).");
    return res.status(401).send('Application has a valid token, but insufficient scope for this request (does not contain required scope).');
  }
}

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
  app.start();
});
