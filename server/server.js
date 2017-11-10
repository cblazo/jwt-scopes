'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');

// Required packages
var jwt = require('express-jwt');
var jwks = require('jwks-rsa');
var unless = require('express-unless');
var validateScope = require('validate-scope');
var jwtDecode = require('jwt-decode');

// All allowed scopes. Predefined.
// Not used
//var scopeList = require('./scope-list.json');

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
// except for /explorer (for developing)
// TODO Get Unless working in order to add exception paths
app.use(requireAuth.unless({
  path:[
    '/explorer' //,
    //{ url: '/', methods: ['GET', 'PUT']  }
  ]
}));

//////////////////////////
// Scope check middleware
//////////////////////////
// NB Routing rules for subfolders overwrite the parent folder scope.

// TODO Differentiate scopes between model attributes (e.g. customerApp can't see Product.stock)
// TODO Move the hardcoded paths and scopes to a json file or to common/product.js for example. (app.get('/api/*', retrieve_and_check_scopes(), func))
// TODO Make scalable in such a way that you only have to define new scopes only in 1 place instead of both Auth0 and server.js

// When there is a GET request at /api/products or any subpage, validate that the JWT scope contains 'read:products'
app.get('/api/products', check_scopes(['read:products']), function(req,res,next){ return next(); });
app.get('/api/products*', check_scopes(['read:products']), function(req,res,next){ return next(); });
// When there is a HEAD request at /api/products/{id}, validate that the JWT scope contains 'read:products'
app.head('/api/products*', check_scopes(['read:products']), function(req,res,next){ return next(); });
// When there is a GET request at /api/products/count, validate that the JWT scope contains 'count:products'
app.get('/api/products/count', check_scopes(['count:products']), function(req,res,next){ return next(); });
// When there is a PUT or PATCH request at /api/products or any subpage, validate that the JWT scope contains 'create:products' and 'update:products'
app.put('/api/products', check_scopes(['update:products', 'create:products']), function(req,res,next){ return next(); });
app.put('/api/products*', check_scopes(['update:products', 'create:products']), function(req,res,next){ return next(); });
app.patch('/api/products', check_scopes(['update:products', 'create:products']), function(req,res,next){ return next(); });
app.patch('/api/products*', check_scopes(['update:products', 'create:products']), function(req,res,next){ return next(); });
// When there is a POST request at /api/products or any subpage, validate that the JWT scope contains 'create:products' and 'update:products'
app.post('/api/products', check_scopes(['create:products']), function(req,res,next){ return next(); });
app.post('/api/products*', check_scopes(['update:products', 'create:products']), function(req,res,next){ return next(); });
// When there is a DELETE request at /api/products/{id}, validate that the JWT scope contains 'delete:products'
app.delete('/api/products*', check_scopes(['delete:products']), function(req,res,next){ return next(); });

// Do the same for Sales
app.get('/api/sales', check_scopes(['read:sales']), function(req,res,next){ return next(); });
app.get('/api/sales*', check_scopes(['read:sales']), function(req,res,next){ return next(); });
app.head('/api/sales*', check_scopes(['read:sales']), function(req,res,next){ return next(); });
app.put('/api/sales', check_scopes(['update:sales', 'create:sales']), function(req,res,next){ return next(); });
app.put('/api/sales*', check_scopes(['update:sales', 'create:sales']), function(req,res,next){ return next(); });
app.patch('/api/sales', check_scopes(['update:sales', 'create:sales']), function(req,res,next){ return next(); });
app.patch('/api/sales*', check_scopes(['update:sales', 'create:sales']), function(req,res,next){ return next(); });
app.post('/api/sales', check_scopes(['create:sales']), function(req,res,next){ return next(); });
app.post('/api/sales*', check_scopes(['update:sales', 'create:sales']), function(req,res,next){ return next(); });
app.delete('/api/sales*', check_scopes(['delete:sales']), function(req,res,next){ return next(); });

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
