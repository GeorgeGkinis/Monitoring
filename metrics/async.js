var os = require('os');

module.exports.measure = function(measurement){
 // Asynchronous example
    setTimeout(
        function(){
            measurement.data =  os.cpus()[0].speed;
            measurement.isDone();
        },3000);
};