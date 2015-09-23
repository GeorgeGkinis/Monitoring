var os = require('os');
var chokidar = require('chokidar');
var winston = require('winston');
require('winston-mongodb').MongoDB;
var CronJob = require('cron').CronJob;

function Metric(codeFile,emitter,configuration,db) {

    var metric = this;

    this.db = db;
    // Logger creation
    metric.logger = new (winston.Logger)({ levels: configuration.logging.levels});
    metric.logger.add(winston.transports.Console,{
        name:'console',
        prettyPrint:true,
        colorize:true
    });

    // Load the configFile
    metric.loadConfig(codeFile);

    metric.logger.add(winston.transports.File,{
        name:'file',
        filename: configuration.logFolder + metric.config.name + '.log',
        timestamp:false,
        json:false,
        showLevel:true
    });

    metric.logger.add(winston.transports.MongoDB,{
        name:'db',
        db: configuration.database.type + '://' + configuration.database.address + ':'+'27017'+ '/metrics',
        collection:metric.config.name
    });

    metric.dataLogger = new (winston.Logger)({ levels: configuration.logging.levels});
    metric.dataLogger.add(winston.transports.Console,{
        name:'console',
        //silent: true,
        level : 'data',
        prettyPrint:true,
        colorize:true
    });
    metric.dataLogger.add(winston.transports.File,{
        name:'file',
        level : 'data',
        filename: configuration.logFolder + metric.config.name + '.log',
        timestamp:false,
        json:false,
        showLevel:true
    });

    metric.dataLogger.add(winston.transports.MongoDB,{
        name:'db',
        level : 'data',
        db: configuration.database.type + '://' + configuration.database.address + ':'+'27017'+ '/metrics',
        collection:metric.config.name
    });

    // Attach the custom function for this metric
    try {
        this.measure = require(metric.config.codeFile).measure;
    }catch(e){
        metric.logger.eror('Code file is corrupt. Aborting! : ' + metric.config.codeFile);
    }


    // Cron job object
    this.job ={};

    // Set up watcher for this instances configFile.
    this.watcher = chokidar.watch(this.config.configFile, {
        persistent: true,
        //,useFsEvents: true
        usePolling: true,
        interval: 1000
    });

    // Reload config on file change
    this.watcher.on('change',function(path){
        metric.loadConfig(codeFile);
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

        this.logger.info('Metric ' + this.config.name + ' started with schedule : ' + this.config.schedule);
        this.job = new CronJob(this.config.schedule, this.callback, this);
        this.job.start();

        if (this.config.output.hasOwnProperty("console")) this.dataLogger.transports.console.silent = !this.config.output.console;
        if (this.config.output.hasOwnProperty("file")) this.dataLogger.transports.file.silent = !this.config.output.file;
        if (this.config.output.hasOwnProperty("db")) this.dataLogger.transports.db.silent = !this.config.output.db;
    }
};

proto.stop = function() {
    if (this.job.__proto__.hasOwnProperty('stop')) {
        this.job.stop();
        this.logger.info('Metric ' + this.config.name + ' stopped.');
    }
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
            metric.measure(measurement,metric);
        }catch(e){
            metric.logger.error('Code file is corrupt. Aborting! : ' + metric.config.codeFile);
            metric.stop();
        }
    }
};

// Reloads the config file associated with this instance.
proto.loadConfig = function(codeFile) {
    var configFile = codeFile.substr(0,codeFile.length-3)+'.json';
    //Empty the configuration file from cache to actually reload.
    try {
        delete require.cache[require.resolve(configFile)];
    }catch (e) {
        this.logger.warn('Cannot remove file from cache!');
    }

    try {
        this.config = require(configFile);
        this.config.configFile = configFile;
        this.config.codeFile = codeFile;
        this.logger.info('Configuration successfully loaded! : ' + configFile );
        this.logger.info(this.config);
    }catch (e) {
        this.logger.error('Configuration file is corrupt. Aborting! : ' + configFile);
    }
};

proto.isDone = function(metric,measurement){
    measurement.timestamp.stop = new Date().toJSON();
    delete measurement.isDone;
    metric.dataLogger.data(JSON.stringify(measurement));
};

module.exports = Metric;
