'use strict';

var options = require('../src/cli-options')();
var parseWordpress = require("../src/parse-wordpress");
var FS = require("fs");
var HTTP = require("http");
var Q = require("q");
Q.longStackSupport = true;

var dataPath = __dirname + '/../data/';
var episodes = JSON.parse(FS.readFileSync(dataPath + 'episodes.json'));
var people = JSON.parse(FS.readFileSync(dataPath + 'people.json'));
var contents = JSON.parse(FS.readFileSync(dataPath + 'contents.json'));

var counter = 0;

var tasks = (options.episodes || Object.keys(episodes)).map(function(id) {
  id = parseInt(id, 10);
  var episode = episodes[id];
  var content = contents[id];
  
  if (!options.episodes && episode.href && content) {
    // this episode has already been mapped, no need to repeat unless it was requested
    return true;
  }
  
  if (options.except && options.except.indexOf(id) > -1) {
    // this episode was excluded from the update
    return true;
  }
  
  counter++;
  if (options.limit && counter > options.limit) {
    // we've reached the limit, ignore the rest
    return true;
  }
  
  function addId(data) {
    data.id = id;
    return data;
  }
  
  return fetch(id)
    .then(parseWordpress)
    .then(addId)
    .then(updateRecords)
    .then(function(){ return id; })
    .then(saveContents)
    .catch(logError.bind(null, id));
});

Q.allSettled(tasks)
  .then(saveJSON)
  .then(findAnomalies)
  .catch(logError.bind(null, null));

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

function logError(episode, error) {
  console.error("ERROR in episode " + episode, error, error.stack);
}

function updateRecords(data) {
  episodes[data.id].href = data.href;
  episodes[data.id].audio = data.audio;
  contents[data.id] = {
    episode: data.id,
    topics: data.topics,
    news: data.news,
    links: data.links,
    randomSpec: data.randomSpec
  };
}

function saveJSON() {
  FS.writeFileSync(dataPath + 'episodes.json', JSON.stringify(episodes, null, 2));
  FS.writeFileSync(dataPath + 'contents.json', JSON.stringify(contents, null, 2));
}

function saveContents(id) {
  var writeFile = Q.denodeify(FS.writeFile);
  var data = {
    episode: id
  };
  
  function toData(key) {
    data[key] = this[key];
  }
  
  Object.keys(episodes[id]).forEach(toData.bind(episodes[id]));
  Object.keys(contents[id]).forEach(toData.bind(contents[id]));
  data.people = data.people.map(function(person) {
    return people[person];
  });

  return writeFile(dataPath + "episodes/" + id + '.json', JSON.stringify(data, null, 2));
}

function findAnomalies() {
  var headered = {};
  function log(id, message) {
    if (!headered[id]) {
      console.log('## Episode ' + id + " ##########");
      headered[id] = true;
    }
    
    console.log("  " + message);
  }
  
  Object.keys(episodes).forEach(function(id) {
    var episode = episodes[id];
    var content = contents[id];
    
    !episode.date && log(id, "Date is missing");
    !episode.href && log(id, "Link is missing");
    !episode.people.length && log(id, "People are missing");
    
    if (!content) {
      log(id, "content is missing completely - parse error?");
    } else {
      if (!content.topics.length) {
        log(id, "topics are missing");
      }
    }
  });
}
