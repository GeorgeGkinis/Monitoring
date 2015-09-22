var os = require('os');
var chokidar = require('chokidar');
var winston = require('winston');
var CronJob = require('cron').CronJob;

function Metric(codeFile) {

    var metric = this;

    // Remember who called
    this.codeFile = codeFile;

    // Assume the configFile has the same name as the codeFile with .json extention.
    //TODO : Make no assumptions on configFile name
    this.configFile = this.codeFile.substr(0,this.codeFile.length-3)+'.json';

    // Load the configFile
    this.config = require(this.configFile);

    // Attach the custom function for this metric
    this.measure = require(codeFile).measure;

    // Cron job object
    this.job ={};

    // Set up watcher for this instances configFile.
    this.watcher = chokidar.watch(this.configFile, {
        persistent: true
        //,useFsEvents: true
        ,usePolling: true
        ,interval: 1000
    });

    // Reload config on file change
    this.watcher.on('change',function(path){
        metric.loadConfig(metric.configFile);
    });

}


// These functions will be inherited among all Metric instances.
// Setup a reference to this objects prototype for clarity
var proto = Metric.prototype;


// Start measuring.
// We use a nested timer to be able to change the interval dynamically.
proto.start = function () {
    this.job =  new CronJob(this.config.schedule, this.callback, this);
    this.job.start();
};

proto.stop = function() {
    this.job.stop();
};

proto.once = function() {
    this.callback(this);
};
// Callback which calls the measure function.
proto.callback = function(metric) {
    if (metric.config.enabled)  {
        var measurement = {};
        measurement.origin = metric.config.name;
        measurement.timestamp = {};
        measurement.timestamp.start = new Date().toJSON();
        measurement.data = metric.measure();
        measurement.timestamp.stop = new Date().toJSON();
        if (metric.config.output.file == true) metric.logger.toFile.data(measurement);
        if (metric.config.output.console == true) metric.logger.toConsole.data(measurement);
        // if (metric.config.output.db == true) metric.logger.toDB.data(measurement);
    }
};

// Reloads the config file associated with this instance.
proto.loadConfig = function(path) {
    this.logger.info('Configuration changed! : ' + path);
    delete require.cache[require.resolve(path)];
    this.config = require(this.configFile);
    this.stop();
    this.start();
};

module.exports = Metric;