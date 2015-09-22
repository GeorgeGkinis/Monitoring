/*
 - Metric module
 TODO: On event insert event in DB
 */

var fs = require('fs');
//var EventEmitter = require('events');
var Metric = require('./Metric-cron');
var winston = require('winston');

var Db = require('tingodb')().Db,
    assert = require('assert');




var MetricsManager = function(){

    var self = this;

    //this.emitter = new EventEmitter();

    // Load configuration
    this.configuration = require('./config.json');

    // Create DB instance
    this.db = new Db(self.configuration.dbFolder, {});

    // Fetch a collection to insert document into
    this. collection = self.db.collection("batch_document_insert_collection_safe");
// Insert a single document
    self.collection.insert([{hello:'world_safe1'}
        , {hello:'world_safe2'}], {w:1}, function(err, result) {
        assert.equal(null, err);

        // Fetch the document
        self.collection.findOne({hello:'world_safe2'}, function(err, item) {
            assert.equal(null, err);
            assert.equal('world_safe2', item.hello);
            console.log(item);
        })
    });

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
        var metric = new Metric(self.configuration.metricsFolder + self.metricFiles[i], self.emitter,self.configuration);

        // Add metric reference to array of metrics
        self.metrics.push(metric);
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




