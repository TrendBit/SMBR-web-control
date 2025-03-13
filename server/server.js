global.initialized = false;
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const favicon = require('serve-favicon');
const yaml = require('js-yaml');
const ajv = require('ajv'); //another json validator
const toml = require('toml');

//colors all error outputs RED and warn outputs in YELLOW
//colors all error outputs RED and warn outputs in YELLOW
import("chalk").then(chalk => {
    const originalError = console.error;
    console.error = (...args) => {
        originalError(chalk.default.red(...args));
    };
    const originalWarn = console.warn;
    console.warn = (...args) => {
        originalWarn(chalk.default.yellow(...args));
    };
});

const webConfigAssembler = require('./webConfigAssembler.js');
const readingLogger = require('./readingLogger.js');

const PORT = 80;
const indexUtilities = require('./indexUtilities.js');
const { default: def } = require('ajv/dist/vocabularies/applicator/additionalItems.js');
const { randomInt } = require('crypto');
const { uptime } = require('process');
const configFilesPath = path.join("..","..","SMBR-config-files");


//fixes the "TypeError: NetworkError when attempting to fetch resource" error by allowing anyone to use the api: 
app.use(cors()); 

//opens the ./public/ directory for outer connections
app.use(express.static(path.join(__dirname, 'public')));
app.use("/node_modules/chart.js",express.static(path.join(__dirname,'node_modules','chart.js')))
app.use("/node_modules/hammerjs",express.static(path.join(__dirname,'node_modules','hammerjs')))
app.use("/node_modules/chartjs-plugin-zoom",express.static(path.join(__dirname,'node_modules','chartjs-plugin-zoom')))
app.use("/node_modules/codemirror",express.static(path.join(__dirname,'node_modules','codemirror')))
app.use("/node_modules/@codemirror",express.static(path.join(__dirname,'node_modules','@codemirror')))



//sets the favicon resource
app.use(favicon(path.join(__dirname, 'public','UI','logo','favicon.png')));


app.use(express.text());
//starts the server on port PORT
app.listen(PORT);


app.set('views', './views');
app.set('view engine', 'ejs');

app.locals.getIcon = function(name) {
    switch(name){
        case "activate":
            return "./UI/icons/activate_icon.svg"
        case "board":
            return "./UI/icons/boards_icon.svg"
        case "bottle":
            return "./UI/icons/bottle_icon.svg"
        case "config":
            return "./UI/icons/config_icon.svg"
        case "controls":
            return "./UI/icons/controls_icon.svg"
        case "dashboard":
            return "./UI/icons/dashboard_icon.svg"
        case "experiments":
            return "./UI/icons/experiments_icon.svg"
        case "leds":
            return "./UI/icons/led_icon.svg"
        case "lightbulb":
            return "./UI/icons/lightbulb_icon.svg"
        case "logo":
            return "./UI/logo/logo_icon.svg"
        case "mini_logo":
            return "./UI/logo/PB_minilogo.svg"
        case "menu":
            return "./UI/icons/menu_icon.svg"
        case "save":
            return "./UI/icons/save_icon.svg"
        case "upload":
            return "./UI/icons/upload_icon.svg"
        case "search":
            return "./UI/icons/search_icon.svg"
        case "dot":
            return "./UI/icons/dot_icon.svg"
        case "temperature_ambient":
            return "./UI/icons/temperature_ambient_icon.svg"
        case "temperature":
            return "./UI/icons/temperature_icon.svg"
        case "trashbin":
            return "./UI/icons/trashbin_icon.svg"
        case "subElement":
            return "./UI/UI-elements/subElement.svg"
        case "subElement-last":
            return "./UI/UI-elements/subElement-last.svg"
        case "refresh":
            return "./UI/icons/refresh_icon.svg"
        default:
            return "./UI/logo/LogoPlaceholder.svg"
    }
}

app.locals.getColor = function(index) {
    colorArray=[
        "#9adb00",
        "#ffff00",
        "#ffa500",
        "#1d9ef5",
        "#ad270f",
        "#c0c1c1",
        "#642470"
    ]
    return colorArray[index%colorArray.length];
}




app.locals.getSubColor = function(index, degree) {
    return darkenHexColor(app.locals.getColor(index),degree*20);
}

function hexToRgb(hex) {
    hex = hex.replace(/^#/, ''); // Removes symbol # if it exists
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;

    return { r, g, b };
}

function darkenHexColor(hex, percent) {
    let { r, g, b } = hexToRgb(hex);

    r = Math.max(0, Math.min(255, r * (1 - percent / 100)));
    g = Math.max(0, Math.min(255, g * (1 - percent / 100)));
    b = Math.max(0, Math.min(255, b * (1 - percent / 100)));

    return rgbToHex(Math.round(r), Math.round(g), Math.round(b));
}


function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}


//API endpoint for the index file
app.get('/', (req, res) => {
    console.log(req.hostname + ": new connection active, rendering web");
    if(global.initialized ){
        res.render('index', webConfigAssembler.getConfig(req.hostname))
    }else{
        res.send("not initialized, try again later").status(109);
    }
    //res.render('index', indexUtilities.parseConfig())
    

    console.log(req.hostname + ": end of rendering web");
});


const allowedDirectories = {
    "experiments":{
        path: path.join(configFilesPath,"experiments")
    }
}


app.get('/temperature-graph', (req,res) => {
    const level = req.headers['logging-level'];
    if(level){
        var resCache = readingLogger.getTemperatureGraph(level);
        if(resCache!=[]){
            res.status(200).send(JSON.stringify(resCache));
            return;
        }
    }
    res.status(400).send("wrong logging level, please select between 1-3");
    
});

app.get('/temperature-graph-recent', (req,res) => {
    const level = req.headers['logging-level'];
    const lastReload = req.headers['last-reload'];
    if(level && lastReload){
        var resCache = readingLogger.getTemperatureGraphRecent(level,lastReload);
        if(resCache!=[]){
            res.status(200).send(JSON.stringify(resCache));
            return;
        }
    }
    res.status(400).send("wrong logging level, please select between 1-3");
    
});

app.get('/services-status',async (req,res) => {
    const util = require('util');
    const exec = util.promisify(require('child_process').exec);
    
    const services = [
        "telegraf.service",
        "reactor-can-watch.service",
        "reactor-script-api.service",
        "reactor-api-server.service",
        "reactor-core-module.service",
        "avahi-daemon.service",
        "avahi-daemon.socket"
    ];
    var serviceStats = {};
    const currentMillis = (new Date()).getTime();
    
    for(var index in services){
        const service = services[index];
        if(process.platform=="linux"){ 
            var stdObj;
            try {
                const command = "systemctl status "+service+" | grep Active | awk -F \";\" '{print $2}' | sed 's/ ago//'";
                stdObj = await exec(command);
            } catch (error) {
                console.error("Error while trying to check service uptime ("+service+"):",error.message);
                return;
            }           
            
            var uptime = stdObj.stdout + "";
            if(uptime.includes(service)){
                uptime = 0;
            }
            
            serviceStats[service] = {
                uptime: uptime,
                state: "to be done"
            }
            
            try {
                stdObj = await exec("systemctl show "+service+" --property='ActiveState' | awk -F= '{print $2}'")
            } catch (error) {
                console.error("Error while trying to check service state ("+service+"):",error.message);
                return;
            }  
            
            serviceStats[service].state = stdObj.stdout;
        }else{//just for debugging purposses
            serviceStats[service] = {
                uptime: randomInt(60)+"min " +randomInt(60)+"s",
            }
            
            switch (randomInt(3)) {
                case 0:
                    serviceStats[service].state = "active"
                    break;
                    case 1:
                        serviceStats[service].state = "inactive"
                        break;
                        default:
                            serviceStats[service].state = "activating"
                            break;
                        }
                    }
                    
                }    
                res.status(200).send(JSON.stringify(serviceStats));
            });
            
            
            
            
            

app.get('/module-list', (req, res) => {
    res.send(JSON.stringify(webConfigAssembler.getLoadedModules())).status(200);
})
app.get('/module-list-refresh',  async (req, res) => {
    
    res.send(JSON.stringify(await webConfigAssembler.getLoadedModulesRefresh())).status(200);
})

app.get('/fluoro-curve',(req, res) => {
    res.send(JSON.stringify(webConfigAssembler.getFluoroCurve())).status(200);
});




app.delete('/delete-file', async (req, res) => {
    const fileDir = req.headers['target-directory'];
    const fileName = req.headers['target-file'];
    

    if (fileName!=undefined && fileDir!=undefined) {
        if(allowedDirectories[fileDir]!=undefined){
            var files = undefined;
            try {
                files = fs.readdirSync(allowedDirectories[fileDir].path);
            } catch (error) {
                res.status(404).send("directory not found");
                return;
            }
            if(files.includes(fileName)){
                try {
                    fs.unlinkSync(path.join(allowedDirectories[fileDir].path,fileName));
                } catch (error) {
                    res.status(404).send("insufficient permisions");
                    return;
                }
    
                res.status(200).send("file deleted successfully");
                return;
            }else{
                res.status(404).send("file not found");
                return;
            }
        }
        else{
            res.status(403).send("you don't have permisions to view this directory");
            return;
        }
    }
    else {
        res.status(400).send("missing headers");
        return
        //console.log("unsuccessfull (400)\n----------------");
    }

})

app.get('/file-list', async (req, res) => {
    const fileDir = req.headers['target-directory'];

    if(allowedDirectories[fileDir]!=undefined){
        var files = undefined;
        try {
            files = fs.readdirSync(allowedDirectories[fileDir].path);
        } catch (error) {
            res.status(404).send("directory not found");
            return;
        }
        res.status(200).send(JSON.stringify(files));
        return;
    }
    else{
        res.status(403).send("you don't have permisions to view this directory");
        return;
    }
});

app.get('/read-file', async (req, res) => {
    const fileDir = req.headers['target-directory'];
    const file    = req.headers['target-file'];

    if(allowedDirectories[fileDir]!=undefined){
        var files = undefined;
        try {
            files = fs.readdirSync(allowedDirectories[fileDir].path);
        } catch (error) {
            res.status(404).send("directory not found");
            return;
        }
        if(files.includes(file)){
            var fileData = "";
            try {
                fileData = fs.readFileSync(path.join(allowedDirectories[fileDir].path,file),'utf8');
            } catch (error) {
                res.status(404).send("file cannot be opened");
                return;
            }

            res.status(200).send(fileData);
            return;
        }else{
            res.status(404).send("file not found");
            return;
        }
    }
    else{
        res.status(403).send("you don't have permisions to view this directory");
        return;
    }
});

app.post('/send-file', (req, res) => {
    const fileDir = req.headers['target-directory'];
    const fileName = req.headers['target-file'];
    const maxBodySize = 50000;
    
    const textEncoder = new TextEncoder();
    if(textEncoder.encode(req.body).length > maxBodySize){
        res.status(413).send("body too large (max size: "+maxBodySize+" bytes)");
        return
    }
    //console.log("send-file api activated\n----------------\nfileDir: "+fileDir+"\nfileName: "+fileName);
    if(fileName!=undefined && fileDir!=undefined){
        if(allowedDirectories[fileDir]!=undefined){
            var fileData = "";
            if(req.body != undefined){
                fileData = req.body;
            }


            var validation = {result: 1};
            var inputParsed = "";
            try{
                inputParsed = yaml.load(fileData);
            }
            catch{
                res.status(422).send("[{\"criticalError\": \"file is not parsable to yaml\"}]");
                return
            }
            var validationTarget = "";
            if(fileDir == "experiments"){
                validationTarget = "experiments_schema.yaml";
            }
            else{
                const fileNameSplit= fileName.split(".");
                const fileExtension =  fileNameSplit.pop();
                validationTarget = fileNameSplit.join(".") + "_schema." + fileExtension; "test.yaml > test_schema.yaml";
            }
            
            if(fs.existsSync(path.join(configFilesPath, "schemas", validationTarget))){
                
                validation = validateFile(
                    inputParsed, 
                    parseFileToJson(path.join(configFilesPath, "schemas", validationTarget))
                )
                if(validation.result){
                    fs.writeFileSync("./"+fileDir + "/" +fileName, fileData);
                    res.status(200).send("file transfer successfull");
                    return
                }else{
                    res.status(422).send(JSON.stringify(validation.errors));
                    return
                }        
            }
            else{
                console.log("no validation file for ", validationTarget);
                fs.writeFileSync("./"+fileDir + "/" +fileName, fileData);
                res.status(200).send("file transfer successfull");
                return
            }

                
        }
        else{
            res.status(403).send("you don't have permisions to write to this directory");
            return
        }
    }
    else{
        res.status(400).send("missing headers");
        return
    }
    
})
app.post('/create-file', (req, res) => {
    const fileDir = req.headers['target-directory'];
    const fileName = req.headers['target-file'];
    const maxBodySize = 50000;

    //console.log("send-file api activated\n----------------\nfileDir: "+fileDir+"\nfileName: "+fileName);
    if(fileName){
        if(allowedDirectories[fileDir]!=undefined){
            fs.writeFileSync(path.join(allowedDirectories[fileDir].path,fileName), "");
            res.status(200).send("file creation successfull");               
        }
        else{
            res.status(403).send("you don't have permisions to write to this directory");
            return
        }
    }
    else{
        res.status(400).send("missing headers");
        return
    }
    
})


/*
    returns
    {
    "test": <random whole number between 0-1000>,
    "input": <nothing>
    }
*/


app.get('/test-get', (req, res) => {
    const count = getRandWholeNum(0,1000);
    res.status(200).send({value: ""+(count)});
});

app.post('/test-post',(req, res) => {
    console.log(req);
});


app.get('/test-combined', (req, res) => {
    console.log("get-test", req.header("Content-Type"));
    fs.writeFile('Output.json', "{\"head\":"+JSON.stringify(req, censor(req)) + ",\"response\":" + JSON.stringify(res, censor(res)) + "}", (err) => {
        // In case of a error throw err.
        if (err) throw err;
    })
    
    switch(req.header("Content-Type")){
        case "application/json":
            res.status(200).send("GET");
            break;
        case "text/html":
            res.status(200).send("OK");
            break;
        default:
            res.status(406).send("406");
            return
    }
    
    
});



app.post('/test-combined', (req, res) => {
    console.log("post-test, writing to file");
    fs.writeFile('Output.json', "{\"head\":"+JSON.stringify(req, censor(req)) + ",\"response\":" + JSON.stringify(res, censor(res)) + "}", (err) => {
        // In case of a error throw err.
        if (err) throw err;
    })
    res.status(200).send("post");
});
app.delete('/test-combined', (req, res) => {
    console.log("get-test");
    res.status(200).send("delete");
});
app.put('/test-combined', (req, res) => {
    console.log("get-test");
    res.status(200).send("put");
});
app.patch('/test-combined', (req, res) => {
    console.log("get-test");
    res.status(200).send("patch");
});


app.get('/timeout-test', (req, res) => {
})





//returns a random rounded number between the lower and upper limit
function getRandWholeNum(lower, upper){
    return Math.round(lower + Math.random()*upper);
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


function parseFileToJson(filePath){
    var fileData = "";
    try {fileData = fs.readFileSync(filePath);} catch (error) {
        console.error("error while trying to read the config file","("+filePath+")",error);
        return {};
    }
    const fileType = filePath.split(".").pop();

    var fileDataParsed = {};
    switch(fileType){
        case "yaml":
            try {
                fileDataParsed = yaml.load(fileData);
            } catch (error) {
                console.error("error while trying to parse a TOML config file","("+filePath+")",error);
                return {};
            }
            break;
        case "toml":
            try {
                fileDataParsed = toml.parse(fileData);
            } catch (error) {
                console.error("error while trying to parse a TOML config file","("+filePath+")",error);
                return {};
            }
            break;
        default:
            console.error("invalid fileType in configs: ",fileType,"("+filePath+")");
            return {};
    }
    return fileDataParsed;
}



/*
returns
{result: 0, errors: []} = file is invalid
{result: 1} = file is valid
*/
function validateFile(fileDataParsed, jsonSchemaDataParsed){
    const ajv_worker = new ajv({allErrors: true});
    const validate = ajv_worker.compile(jsonSchemaDataParsed);
    if(validate(fileDataParsed)){
        return {result: 1};
    }
    else{
        return {result: 0, errors: validate.errors};
    }
}