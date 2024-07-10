const app = require('express')();
const cors = require('cors');
const fs = require('fs')
const PORT = 8080;


app.use(cors()); //opravuje Error fetching data: TypeError: NetworkError when attempting to fetch resource, v tuto chvíli bez omezení která doména smí přistupovat k API, teoreticky nebezpečné.
app.listen(PORT);


/*
    returns
    {
    "test": <random whole number between 0-1000>,
    "input": <nothing>
    }
*/
app.get('/test-get', (req, res) => {

    const count = getRandWholeNum(0,1000);
    res.status(200).send({test: ""+(count)});

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