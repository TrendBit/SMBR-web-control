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
        module_type: "unknown",
        uid: "0x00000000000000000"
    }
];
var assembledConfig = "";

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





function deepMerge(target, source) {

    for (const key in source) {
        if (Array.isArray(source[key])) {
            if (Array.isArray(target[key])) {
                let mergedArray = [...target[key]];
                Object.assign(mergedArray, source[key]);
                target[key] = [...new Set(mergedArray.concat(source[key]))];
            } else {
                target[key] = source[key];
            }
        } else if (source[key] instanceof Object && !Array.isArray(source[key])) {
            target[key] = target[key] || {};
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
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
                }
                assembledConfig = deepMerge(configComponent, assembledConfig);
                    
                break;
            
            default:
                break;
        }
    });

    assembledConfig = deepMerge(moduleConfig, assembledConfig);

    fs.writeFileSync("webConfig.yaml",yaml.dump(assembledConfig));
}
