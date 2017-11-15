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

}
