'use strict';

var HTTP = require("https");
var Q = require("q");
Q.longStackSupport = true;

function fetch(url) {
  var deferred = Q.defer();
  HTTP.get(url, function(res) {
    var buffer = "";
    res.setEncoding("utf8");
    res.on("data", function (chunk) {
      buffer += chunk;
    });
    res.on("end", function() {
      deferred.resolve(buffer);
    });
  }).on("error", function(e) {
    deferred.reject(e);
  });
  
  return deferred.promise;
}

module.exports = fetch;
