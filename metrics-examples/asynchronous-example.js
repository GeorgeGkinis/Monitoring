var os = require('os');

module.exports.measure = function(measurement){
 // Asynchronous example
    setTimeout(
        function(){
            measurement.cpuSpeedAsync =  os.cpus()[0].speed;

            // isDone should be invoked from within the callback
            measurement.isDone();
        },3000);
};