var os = require('os');
var chokidar = require('chokidar');
var winston = require('winston');
var CronJob = require('cron').CronJob;

function Metric(codeFile,emitter,configuration) {

    var metric = this;

    // Logger creation
    metric.logger = new (winston.Logger)({ levels: configuration.logging.levels,silent:false});
    metric.logger.add(winston.transports.Console,{
        prettyPrint:true,
        colorize:true
    });

    // Load the configFile
    metric.loadConfig(codeFile.substr(0,codeFile.length-3)+'.json');

    //Console transport
    metric.logger.toConsole = new (winston.Logger)({ levels: configuration.logging.levels,level:'data',silent:false});
    metric.logger.toConsole.add(winston.transports.Console,{
        level:'data',
        colorize:true
    });

    //File transport
    metric.logger.toFile = new (winston.Logger)({ levels: configuration.logging.levels,level:'data',silent:false});
    metric.logger.toFile.add(winston.transports.File,{
        level:'data',
        filename: configuration.logFolder + metric.config.name + '.log',
        timestamp:false,
        json:false,
        showLevel:false
    });

    // Assume the configFile has the same name as the codeFile with .json extention.
    //TODO : Make no assumptions on configFile name
    this.config.configFile = codeFile.substr(0,codeFile.length-3)+'.json';


    // Remember who called
    this.config.codeFile = codeFile;

    // Attach the custom function for this metric
    this.measure = require(metric.config.codeFile).measure;


    // Cron job object
    this.job ={};

    // Set up watcher for this instances configFile.
    this.watcher = chokidar.watch(this.config.configFile, {
        persistent: true
        //,useFsEvents: true
        ,usePolling: true
        ,interval: 1000
    });

    // Reload config on file change
    this.watcher.on('change',function(path){
        metric.loadConfig(metric.config.configFile);
        metric.stop();
        metric.start();
    });
}


// These functions will be inherited among all Metric instances.
// Setup a reference to this objects prototype for clarity
var proto = Metric.prototype;


// Start measuring.
// We use a nested timer to be able to change the interval dynamically.
proto.start = function () {
    if (this.config.enabled === true) {
        this.job = new CronJob(this.config.schedule, this.callback, this);
        this.logger.info('Metric ' + this.config.name + ' started with schedule : ' + this.config.schedule);
        this.job.start();
    }
};

proto.stop = function() {
    this.job.stop();
    this.logger.info('Metric ' + this.config.name + ' stopped.');
};

proto.once = function() {
    this.callback(this);
};
// Callback which calls the measure function.
proto.callback = function(metric) {
    if (metric.config.enabled === true) {
        var measurement = {};
        measurement.isDone = function(){
            metric.isDone(metric,measurement);
        };
        measurement.origin = metric.config.name;
        measurement.timestamp = {};
        measurement.timestamp.start = new Date().toJSON();
        try {
            metric.measure(measurement);
        }catch(e){
            metric.logger.error('Code file is corrupt. Aborting! : ' + metric.config.codeFile);
            metric.stop();
        }
    }
};

// Reloads the config file associated with this instance.
proto.loadConfig = function(path) {
    try {
        delete require.cache[require.resolve(path)];
        this.config = require(path);
        this.logger.info('Configuration successfully loaded! : ' + path );
        this.logger.info(this.config);
    }catch (e) {
        this.logger.error('Configuration file is corrupt. Aborting! : ' + path);
    }

};

proto.isDone = function(metric,measurement){
            measurement.timestamp.stop = new Date().toJSON();
            measurement.isDone= true;
            if (metric.config.output.file == true) metric.logger.toFile.data(measurement);
            if (metric.config.output.console == true) metric.logger.toConsole.data(measurement);
            // if (metric.config.output.db == true) metric.logger.toDB.data(metric.measurements[i]);
        };

module.exports = Metric;
