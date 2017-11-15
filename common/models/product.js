'use strict';

module.exports = function(Product) {

  Product.isInStock = function(productId, req, res, cb) {
    if(productId === undefined){
      var error = new Error("No product ID supplied.");
      error.status = "Bad Request";
      error.statusCode = 400;
      error.stack = null;
      cb(error);
    }
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


}
