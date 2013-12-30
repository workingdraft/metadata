# Workingdraft Metadata Repository

This repository provides metadata for the German [Workingdraft](http://workingdraft.de/) podcast episodes.

The data in `episodes.json` is (mostly) maintained manually, thus might not always contain the latest episodes. The data in `contents.json` is aggregated through web-scraping the wordpress of Workingdraft (see `bin/update.js`).

Use `node bin/update.js` to save scraped data to disk. Use `node bin/test.js --episode 123` to test the scraper for a specific set of episodes. Use `--help` on either script to see the available options.


## Motivation

I wanted to have machine-readable data to toy with visualizing Workingdraft in various ways. As a second option the extracted data could be the base for moving away from wordpress, should we ever choose to do so.


## TODO

* [scraper] consider reading descriptions of elements as well, currently only titles are imported
* [wordpress] consider fixing timestamps (`00:00:00`) where present
* [wordpress] consider adding timestamps where presently not available


## Interesting Links ##

* http://wavesurfer.fm/