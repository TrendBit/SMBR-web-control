const fs = require('fs');
const yaml = require('js-yaml');
const axios = require('axios');
const { networkInterfaces } = require('os');

var loadedModules = [
    {
        module_type: "debug",
        uid: "0x00000000000000000"
    }
];
var assembledConfig = {};

const allwaysRebuildConfig = false;

var localIP = "";

var fluoroCurve  = {};

function reloadFluoroCurve(){
    try {
        console.log("loading fluoro curve");
        const fluoroCurveString = fs.readFileSync("./storage/FluoroCurve.json");
        fluoroCurve = JSON.parse(fluoroCurveString);
    } catch (error) {
        console.error("CANNOT LOAD FLUORO CURVE!");
    }
}

function refetchFluoroCurve(){

}


async function initialize() {
    //const nets = networkInterfaces();
    //const results = [];
    console.log("looking for apiServer");
    try {
        console.log("  trying ","http://"+"127.0.0.1"+":8089/system/modules")
        const response = await axios.get("http://"+"127.0.0.1"+":8089/system/modules", {timeout: 5000});
        console.log("    API DETECTED");  
        localIP = "127.0.0.1";
    } catch (error) {
        console.log("    no api");  
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
    reloadFluoroCurve();
}
initialize()




setInterval(reloadModules, 15000);

var lastConfigRefresh = new Date(0);

module.exports = {
    getConfig: function(reqHostname) {
        var currTime = new Date();
        if((currTime.getTime() - lastConfigRefresh.getTime()) > 30000 || allwaysRebuildConfig){
            lastConfigRefresh = currTime;
            buildWebConfig();
        }
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

//reloadModules();




var unsuccessfullReloads = 0;
async function reloadModules(){
    if(!localIP){
        if(unsuccessfullReloads++ >= 20){
            unsuccessfullReloads = 0;
            initialize();
        }else{
            console.warn("unsuccessfullReloads: ",unsuccessfullReloads,"/20");
        }
        return 
    }
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
            localIP = "";
            throw new Error({code:response.status});
        }
    } catch (error) {
        console.error("Error while loading module list, code: ", error.code, "more info in server/errorDump.log");
        fs.writeFileSync("errorDump.log",JSON.stringify(error));
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
                    unit: "%",
                    //port: 80,
                    resource: "/"+element.module_type+"/board_temp",
                    /*resource: "/"+element.module_type+"/ping",*/
                    component: "temperature"
                },
                {
                    unit: "°C",
                    //port: 80,
                    resource: "/"+element.module_type+"/load", 
                    /*resource: "/"+element.module_type+"/ping",*/
                    component: "load"
                }
            ]
        });


        
        switch (element.module_type) {
            //prepared for future modules with different prerequisites
            case "debug":
            case "sensor":
            case "core":
            case "control":
                var configComponent = "";
                var loaded = false;
                try {
                    console.log("loading \"web_config_components/"+element.module_type+".yaml\"");
                    const configComponentUnfinished = fs.readFileSync("web_config_components/"+element.module_type+".yaml", 'utf8')
                                                        .replace("{{module}}",element.uid);
                    
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
    });

    deepMerge(moduleConfig, assembledConfig);

    fs.writeFileSync("webConfig.yaml",yaml.dump(assembledConfig));
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
