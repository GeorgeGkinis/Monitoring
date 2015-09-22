/*
 - Metric module
 TODO: On event insert event in DB
 */

var fs = require('fs');
//var EventEmitter = require('events');
var Metric = require('./Metric-cron');
var winston = require('winston');
require('winston-mongodb').MongoDB;




var MetricsManager = function(){

    var self = this;

    //this.emitter = new EventEmitter();

    // Load configuration
    this.configuration = require('./config.json');

    var sep = function() { console.log('\n============================================================\n');}

    sep();
    console.log('Configuration loaded : \n');
    console.log(self.configuration);
    sep();

    // Read metrics folder and filter all .js files
    this.metricFiles = fs.readdirSync(self.configuration.metricsFolder);
    this.metricFiles = self.metricFiles.filter(function(file) { return file.substr(-3) === '.js'; });
    console.log('Files found : '+ self.metricFiles);
    sep();


// Initialise metrics array to contain all metric objects
    this.metrics = [];

// Instantiate metrics in 'metricsFolder' and fill the metrics array
    for (i=0;i<self.metricFiles.length;i++) {
        // Instantiate metric
        try {
            var metric = new Metric(self.configuration.metricsFolder + self.metricFiles[i], self.emitter, self.configuration, self.db);

            // Add metric reference to array of metrics
            self.metrics.push(metric);
        }catch(e){
            console.log(e);
        }
        sep();
    }


// Start all metrics
    this.startAll = function() {
        for (i = 0; i < self.metrics.length; i++) {
            self.metrics[i].start();
        }
    };
// Stop all metrics
    this.stopAll = function() {
        for (i = 0; i < self.metrics.length; i++) {
            self.metrics[i].stop();
        }
    };
// Run all metrics once
    this.onceAll = function(){
        for (i = 0; i < self.metrics.length; i++) {
            self.metrics[i].once();
        }
    }
};


module.exports = new MetricsManager();