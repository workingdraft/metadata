'use strict';

var httpGet = require("../src/http-get");
var parseLivestream = require("../src/parse-livestream");

var FS = require("fs");
var HTTP = require("http");
var Q = require("q");
Q.longStackSupport = true;


httpGet("http://www.livestream.com/workingdraft/folder")
  .then(parseLivestream)
  .then(function(data) {
    console.log("Parsed data for livestream ");
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(logError);


function logError(error) {
  console.error("ERROR ", error, error.stack);
  throw error;
}
