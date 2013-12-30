'use strict';

module.exports = function(mandatory) {
  var options = {};

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
    if (val === '--force') {
      options.force = true;
    }
    if (val === '--help') {
      console.log("OPTIONS:");
      console.log(" --episode 1,2,3   update episodes 1, 2 and 3");
      console.log(" --except 1,2,3    update everything but episodes 1, 2 and 3");
      console.log(" --limit 10        update only the first 10 update-worthy episodes");
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