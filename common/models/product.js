'use strict';

module.exports = function(Product) {

//  var loopback = require('loopback');
//  var app = module.exports = loopback();

Product.isInStock = function(productId, req, res, cb) {
  if(productId === undefined){
    var error = new Error("No product ID supplied.");
    error.status = "Bad Request";
    error.statusCode = 400;
    error.stack = null;
    cb(error);
  }
  var requiredScope = ['read:products'];
  check_scopes(requiredScope, req, res, cb);
  Product.findById( productId, function (err, instance) {
    if(instance == null){
      var error = new Error("No product with that ID.");
      error.status = "No Content";
      error.statusCode = 204;
      error.stack = null;
      cb(error);
    } else {
      var response = false;
      if (instance.stock > 0) {
        response = true;
      }
      console.log("in stock: " + response);
      cb(null, response);
    }
  });
}

Product.remoteMethod(
  'isInStock', {
    description: 'Returns true if the product exists and is in stock',
    http: { path: '/isInStock', verb: 'get' },
    accepts: [
      { arg: 'id', type: 'number', http: { source: 'query'} },
      { arg: 'req', type: 'object', http: { source: 'req' } },
      { arg: 'res', type: 'object', http: { source: 'res' } }
    ],
    returns: { arg: 'inStock', type: 'boolean' }
  }
);

// Different from check_scopes in server.js
function check_scopes(requiredScopes, req, res, cb) {
    //
    // check if any of the scopes defined in the token,
    // is one of the scopes declared on check_scopes
    //
     var validateScope = require('validate-scope');
     var validate = validateScope(requiredScopes);
     var scope = req.user.scope;
     console.log("Required scope: " + requiredScopes + "\nTokens'  scope: "+ scope);
     if (scope == undefined) {
       if(requiredScopes == null){
         console.log("Application has a valid token with sufficient scope for this request (requires no scopes).");
         return;
       } else {
         console.log("Application has a valid token, but insufficient scope for this request (no scopes).");
         var error = new Error("Application has a valid token, but insufficient scope for this request (no scopes).");
         error.status = "AuthorizationError";
         error.statusCode = 401;
         error.stack = null;
         return cb(error);
       }
     } else if (validate(scope)) {
          console.log("Application has a valid token with sufficient scope for this request.");
          return;
      } else {
          console.log("Application has a valid token, but insufficient scope for this request (does not contain required scope).");
          var error = new Error("Application has a valid token, but insufficient scope for this request (does not contain required scope).");
          error.status = "AuthorizationError";
          error.statusCode = 401;
          error.stack = null;
          return cb(error);
      }
  }

}
