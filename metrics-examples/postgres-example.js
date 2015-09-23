
var os = require('os');
var pg = require('pg');

module.exports.measure = function(measurement,metric) {

    var client = new pg.Client(
        'postgres://' +
        metric.config.db.user + ':' +
        metric.config.db.pass + '@' +
        metric.config.db.host + '/' +
        metric.config.db.database
    );
    client.connect(function(err) {
        if(err) {
            measurement.error = 'could not connect to postgres : ' + err;
            measurement.isDone();
        }
        client.query('SELECT NOW() AS "theTime"', function(err, result) {
            if(err) {
                measurement.error = 'error running query' + err;
                measurement.isDone();
            }

            //console.log(result.rows[0].theTime);
            measurement.data = result.rows[0].theTime;
            //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
            client.end();
            measurement.isDone();
        });
    });
};