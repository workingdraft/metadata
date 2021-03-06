# Workingdraft Metadata Repository

This repository provides metadata for the German [Workingdraft](http://workingdraft.de/) podcast episodes.

The data in `episodes.json` is (mostly) maintained manually, thus might not always contain the latest episodes. The data in `contents.json` is aggregated through web-scraping the wordpress of Workingdraft (see `bin/update.js`).

Use `node bin/update.js` to save scraped data to disk. Use `node bin/test-wordpress.js --episode 123` to test the scraper for a specific set of episodes. Use `--help` on either script to see the available options.

## Loading Data

By using [rawgithub.com](http://rawgithub.com) you can import all our data directly into [JSFiddle](http://jsfiddle.net), [JSBin](http://jsbin.com), et al:

```
https://raw2.github.com/workingdraft/metadata/master/data/episodes.json
becomes
https://rawgithub.com/workingdraft/metadata/master/data/episodes.json
```


## Motivation

I wanted to have machine-readable data to toy with visualizing Workingdraft in various ways. As a second option the extracted data could be the base for moving away from wordpress, should we ever choose to do so.


## Data Structure

All episodes metadata are (manually) tracked in `data/episodes.json`, participating people are tracked in `data/people.json`. All episodes content (parsed from Wordpress) are available in `data/contents.json` (all episodes in one file) and `data/episodes/12345.json` (single episode per file).

The episode index `data/episodes.json` contains general metadata:

```javascript
{
  "12345": {
    // number of the episode
    "id": 12345,
    // date the episode was published
    "date": "2015-01-02",
    // the length of the episode, 1 hour, 2 minutes and 3 seconds.
    // an optional fourth component (01:02:03:04) denotes microseconds
    "duration": "01:02:03",
    // [optional] livestream data
    // can be a boolean true to denote the episode was streamed, but has no link
    "live": [
      {
        // livestream's title
        "title": "Revision 136",
        // link to livestream (website, not audio file!)
        "href": "http://livestre.am/4BJRA",
        // duration of livestream recording
        // usually longer than the episode because preliminary discussions are streamed, 
        // but are not officially published
        "duration": "01:02:03",
        // date of the livestream - this is earlier than the episode's date, as
        // episode date is date of publishing, livestream date is date of recording
        "date": "2015-01-02"
      }
    ],
    // participants in the episode - details tracked in data/people.json
    "people": [
      "ddprt",
      "derSchepp",
      "drublic",
      "rodneyrehm",
      "sir_pepe"
    ],
    // link to the episode's trello board
    "trello": "https://trello.com/.../",
    // link to the episode's blog post
    "href": "http://workingdraft.de/12345/",
    // [optional] link to the episode's audio file
    "audio": "http://workingdraft.de/some/path/to/file/12345.mp3",
    // [optional] link to the episode's video
    "video": "http://www.youtube.com/watch?v=aFEiw0SEMyw",
    // the episode's title
    "title": "Some Catchy Episode Title"
  }
}
```

The people participating in workingdraft are tracked in `data/people.json`:

```javascript
{
  // id used to reference in data/episodes.hson
  "markus_schlegel": {
    // real name
    "name": "Markus Schlegel",
    // [optional] member of the core team [from, till]
    "team": [
      "2010-11-02",
      "2011-11-08"
    ],
    // [optional] links to various web profiles (twitter, web, xing)
    "twitter": "https://twitter.com/markus_schlegel",
    "web": "http://markus-schlegel.com/"
  },
}
```

An episode's content is tracked in `data/episodes/12345.json`:

```javascript
{
  "id": 12345,
  // date the episode was published
  "date": "2015-01-02",
  // the length of the episode, 1 hour, 2 minutes and 3 seconds.
  // an optional fourth component (01:02:03:04) denotes microseconds
  "duration": "01:02:03",
  // participants in the episode - details resolved from data/people.json
  "people": [
    {
      "name": "Rodney Rehm",
      "team": [
        "2011-09-16"
      ],
      "twitter": "https://twitter.com/rodneyrehm"
    },
    {
      "name": "Peter Kröner",
      "team": [
        "2010-11-02"
      ],
      "twitter": "https://twitter.com/sir_pepe"
    }
  ],
  // [optional] livestream data
  // can be a boolean true to denote the episode was streamed, but has no link
  "live": [
    {
      // livestream's title
      "title": "Revision 136",
      // link to livestream (website, not audio file!)
      "href": "http://livestre.am/4BJRA",
      // duration of livestream recording
      // usually longer than the episode because preliminary discussions are streamed, 
      // but are not officially published
      "duration": "01:02:03",
      // date of the livestream - this is earlier than the episode's date, as
      // episode date is date of publishing, livestream date is date of recording
      "date": "2015-01-02"
    }
  ],
  // link to the episode's trello board
  "trello": "https://trello.com/.../",
  // link to the episode's blog post
  "href": "http://workingdraft.de/12345/",
  // [optional] link to the episode's audio file
  "audio": "http://workingdraft.de/some/path/to/file/12345.mp3",
  // [optional] link to the episode's video
  "video": "http://www.youtube.com/watch?v=aFEiw0SEMyw",
  // the episode's title
  "title": "Some Catchy Episode Title",
  // [optional] the episode's brief meta-description (HTML)
  "description": "Some Episode Description.",
  // [optional] the topics ("Schaunotizen") that were discussed in this episode
  "topics": [
    {
      // the topic that was discussed
      "title": "Some Topic",
      // [optional] link to the topic
      "href": "http://example.com/some-topic",
      // [optional] the point in time the topic started being discussed
      "time": "01:02:03",
      // [optional] a description of what was discussed (HTML)
      "description": "Some Description"
    }
  ],
  // [optional] the news ("News") that were stated in this episode
  "news": [
    // same format as topic content
  ],
  // [optional] the links ("Keine Schaunotizen") that were suggested in this episode
  "links": [
    // same format as topic content
  ],
  // [optional] the random specifications ("HTML5-Glücksrad") that were explained in this episode
  "randomSpec": [
    // same format as topic content
  ]
}
```





## TODO

* [wordpress] consider fixing timestamps (`00:00:00`) where present
* [wordpress] consider adding timestamps where presently not available
* [scraping] parse all links to extract keywords (JS, CSS, Grunt, Sass, Preprocessor, …)
* [parse-wordpress] import comments


## Interesting Links ##

* http://wavesurfer.fm/