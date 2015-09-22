var os = require('os');

module.exports.measure = function(){
     return os.uptime();
};