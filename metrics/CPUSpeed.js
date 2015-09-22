var os = require('os');

module.exports.measure = function(){
    return os.cpus()[0].speed;
};