'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');

// Required packages
var jwt = require('express-jwt');
var jwks = require('jwks-rsa');
//var unless = require('express-unless');
var validateScope = require('validate-scope');
var jwtDecode = require('jwt-decode');

// All allowed scopes. Predefined.
// Not used
//var scopeList = require('./scope-list.json');

var app = module.exports = loopback();

////////////////////////////////
// JWT authorization middleware
////////////////////////////////

var authCheck = jwt({
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

//Protect the endpoints
app.use(authCheck);
//  // Exception paths
//  // TODO: Debug
// .unless({
//   path:[
//     '/index.html',
//     '/explorer',
//     { url: '/', methods: ['GET', 'PUT']  }
//   ]
// });

//////////////////////////
// Scope check middleware
//////////////////////////

// When there is a GET request at /api/products,
// validate that the JWT scope contains 'read:products'
app.get('/api/products',
  check_scopes(['read:products']),
  function(req,res,next){
    return next();
});

// When there is a GET request at /api/sales,
// validate that the JWT scope contains 'read:sales'
app.get('/api/sales',
  check_scopes(['read:sales']),
  function(req,res,next){
    return next();
});

// Catch error when an invalid token is supplied.
app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
       console.log("Application has an invalid token, or no token supplied!");
        return res.status(401).send('Application has an invalid token, or no token supplied.');
    }
    else {
        return res.status(status).send(err);
    }
});

function check_scopes(requiredScopes) {
  return function(req, res, next) {
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
}

///////////////////////////////////////////////////////////////////////

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
