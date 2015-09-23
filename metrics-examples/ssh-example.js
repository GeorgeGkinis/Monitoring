var os = require('os');
var SSH = require('simple-ssh');

module.exports.measure = function(measurement,metric) {

    // This is an asynchronous metric
    var ssh = new SSH(metric.config.ssh);

    ssh
        .exec('echo $PATH', {
            out: function (stdout) {
                measurement.path = stdout;
            }
        })
        .exec('ls', {
            out: function (stdout) {
                measurement.ll = stdout;
                //console.log(stdout);
            }
        })
        .on('end',function(){
            measurement.isDone();
        })
        .start();
};