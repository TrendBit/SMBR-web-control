
module.exports = {
    parseConfig: function () {
      try{
        var data = fs.readFileSync('./configs/test-config.toml', 'utf8');
        //console.log(data);
      } catch (err){
        console.error("unable to read config file\n------------------------------------\n" + err);
      }

      var config = null;
      try {
        var config = toml.parse(data);
      } catch (e) {
        console.error("Parsing error on line " + e.line + ", column " + e.column +  ": " + e.message);
      }
      
      //console.log(config);
      return config;
    },
};
const fs = require('node:fs');
const toml = require('toml');

