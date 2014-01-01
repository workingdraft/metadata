'use strict';

// http://www.livestream.com/workingdraft/folder

var cheerio = require("cheerio");

function analyze(html) {
  var $ = cheerio.load(html, {
      normalizeWhitespace: true
  });
  var data = {};
  
  $('.videos .video').each(function() {
    var link = this.find('a').first();
    var name = trim(link.attr('title'));
    
    var id = (name.match(/revision (\d+)/i) || [])[1];
    if (!id) {
      return;
    }
    
    var time = trim(link.find('.time').text()).split(':');
    if (time.length < 3) {
      time.unshift('00');
    }
    
    var date = new Date(this.find('.date').text().replace('Recorded on ', ''));
    date = date.getFullYear() + '-' + zeroPad(date.getMonth() +1) + '-' + zeroPad(date.getDate());
    
    var stream = {
      title: name,
      href: link.attr('href'),
      duration: time.join(':'),
      date: date
    };
    
    if (!data[id]) {
      data[id] = [];
    }
    
    data[id].push(stream);
  });
  
  Object.keys(data).forEach(function(id) {
    var streams = data[id];
    
    if (streams.length === 1) {
      return;
    }
    
    streams.sort(function(a, b) {
      return a.title.localeCompare(b.title);
    });
  });
  
  return data;
}


function trim(text) {
  if (typeof text !== 'string') {
    return text;
  }
  
  return text.replace(/^[\s\r\n\t]+|[\s\r\n\t]+$/g, '');
}

function zeroPad(text) {
  return String(text).length < 2
    ? ("0" + text)
    : text;
}


module.exports = analyze;