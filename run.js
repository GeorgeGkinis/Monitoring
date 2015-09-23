
var MetricsManager = require('./MetricsManager-cron');

var M = new MetricsManager('./configuration-example.json');
//M.once("ssh-example");
M.once("postgres-example");
//osStats.startAll();
