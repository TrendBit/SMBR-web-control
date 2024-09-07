const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const fs = require('node:fs');
const favicon = require('serve-favicon');
const yaml = require('js-yaml');
const ajv = require('ajv'); //another json validator
const toml = require('toml');


const PORT = 80;
const indexUtilities = require('./indexUtilities.js');
const { default: def } = require('ajv/dist/vocabularies/applicator/additionalItems.js');
const configFilesPath = path.join("..","..","SMBR-config-files");

//fixes the "TypeError: NetworkError when attempting to fetch resource" error by allowing anyone to use the api: 
app.use(cors()); 

//opens the ./public/ directory for outer connections
app.use(express.static(path.join(__dirname, 'public')));
app.use("/experiments" ,express.static(path.join(__dirname, 'experiments')));
app.use("/configs" ,express.static(path.join(__dirname, 'configs')));

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
        default:
            return "./UI/logo/LogoPlaceholder.svg"
    }
}

//API endpoint for the index file
app.get('/', (req, res) => {
    //res.sendFile(path.join(__dirname, 'public', 'index.html'));  //version that uses standart .html
    res.render('index', indexUtilities.parseConfig())
});


const allowedDirectories = ["experiments","configs"];

app.get('/file-list', (req, res) => {
    const fileDir = req.headers['target-directory'];
    if(allowedDirectories.includes(fileDir)){
        res.status(200).send(JSON.stringify(fs.readdirSync(fileDir)));
    }
    else{
        res.status(403).send("you don't have permisions to view to this directory");
    }
})

app.delete('/delete-file', (req,res) => {
    const fileDir = req.headers['target-directory'];
    const fileName = req.headers['file-name'];

    if(fileName){
        if(allowedDirectories.includes(fileDir)){
            if(fs.readdirSync(fileDir).includes(fileName)){
                try {
                    fs.unlinkSync(path.join(fileDir, fileName));
                } catch (error) {
                    console.error("File delete error",error);
                    res.status(500).send("internal error");
                    return
                }
                res.status(200).send("file deleted successfully");
                return
            }            
            else{
                res.status(122).send("file does not exist");
                return
            }
        }
        else{
            res.status(403).send("you don't have permisions to write to this directory");
            return
            //console.log("unsuccessfull (403)\n----------------");
        }
    }
    else{
        res.status(400).send("missing headers");
        return
        //console.log("unsuccessfull (400)\n----------------");
    }
    
})

app.post('/send-file', (req, res) => {
    const fileDir = req.headers['target-directory'];
    const fileName = req.headers['file-name'];
    const maxBodySize = 50000;

    const textEncoder = new TextEncoder();
    if(textEncoder.encode(req.body).length > maxBodySize){
        res.status(413).send("body too large (max size: "+maxBodySize+" bytes)");
        return
    }
    //console.log("send-file api activated\n----------------\nfileDir: "+fileDir+"\nfileName: "+fileName);
    if(fileName){
        if(allowedDirectories.includes(fileDir)){
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
    const fileName = req.headers['file-name'];
    const maxBodySize = 50000;

    //console.log("send-file api activated\n----------------\nfileDir: "+fileDir+"\nfileName: "+fileName);
    if(fileName){
        if(allowedDirectories.includes(fileDir)){
            fs.writeFileSync("./"+fileDir + "/" +fileName, "");
            res.status(200).send("file transfer successfull");               
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
    console.log("recievew a timeout test request, the server will NOT send a response");
})





//returns a random rounded number between the lower and upper limit
function getRandWholeNum(lower, upper){
    return Math.round(lower + Math.random()*upper);
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