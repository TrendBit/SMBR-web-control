const fs = require('fs');
const toml = require('toml');
module.exports = {
    parseConfig: function () {
      try{
        var data = fs.readFileSync('./configs/dashboard-config.toml', 'utf8');
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
      config.Editor = {
        "experiments": fs.readdirSync("./experiments/"),
        "configs": fs.readdirSync("./configs/")
      };
      return config;
    },    
};



