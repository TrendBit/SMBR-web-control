const fs = require('node:fs');
const yaml = require('js-yaml');
const axios = require('axios');
const { networkInterfaces } = require('os');

var loadedModules = [
    {
        module_type: "control",
        uid: "0x00000000000000000"
    },
    {
        module_type: "loljuhi",
        uid: "0x00000000004500000"
    },
    {
        module_type: "unknown",
        uid: "0x00000000000000000"
    }
];
var assembledConfig = {};

var localIP = "";




async function initialize() {
    const nets = networkInterfaces();
    const results = [];
    console.log("looking for apiServer");
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
            const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
            if (net.family === familyV4Value) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }

    for (const name of Object.keys(results)) {
        const element = results[name];
        try {
            console.log("  trying ","http://"+element[0]+":8089/system/modules")
            const response = await axios.get("http://"+element[0]+":8089/system/modules", {});
            console.log("  ",element, " API DETECTED");  
            localIP = element[0];
        } catch (error) {
            console.log("  ",element, " no api");  
        }
    }

    if(!localIP){
        console.error("api is not connected");
        buildWebConfig();
    }
    else{
        loadedModules = [];
        reloadModules();
    }

    
    global.initialized = true;
}
initialize()




setInterval(reloadModules, 15000);

module.exports = {
    getConfig: function(reqHostname) {
        buildWebConfig();
        try {
            const result = yaml.load(fs.readFileSync("webConfig.yaml"));    
            return result;
        } catch (error) {
            console.error(reqHostname+": error while trying to read the config file, sending an empty one");
            return {Errors: [
                {
                    description: "unable to build web config, check your configuration and try again"
                }
            ]};
        }
    },
    getLoadedModules: function() {
        return loadedModules;
    }
}

//reloadModules();





async function reloadModules(){
    try {
        const response = await axios.get('http://'+localIP+':8089/system/modules', {});
        if(response.status == 200){
            var change = false;
    
            response.data.forEach(element => {
                const loaded = loadedModules.some(module => module.uid === element.uid);
                if(!loaded){
                    console.log("loading a new module: ", element);
                    loadedModules.push(element);
                    change=true;
                }
            });
    
            if(change){
                console.warn("changes in configuration detected");
                buildWebConfig();
            }
            }
            else{
            throw new Error({code:response.status});
        }
    } catch (error) {
        console.error("Error while loading module list, code: ", error.code, "more info in server/errorDump.log");
        fs.writeFileSync("errorDump.log",JSON.stringify(error));
    }
    
    
}




/*
    merges source into target rewriting existing entries in target
*/
function deepMerge(source, target){
    for (const [key, value] of Object.entries(source)){
        if(Array.isArray(value)){
            if(Array.isArray(target[key])){
                target[key] = target[key].concat(value);
            }else{
                target[key] = value;
            }
        }else if(value instanceof Object){
            if(target[key]){
                deepMerge(source[key], target[key]);
            }
            else{
                target[key] = source[key];
            }
        }else{
            target[key] = value;
        }
    }
  }



/*
first, it creates a json object that contains the configs for module list, based of currently loaded modules
then it adds all of the config components and replaces the inner attribues with their respective module identifier
*/
function buildWebConfig(){
    console.log("\nbuilding a new web config file...\n"+
        "loaded modules: \n"
        +yaml.dump(loadedModules));

    var moduleConfig = {
        "DevicePanel":{
            "modules":[
            ]
        }
    };

    assembledConfig = {};

    loadedModules.forEach(element => {
        moduleConfig.DevicePanel.modules.push({
            name: element.module_type,
            id: element.uid,
            instance: "unidentified",
            data:[
                {
                    unit: "ms",
                    resource: "/"+element.module_type+"/ping",
                    component: "time_ms"
                },
                {
                    unit: "°C",
                    resource: "/"+element.module_type+"/core_temp",
                    component: "temperature"
                },
                {
                    unit: "°C",
                    port: 80,
                    resource: "/test-get", 
                    /*resource: "/"+element.module_type+"/ping",*/
                    component: "value"
                },
                {
                    unit: "%",
                    port: 80,
                    resource: "/test-get",
                    /*resource: "/"+element.module_type+"/ping",*/
                    component: "value"
                }
            ]
        });


        
        switch (element.module_type) {
            //prepared for future modules with different prerequisites
            case "control":
                var configComponent = "";
                try {
                    console.log("loading \"web_config_components/control.yaml\"");
                    const configComponentUnfinished = fs.readFileSync("web_config_components/control.yaml", 'utf8')
                                                        .replace("{{module}}",element.uid);
                    
                    configComponent = yaml.load(configComponentUnfinished);
                } catch (error) {
                    console.error("error while loading, skipping...");
                    if(!assembledConfig.Errors){
                        assembledConfig = {Errors: []}
                    }
                    assembledConfig.Errors.push({
                        description:"unable to load \"web_config_components/control.yaml\""
                    });
                    
                    console.error("unable load \"web_config_components/",element.module_type,".yaml\"")
                }

                deepMerge(configComponent, assembledConfig);
                
                    
                break;
            
            default:
                console.error("unable load \"web_config_components/",element.module_type,".yaml\"")
                break;
        }
    });

    deepMerge(moduleConfig, assembledConfig);

    fs.writeFileSync("webConfig.yaml",yaml.dump(assembledConfig));
}

function censor(censor) { //stolen from https://stackoverflow.com/questions/4816099/chrome-sendrequest-error-typeerror-converting-circular-structure-to-json/9653082#9653082
    var i = 0;
    
    return function(key, value) {
      if(i !== 0 && typeof(censor) === 'object' && typeof(value) == 'object' && censor == value) 
        return '[Circular]'; 
      
      if(i >= 29)
        return '[Unknown]';
    
      ++i;

      return value;  
    }
  }
