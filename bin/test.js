'use strict';

var options = require('../src/cli-options')(['episodes']);
var parseWordpress = require("../src/parse-wordpress");
var FS = require("fs");
var HTTP = require("http");
var Q = require("q");
Q.longStackSupport = true;

var tasks = options.episodes.map(function(id) {
  return fetch(id).then(parseWordpress).then(function(data) {
    console.log(data);
  }).catch(logError.bind(null, id));
});

function logError(episode, error) {
  console.error("ERROR in episode " + episode, error, error.stack);
}

function fetch(revision) {
  var deferred = Q.defer();
  HTTP.get("http://workingdraft.de/" + revision + "/", function(res) {
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