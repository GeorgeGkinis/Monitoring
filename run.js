
var MetricsManager = require('./MetricsManager-cron');

var M = new MetricsManager('./configuration-example.json');

// Run each specified metric once.
// Handy for performing Daily checks!
M.once("synchronous-example");
M.once("asynchronous-example");
M.once("ssh-example");
M.once("postgres-example");

// Start specific metrics using the cron library
M.start("synchronous-example");
M.start("asynchronous-example");

// Stop it after 5 seconds
setTimeout(function(){
    M.stop("synchronous-example");
    M.stop("asynchronous-example")},5000);
