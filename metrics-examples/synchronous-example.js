var os = require('os');

module.exports.measure = function(measurement){

    // Synchronous example
    measurement.data =  os.cpus()[0].speed;
    measurement.isDone();
};