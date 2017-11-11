'use strict';

module.exports = function(Sales) {

Sales.transaction = function(productId, amount, req, res, cb) {
  //Validate the input
  if(productId === undefined || amount === undefined){
    var error = new Error("No product ID or amount supplied.");
    error.status = "Bad Request";
    error.statusCode = 400;
    error.stack = null;
    cb(error);
  } else {
  var requiredScope = 'create:sales AND delete:products'; //hardcoded scope definition
  check_scopes(requiredScope, req, res, cb);    //Verify the token scope.
  var currentTime = new Date();
  //Create a new sales instance
  Sales.create({
    "productId": productId,
    "amount": amount,
    "date": currentTime
  }, function(err, transaction){
      var response = false;
      // Lookup the associated Product instance
      Sales.app.models.Product.findById(productId, function(err, product){
        var newStock = product.stock - amount;
        // Update it's stock.
        product.updateAttributes({stock: newStock}, function(err, product){
          console.log("\nCreated transaction: "); console.log(transaction);
          console.log("\nUpdated product stock: "); console.log(product);
          console.log("\nSold " + amount + " units of " + product.name + " for €" + (amount * product.price)  + "\n");
          if (product.stock == newStock){
            response = true;
          }
          cb(null, response);
        });
      });
  });
}
};

Sales.remoteMethod(
  'transaction', {
    description: 'Creates a sales instance, decreases a product stock',
    http: { path: '/transaction', verb: 'post' },
    accepts: [
      { arg: 'id', type: 'number', http: { source: 'query'} },
      { arg: 'amount', type: 'number', http: { source: 'query'} },
      { arg: 'req', type: 'object', http: { source: 'req' } },
      { arg: 'res', type: 'object', http: { source: 'res' } }
    ],
    returns: { arg: 'success', type: 'boolean' }
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


};
