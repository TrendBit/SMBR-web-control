const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const fs = require('node:fs');

const PORT = 8080;
const apiTestUtilities = require('./apiTestUtilities.js');
const indexUtilities = require('./indexUtilities.js');

//fixes the "TypeError: NetworkError when attempting to fetch resource" error by allowing anyone to use the api: 
app.use(cors()); 

//opens the ./public/ directory for outer connections
app.use(express.static(path.join(__dirname, 'public')));
app.use("/experiments" ,express.static(path.join(__dirname, 'experiments')));
app.use("/configs" ,express.static(path.join(__dirname, 'configs')));

app.use(express.text());
//starts the server on port PORT
app.listen(PORT);


app.set('views', './views');
app.set('view engine', 'ejs');


//API endpoint for the index file
app.get('/', (req, res) => {
    //res.sendFile(path.join(__dirname, 'public', 'index.html'));  //version that uses standart .html
    res.render('index', indexUtilities.parseConfig())
});

//API endpoint for the api Test
app.get('/test', (req, res) => {
    res.render('apiTest', apiTestUtilities.parseConfig());
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

app.post('/send-file', (req, res) => {
    const fileDir = req.headers['target-directory'];
    const fileName = req.headers['file-name'];
    const maxBodySize = 50000;

    const textEncoder = new TextEncoder();
    if(textEncoder.encode(req.body).length > maxBodySize){
        res.status(413).send("body too large (max size: "+maxBodySize+" bytes)");
    }
    //console.log("send-file api activated\n----------------\nfileDir: "+fileDir+"\nfileName: "+fileName);
    if(fileName){
        if(allowedDirectories.includes(fileDir)){
            var fileData = "";
        
            if(req.body != undefined){
                fileData = req.body;
            }

            
            //console.log("file data: =\n"+fileData+"\n=");
            //console.log("request body: =\n"+req.body+"\n=");
            fs.writeFileSync("./"+fileDir + "/" +fileName, fileData);
            res.status(200).send("file transfer successfull");
            //console.log("successfull\n----------------");
        }
        else{
            res.status(403).send("you don't have permisions to write to this directory");
            //console.log("unsuccessfull (403)\n----------------");
        }
    }
    else{
        res.status(400).send("missing headers");
        //console.log("unsuccessfull (400)\n----------------");
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