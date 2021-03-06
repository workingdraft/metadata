'use strict';

module.exports = function(mandatory) {
  var options = {
    analyze: true,
    livestream: true,
    update: true
  };

  process.argv.slice(2).forEach(function (val, index, array) {
    if (val === '--limit') {
      options.limit = parseInt(array[index+1], 10);
      if (!options.limit || isNaN(options.limit)) {
        console.error('invalid option --limit ' + array[index+1]);
        console.error('consult --help for usage information');
        process.exit(1);
      }
    }
    if (val === '--episode' || val === '--episodes') {
      options.episodes = (array[index+1] + "").split(',').map(Number).filter(function(val){ return !isNaN(val) && !!val; });
      if (!options.episodes.length) {
        console.error('invalid option --episodes ' + array[index+1]);
        console.error('consult --help for usage information');
        process.exit(1);
      }
    }
    if (val === '--except') {
      options.except = (array[index+1] + "").split(',').map(parseInt);
      if (!options.except.length) {
        console.error('invalid option --except ' + array[index+1]);
        console.error('consult --help for usage information');
        process.exit(1);
      }
    }
    if (val === '--analyze') {
      switch (array[index+1]) {
        case 'off': options.analyze = false; break;
        case 'all': options.analyze = 'all'; break;
        case 'only': 
          options.analyze = 'all'; 
          options.livestream = 'off'; 
          options.update = 'off'; 
          // essentially preventing any updates at all
          options.limit = 0.1;
          break;
        default: options.analyze = true; break;
      }
    }
    if (val === '--update') {
      options.update = array[index+1] === 'off' ? false : true;
    }
    if (val === '--livestream') {
      options.livestream = array[index+1] === 'off' ? false : true;
    }
    if (val === '--force') {
      options.force = true;
    }
    if (val === '--help') {
      console.log("OPTIONS:");
      console.log(" --episode 1,2,3   update episodes 1, 2 and 3");
      console.log(" --except 1,2,3    update everything but episodes 1, 2 and 3");
      console.log(" --limit 10        update only the first 10 update-worthy episodes");
      console.log(" --force           update all episodes (excluding --except) even if they're already cached");
      console.log(" --analyze off     disable content quality analysis");
      console.log(" --analyze all     run content quality analysis on all episodes (from cache)");
      console.log(" --analyze only    same as --analyze all --update off livestream off");
      console.log(" --update off      disable update of 'stale' cache");
      console.log(" --livestream off  disable fetching of livestream data");
      process.exit(0);
    }
  });
  
  if (options.episodes && options.except) {
    options.episodes = options.episodes.filter(function(value) {
      return options.except.indexOf(value) > -1;
    });
    
    if (!options.episodes.length) {
      delete options.episodes;
    }
  }

  mandatory && mandatory.forEach(function(key) {
    if (!options[key]) {
      console.error('mandatory option --' + key + ' not specified!');
      process.exit(1);
    }
  });

  return options;
};