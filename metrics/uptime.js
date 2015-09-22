var os = require('os');

module.exports.measure = function(measurement){
    // Synchronous example
     measurement.data = os.uptime();
     measurement.isDone();
};