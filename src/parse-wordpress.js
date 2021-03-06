'use strict';

var cheerio = require("cheerio");

function analyze(html) {
  var $ = cheerio.load(html, {
      normalizeWhitespace: true
  });

  var content = $(".postcontent");
  if (!content.length) {
    throw new Error("No Content Found");
  }
  
  var title = ($('.postcontainer h2').text() || "").match(/^revision (\d+):(.+)/i);

  if(!title || !title.length) {
    title = ($('.postcontainer h2').text() || "").match(/^iteration (\d+):(.+)/i);
  }

  var data = {
    id: parseInt(title[1], 10),
    title: trim(title.slice(2).join(':')),
    audio: content.find(".podpress_downloadimglink").attr("href") || "",
    href: $('[rel="bookmark"]').attr("href") || ""
  };

  content.find('.podPress_content, script, .wp-flattr-button').remove();
  
  var headlines = content.find('h3');
  var paragraphs = headlines.length ? headlines.first().prevAll() : content.find('p');
  var description = paragraphs.map(function() {
    this.find('a').removeAttr('onclick');
    return trim(this.html());
  }).filter(function(item){ return !!item; }).join('\n\n');
  
  if (description) {
    data.description = description;
  }
  
  headlines.each(function() {
    var title = this.text().toLowerCase();
    var bucket;
    
    if (title.indexOf("news") > -1) {
      bucket = 'news';
    } else if (title.indexOf("keine") > -1 && title.indexOf("notizen") > -1 || title.indexOf("links") > -1 || title.indexOf("raffle") > -1) {
      bucket = 'links';
    } else if (title.indexOf("glücksrad") > -1) {
      bucket = 'randomSpec';
    } else if (title.indexOf("notizen") > -1 || title.indexOf("topics") > -1 
      || title.indexOf("notes") > -1 || title.indexOf("fragen über fragen") > -1 || title.indexOf("prognosen") > -1 ) {
      bucket = 'topics';
    } else if (title.indexOf("woche") > -1) {
      bucket = 'tip';
    } else if (title.indexOf("verlosung") > -1 || title.indexOf("job") > -1) {
      return;
    }

    data[bucket] = (data[bucket] || []).concat(analyzeContents(this));
  
    if (bucket === undefined && data[bucket].length) {
      if (data[bucket][0].title.slice(0, 1) === '[') {
        // Episode 87
        data.topics = data[bucket];
        delete data[bucket];
        return;
      }
      
      throw new Error('Unknown title "'+ title +'" with data');
    }
  });

  return data;
}

function analyzeContents(title) {
  var list = title.next();
  var data = [];
  
  while (list.length) {
    if (list.is('h3')) {
      break;
    }
    
    if (!list.is('dl, ul')) {
      list = list.next();
      continue;
    }
    
    data = data.concat(analyzeList(list, title));
    list = list.next();
  }
  
  // randomSpec sometimes comes as a single <p>
  if (!data.length && title.next().is('p')) {
    data = data.concat(analyzeList(title.next(), title));
  }

  return data.filter(function(item) {
    return !!item.title;
  });
}

function trim(text) {
  if (typeof text !== 'string') {
    return text;
  }
  
  return text.replace(/^[\s\r\n\t]+|[\s\r\n\t]+$/g, '');
}

function workaroundFuckedMarkup(title) {
  var _title = title.clone();
  var elem = _title.find('p, dd').first();
  if (!elem.length) {
    return title;
  }
  
  elem.nextAll().remove();
  elem.remove();
  return _title;
}

function splitTimedTitle(title) {
  var text = workaroundFuckedMarkup(title).text();
  var split = text.match(/^\s*\[([\d+:\.]+)\]\s*(.+)\s*$/i);
  return {
    time: trim(split && split[2] && split[1].replace(/\./g, ':') || null),
    title: trim(split && (split[2] || split[1]) || text)
  };
}

function sanitizeUrl(text) {
  if (!text || text === '#') {
    return null;
  }
  
  return text;
}

function definitionListTitles(list) {
  if (!list.find('dl').length) {
    // would've used children() but Revisions 3,4,5,… disagree
    return list.find('dt');
  }
  
  var clone = list.clone();
  clone.find('dl').remove();
  return clone.find('dt');
}

function extractDescription(dd) {
  var data = [];
  while (dd.length) {
    if (!dd.is('dd')) {
      break;
    }
    // Note: while this "fixes" invalid html across many posts,
    // it removes the sub-definition of Revision 97
    var _dd = dd.clone();
    _dd.find('dl').remove();
    // don't we love google analytics?
    _dd.find('a').removeAttr('onclick');
    data.push(trim(_dd.html()));
    dd = dd.next();
  }
  
  
  return data.filter(function(item){ return !!item; }).join('\n\n');
}

function findDescription(dt) {
  var next = dt.find('dd').first();
  if (next.is('dd')) {
    return extractDescription(next);
  }
  
  next = dt.next();
  if (next.is('dd')) {
    return extractDescription(next);
  }
  
  return null;
}

function analyzeList(list, title) {
  var titleSplit = splitTimedTitle(title);
  
  function toObject(title, href, time, description) {
    var data = {
      title: title
    };
    
    href && (data.href = href);
    time && (data.time = time);
    description && (data.description = description);
    
    return data;
  }
  
  if (list.is('dl')) {
    return definitionListTitles(list).map(function() {
      var split = splitTimedTitle(this);
      return toObject(
        split.title,
        sanitizeUrl(this.find('a').attr('href')),
        split.time || titleSplit.time,
        findDescription(this)
      );
    });
  } else if (list.is('ul')) {
    return list.find('li a').map(function() {
      var split = splitTimedTitle(this.parent());
      return toObject(
        split.title,
        sanitizeUrl(this.attr('href')),
        split.time || titleSplit.time
      );
    });
  } else if (list.is('p')) {
    // episode 111 uses <p> to descibe the random spec item
    var _link = list.find('a').first();
    var _clone = list.clone();
    _clone.find('a').removeAttr('onclick');
    
    return toObject(
      trim(_link.text()),
      sanitizeUrl(_link.attr('href')),
      titleSplit.time,
      trim(_clone.html())
    );
  }
  
  return [];
}


module.exports = analyze;
