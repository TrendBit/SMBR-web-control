const fs = require('fs');
const yaml = require('js-yaml');
const axios = require('axios');


var loadedModules = [];
if(global.SMBR_debugMode){
    loadedModules = [
        {
            module_type: "debug",
            uid: "0x00000000000000000",
            instance: "Virtual"
        }
    ];
}


var assembledConfig = {};

const allwaysRebuildConfig = false;

var connectedToApi = false;

var fluoroCurve  = {};


function initialize() {
    console.log("looking for apiServer");
    console.log("  trying http://127.0.0.1:8089/system/modules")
    axios.get("http://"+"127.0.0.1"+":8089/system/modules", {timeout: 500})
    .then( res => {
        console.log("    API DETECTED");  
        connectedToApi = true;
        loadedModules = [];
        reloadModules();
    })
    .catch( err => {
        console.log("    no api");  
        console.error("could not connect to API (http://127.0.0.1:8089/system/modules returned code:",err.code,")");
        connectedToApi = false;
        buildWebConfig();
    })
    .finally(() => {
        if (!global.initialized){
            setInterval(reloadModules, 15000);
            global.initialized = true;
        }
    })
}
initialize()

var lastConfigRefresh = new Date(0);

module.exports = {
    getConfig: function(reqHostname) {
        var currTime = new Date();
        if((currTime.getTime() - lastConfigRefresh.getTime()) > 30000 || allwaysRebuildConfig){
            lastConfigRefresh = currTime;
            buildWebConfig();
        }
        return assembledConfig;
    },
    getLoadedModules: function() {
        return loadedModules;
    },
    getLoadedModulesRefresh: async function() {
        unsuccessfullReloads = 500000;
        await reloadModules();
        return loadedModules;
    },
    getFluoroCurve: function() {
        return fluoroCurve;
    }
}




var unsuccessfullReloads = 0;
async function reloadModules(){
    if(!connectedToApi){
        if(unsuccessfullReloads++ >= 10){
            unsuccessfullReloads = 0;
            initialize();
        }else{
            console.warn("unsuccessfullReloads: ",unsuccessfullReloads,"/10");
        }
        return 
    }
    try {
        const response = await axios.get('http://'+"127.0.0.1"+':8089/system/modules', {});
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
            connectedToApi = false;
            throw new Error({code:response.status});
        }
    } catch (error) {
        console.error("Error while loading module list, code: ", error.code);
    }
    
        
}




/*
    merges source into target rewriting existing entries in target
    breaks often because of javascript objects etc. allways check first if something goes wrong
*/
function deepMerge(source, target, tabs="", debug=false){
    for(var key in source){
        if(debug)console.log("\x1b[0;36m"+tabs+"merging "+key+":"+source[key]+" type:"+(typeof source[key])+"    to      "+key+":"+target[key]+" type:"+(typeof target[key])+"   \x1b[0m");
        switch (typeof source[key]) {
            case "string":
            case "number":
                if(debug)console.log(tabs+"1    setting "+key+":"+target[key]+"  to  "+source[key]);
                target[key] = source[key];
                break;

            case "object":
                if(source[key] == null){
                    if(debug)console.log(tabs+"5    skipping "+key+":"+source[key]);
                    break;
                }
                if(target[key] == undefined || target[key] == null){
                    if(debug)console.log(tabs+"2    adding "+key+":"+source[key]);
                    target[key] = structuredClone(source[key]);
                    break;
                }
                if(Array.isArray(source[key])){
                    if(debug)console.log(tabs+"3    working with target array: ["+target[key]+"]");
                    for(var i = 0; i < source[key].length; i++){
                        if(debug)console.log(tabs+"4    pushing "+source[key][i]+" type:"+(typeof source[key][i]));
                        target[key].push(source[key][i]);
                    }

                }else{
                    deepMerge(source[key],target[key],tabs+"    ");
                }
                break;
        
            default:
                if(debug)console.log(tabs+"5    setting "+key+":"+source[key]);
                target[key] = structuredClone(source[key]);
                break;
        }
    }
    return target;
}



/*
first, it creates a json object that contains the configs for module list, based of currently loaded modules
then it adds all of the config components and replaces the inner attribues with their respective module identifier
*/
function buildWebConfig(){
    loadedModules.sort( (a,b) => {
        var enumaratedType={
            "undefined"      : 0,
            "all"            : 1,
            "any"            : 2,
            "test"    : 3,
            "core"    : 4,
            "control" : 5,
            "sensor"  : 6
        }

        var aVal=enumaratedType[a.module_type]
        if(aVal==undefined){
            aVal=-1;
        }
        var bVal=enumaratedType[b.module_type]
        if(bVal==undefined){
            bVal=-1;
        }

        return aVal-bVal;
    });
    console.debug("\nbuilding a new web config file...\n"+
        "loaded modules: \n"
        +yaml.dump(loadedModules));



    var moduleConfig = {
        "DevicePanel":{
            "modules":[
            ]
        }
    };

    assembledConfig = {};
    var loadedModuleTypes={};
    loadedModules.forEach(element => {
        moduleConfig.DevicePanel.modules.push({
            name: element.module_type,
            id: element.uid,
            instance: element.instance,
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
                    //port: 80,
                    resource: "/"+element.module_type+"/board_temp",
                    /*resource: "/"+element.module_type+"/ping",*/
                    component: "temperature"
                },
                {
                    unit: "%",
                    //port: 80,
                    resource: "/"+element.module_type+"/load", 
                    'outputMultiplier': 100,
                    /*resource: "/"+element.module_type+"/ping",*/
                    component: "load"
                }
            ]
        });
        if(loadedModuleTypes[element.module_type] == undefined){
            loadedModuleTypes[element.module_type]="loaded";
            switch (element.module_type) {
                //prepared for future modules with different prerequisites
                case "debug":
                case "sensor":
                case "core":
                case "control":
                    var configComponent = "";
                    var loaded = false;
                    try {
                        console.debug("loading \"web_config_components/"+element.module_type+".yaml\"");
                        const configComponentUnfinished = fs.readFileSync("web_config_components/"+element.module_type+".yaml", 'utf8');
    
                        configComponent = yaml.load(configComponentUnfinished);
                        loaded = true;
                    } catch (error) {
                        if(assembledConfig.Errors == undefined){
                            assembledConfig.Errors = [];
                        }
                        assembledConfig.Errors.push({
                            description:"unable to load \"web_config_components/"+element.module_type+".yaml\""
                        });
                        
                        console.error("unable to load \"web_config_components/"+element.module_type+".yaml\", skipping...")
                    }
                    if(loaded){
                        deepMerge(configComponent, assembledConfig);
                    }
                                       
                    break;
                
                default:
                    console.error("unknown module, cannot find \"web_config_components/"+element.module_type+".yaml\"")
                    break;
            }
        }else{
            console.debug("skipping \"web_config_components/"+element.module_type+".yaml\"");
        }
    });

    deepMerge(moduleConfig, assembledConfig);

    //fs.writeFileSync("webConfig.yaml",yaml.dump(assembledConfig));
}

function censor(censor) {
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
