'use strict';

var options = require('../src/cli-options')();
var parseWordpress = require("../src/parse-wordpress");
var FS = require("fs");
var HTTP = require("http");
var Q = require("q");
Q.longStackSupport = true;

// promises are so much nicer than this error-callback crap
var writeFile = Q.denodeify(FS.writeFile);
var readFile = Q.denodeify(FS.readFile);

var dataPath = __dirname + '/../data/';
var episodes, people, contents, checksum;

loadIndexFiles()
  .then(determineEpisodes)
  .then(parseEpisodes)
  .then(updateCachedEpisodes)
  .then(saveIndexFiles)
  .then(findAnomalies)
  .catch(logError.bind(null, null));

function logError(episode, error) {
  console.error("ERROR in episode " + episode, error, error.stack);
  throw error;
}

function loadIndexFiles() {
  return Q.all([
    readFile(dataPath + 'episodes.json'),
    readFile(dataPath + 'people.json'),
    readFile(dataPath + 'contents.json'),
    readFile(dataPath + 'checksum.json')
  ]).spread(function(_episodes, _people, _contents, _checksum) {
    episodes = JSON.parse(_episodes);
    people = JSON.parse(_people);
    contents = JSON.parse(_contents);
    checksum = JSON.parse(_checksum);
  });
}

function determineEpisodes() {
  var counter = 0;
  var _episodes = (options.episodes || Object.keys(episodes)).map(function(id) {
    id = parseInt(id, 10);
    var episode = episodes[id];
    var content = contents[id];
    var _included = options.episodes && options.episodes.indexOf(id) > -1;

    if (episode.href && content && !_included && !options.force) {
      // this episode has already been mapped, no need to repeat unless it was requested
      return null;
    }

    if (!episode.date && !_included) {
      // this episode can't be updated, as it hasn't been published yet
      return null;
    }

    if (options.except && options.except.indexOf(id) > -1) {
      // this episode was excluded from the update
      return null;
    }

    counter++;
    if (options.limit && counter > options.limit) {
      // we've reached the limit, ignore the rest
      return null;
    }
    
    return id;
  }).filter(function(item) { return !!item; });
  
  return Q(_episodes);
}

function parseEpisodes(list) {
  var promises = list.map(function(id) {
    return fetchEpisode(id)
      .then(parseWordpress)
      .then(updateEpisodesIndex)
      .then(mergeEpisodeContents)
      .then(saveEpisodeContents)
      .catch(logError.bind(null, id));
  });
  
  // continue processing even if an episode failed
  return Q.allSettled(promises)
    .thenResolve(list);
}

function updateCachedEpisodes(list) {
  if (!options.update) {
    return list;
  }
  
  var promises = determineCachedEpisodes(list).map(function(id) {
    if (contents[id]) {
      contents[id].id = id;
    }
    
    return Q(contents[id] || {id: id})
      .then(mergeEpisodeContents)
      .then(updateEpisodesIndex)
      // TOTO: avoid unnecessary disk I/O when nothing's changed
      .then(saveEpisodeContents)
      .catch(logError.bind(null, id));
  });
  
  return Q.allSettled(promises)
    .thenResolve(list);
}

function determineCachedEpisodes(list) {
  var fetched = {};
  list.forEach(function(item) {
    fetched[item] = true;
  });

  return Object.keys(episodes).map(Number).filter(function(item) {
    return !fetched[item];
  });
}

function fetchEpisode(id) {
  var deferred = Q.defer();
  HTTP.get("http://workingdraft.de/" + id + "/", function(res) {
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

function updateEpisodesIndex(data) {
  episodes[data.id].href = data.href;
  episodes[data.id].audio = data.audio;
  episodes[data.id].title = data.title;
  return data;
}

function mergeEpisodeContents(data) {
  var _data = {};
  var episode = episodes[data.id];

  function toData(key) {
    if (_data[key] === undefined) {
      _data[key] = this[key];
    }
  }
  
  // import episode metadata
  Object.keys(episode).forEach(toData.bind(episode));
  // import episode content
  Object.keys(data).forEach(toData.bind(data));
  // resolve participants
  _data.people = _data.people.map(function(person) {
    return people[person];
  });
  
  contents[data.id] = _data;
  return _data;
}

function saveEpisodeContents(data) {
  return writeFile(dataPath + "episodes/" + data.id + '.json', JSON.stringify(data, null, 2));
}

function saveIndexFiles(list) {
  return Q.allSettled([
    writeFile(dataPath + 'episodes.json', JSON.stringify(episodes, null, 2)),
    writeFile(dataPath + 'contents.json', JSON.stringify(contents, null, 2))
  ]).thenResolve(list);
}

function findAnomalies(list) {
  if (!options.analyze) {
    return list;
  }
  
  var headered = {};
  function log(id, message) {
    if (!headered[id]) {
      console.log('## Episode ' + id + " ##########");
      headered[id] = true;
    }
    
    console.log("  " + message);
  }
  
  list.forEach(function(id) {
    var episode = episodes[id];
    var content = contents[id];
    
    !episode.date && log(id, "Date is missing");
    !episode.href && log(id, "Link is missing");
    !episode.people.length && log(id, "People are missing");
    
    if (!content) {
      log(id, "content is missing completely - parse error?");
    } else {
      !content.title && log(id, "Title is missing");
      
      if (checksum[id]) {
        // check against specific checksums
        checksum[id].news !== (content.news || []).length && log(id, "checksum of news is wrong");
        checksum[id].topics !== (content.topics || []).length && log(id, "checksum of topics is wrong");
        checksum[id].randomSpec !== (content.randomSpec || []).length && log(id, "checksum of randomSpec is wrong");
        checksum[id].links !== (content.links || []).length && log(id, "checksum of links is wrong");
        checksum[id].description !== (content.description || "").split("\n\n").length && log(id, "checksum of description is wrong");
      } else {
        // check pure existence
        episode.flags && episode.flags.forEach(function(flag) {
          switch (flag) {
            case 'no-topics':
              content = content || {};
              content.topics = ['foo'];
              break;
            case 'no-description':
              content = content || {};
              content.description = 'foo';
              break;
          }
        });
        
        !content.description && log(id, "Description is missing");
        if (!content.topics.length) {
          log(id, "topics are missing");
        }
      }
    }
  });
}
