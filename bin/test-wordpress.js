'use strict';

var options = require('../src/cli-options')(['episodes']);
var httpGet = require("../src/http-get");
var parseWordpress = require("../src/parse-wordpress");

var FS = require("fs");
var HTTP = require("http");
var Q = require("q");
Q.longStackSupport = true;


options.episodes.map(function(id) {
  return httpGet("http://workingdraft.de/" + id + "/")
    .then(parseWordpress)
    .then(function(data) {
      console.log("\n\nParsed data for episode " + id);
      console.log(JSON.stringify(data, null, 2));
    })
    .catch(logError.bind(null, id));
});


function logError(episode, error) {
  console.error("ERROR in episode " + episode, error, error.stack);
  throw error;
}
