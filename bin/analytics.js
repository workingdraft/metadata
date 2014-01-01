'use strict';

require('string.prototype.repeat');

var FS = require("fs");
var _ = require("underscore");
var Q = require("q");
Q.longStackSupport = true;

// promises are so much nicer than this error-callback crap
var writeFile = Q.denodeify(FS.writeFile);
var readFile = Q.denodeify(FS.readFile);

var dataPath = __dirname + '/../data/';
// maps
var episodes, people, contents;
// arrays
var episodesList, peopleList, contentsList, episodeIdList;
// statistical sets
var _people, _episodes;

var filters = {
  // person filters
  guest: function(person) {
    return !person.team;
  },
  team: function(person) {
    return !!person.team;
  },
  isTeam: function(person) {
    return person.team && person.team.length === 1;
  },
  wasTeam: function(person) {
    return person.team && person.team.length === 2;
  },
  // episode filters
  episodeWithGuests: function(episode) {
    return episode.guests.length;
  },
  episodeWithoutGuests: function(episode) {
    return !episode.guests.length;
  }
};

loadIndexFiles()
  .then(mapsToArray)
  .then(buildPeople)
  .then(analyzePeople)
  .then(buildEpisodes)
  .then(analyzeEpisodes)
  .catch(logError);
  
function logError(error) {
  console.error("ERROR", error, error.stack);
  throw error;
}

function loadIndexFiles() {
  return Q.all([
    readFile(dataPath + 'episodes.json'),
    readFile(dataPath + 'people.json'),
    readFile(dataPath + 'contents.json'),
  ]).spread(function(_episodes, _people, _contents) {
    episodes = JSON.parse(_episodes);
    people = JSON.parse(_people);
    contents = JSON.parse(_contents);
  });
}

function mapsToArray() {
  episodeIdList = Object.keys(episodes).map(Number);
  episodesList = episodeIdList.map(function(key) {
    // resolve participants to the same objects
    contents[key].people = episodes[key].people = episodes[key].people.map(function(person) {
      return people[person];
    });
    
    return episodes[key];
  });
  
  contentsList = episodeIdList.map(function(key) {
    return contents[key];
  });
  
  peopleList = Object.keys(people).map(function(key) {
    people[key].id = key;
    return people[key];
  });
}

function buildPeople() {
  // categorize people
  _people = {
    guest: peopleList.filter(filters.guest),
    team: peopleList.filter(filters.team),
    teamCurrent: peopleList.filter(filters.isTeam),
    teamAlumni: peopleList.filter(filters.wasTeam)
  };

  // map episodes to people
  episodesList.forEach(function(episode) {
    episode.people.forEach(function(person) {
      if (!person.episodes) {
        person.episodes = [];
      }
      
      person.episodes.push(episode.id);
    });
    
    episode.guets = episode.people.filter(filters.guest);
    episode.team = episode.people.filter(filters.team);
  });
  
  var numberOfEpisodes = episodesList.length;
  peopleList.forEach(function(person) {
    person.totalEpisodes = person.episodes.length;
    person.firstEpisode = person.episodes[0];
    person.lastEpisode = person.episodes[person.totalEpisodes -1];
    person.totalEpisodeRatio = person.totalEpisodes / numberOfEpisodes;
    
    if (!person.team) {
      person.potentialEpisodes = null;
      person.participationRatio = null;
      return;
    }
    
    var lastEpisode = person.team[1] ? person.lastEpisode : numberOfEpisodes;
    // the number of episodes this person could've participated in
    person.potentialEpisodes = lastEpisode - person.firstEpisode + 1;
    // the ratio of participation is actual / possible
    person.participationRatio = person.totalEpisodes / person.potentialEpisodes;
  });
  
  _people.sortedBy = {
    totalEpisodes: sorted(peopleList, 'totalEpisodes'),
    participationRatio: sorted(_people.team, 'participationRatio')
  };
}

function analyzePeople() {
  console.log("\n## Participation\n");
  console.log(leftPad(_people.teamCurrent.length) + " People in team");
  console.log(leftPad(_people.teamAlumni.length) + " People are team alumni");
  console.log(leftPad(_people.guest.length) + " People were guests");

  console.log("\n### Top 10 Leaderboard\n");
  _.first(_people.sortedBy.totalEpisodes, 10).forEach(function(person) {
    var text = leftPad(person.totalEpisodes) 
      + " (" + leftPad((person.totalEpisodeRatio * 100).toFixed(2)) +  "%)"
      + " - " + person.name;

    if (person.team) {
      if (person.team[1]) {
        text += " (Alumni)";
      } else {
        text += " (Team)";
      }
    }
    
    console.log(text);
  });
  
  console.log("\n### Team Engagement\n");
  _.first(_people.sortedBy.participationRatio, 10).forEach(function(person) {
    var text = leftPad((person.participationRatio * 100).toFixed(2), 6) 
      + "% - " + person.name;
    
    if (person.team[1]) {
      text += " (Alumni)";
    } else {
      text += " (Team)";
    }
    
    console.log(text);
  });
}

function buildEpisodes() {
  _episodes = {
    guests: [],
    team: []
  };

  episodesList.forEach(function(episode) {
    episode.guests = episode.people.filter(filters.guest).length;
    episode.team = episode.people.length - episode.guests;

    var content = contents[episode.id] || {};
    episode._news = (content.news || []).length;
    episode._topics = (content.topics || []).length;
    episode._randomSpec = (content.randomSpec || []).length;
    episode._links = (content.links || []).length;
    
    if (episode.guests) {
      _episodes.guests.push(episode);
    } else {
      _episodes.team.push(episode);
    }
  });
  
  _episodes.sortedBy = {
    participants: sorted(episodesList, 'participants'),
    guests: sorted(episodesList, 'guests'),
    team: sorted(episodesList, 'team'),

    news: sorted(episodesList, '_news'),
    topics: sorted(episodesList, '_topics'),
    randomSpec: sorted(episodesList, '_randomSpec'),
    links: sorted(episodesList, '_links')
  };
}

function analyzeEpisodes() {
  console.log("\n## Episodes\n");

  console.log(leftPad(episodeIdList.length) + " Episodes in total");
  console.log(leftPad(_episodes.guests.length) + " Episodes with guests");
  console.log(leftPad(_episodes.team.length) + " Episodes without guests");
  
  console.log("\n### Top 5 By Guests\n");
  _.first(_episodes.sortedBy.guests, 5).forEach(function(episode) {
    var text = leftPad(episode.guests) 
      + " Guests in " + leftPad('#' + episode.id) + " - " + episode.title;
    
    console.log(text);
  });
  
  console.log("\n### Top 5 By Team\n");
  _.first(_episodes.sortedBy.team, 5).forEach(function(episode) {
    var text = leftPad(episode.team) 
      + " Team in " + leftPad('#' + episode.id) + " - " + episode.title;
    
    console.log(text);
  });
  
  console.log("\n### Top 5 By News\n");
  _.first(_episodes.sortedBy.news, 5).forEach(function(episode) {
    var text = leftPad(episode._news) 
      + " News in " + leftPad('#' + episode.id) + " - " + episode.title;
    
    console.log(text);
  });
  
  console.log("\n### Top 5 By Topics\n");
  _.first(_episodes.sortedBy.topics, 5).forEach(function(episode) {
    var text = leftPad(episode._topics) 
      + " Topics in " + leftPad('#' + episode.id) + " - " + episode.title;
    
    console.log(text);
  });
  
  console.log("\n### Top 5 By Random Specification\n");
  _.first(_episodes.sortedBy.randomSpec, 5).forEach(function(episode) {
    var text = leftPad(episode._randomSpec) 
      + " Specs in " + leftPad('#' + episode.id) + " - " + episode.title;
    
    console.log(text);
  });
  
  console.log("\n### Top 5 By Links\n");
  _.first(_episodes.sortedBy.links, 5).forEach(function(episode) {
    var text = leftPad(episode._links) 
      + " Links in " + leftPad('#' + episode.id) + " - " + episode.title;
    
    console.log(text);
  });
}


function sorted(list, property) {
  return _.sortBy(list, function(person) {
    return person[property];
  }).reverse();
}

function leftPad(text, space) {
  space || (space = 5);
  text = String(text);
  return " ".repeat(Math.max(space - text.length, 0)) + text;
}

