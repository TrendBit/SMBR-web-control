const fs = require('fs');
const yaml = require('js-yaml');
const webConfigAssembler = require('./webConfigAssembler.js');



class temperatureData {
    constructor(capacity) {
        this.capacity = capacity; 
        this.arr = new Array(capacity);
        this.head = -1; 

        for(var i=0; i<this.capacity; i++){
            this.arr[i] = {'data':0, 'timestamp': new Date(0)};  
        } 
    }

    push(obj, timestamp) {
        this.head=(this.head+1)%this.capacity;
        this.arr[this.head] = {'data':obj, 'timestamp': (timestamp)?timestamp:new Date()};
    }

    //retuns nth element from top
    getHistory(reverseIndex) {
        var index = (this.head-reverseIndex)%this.capacity;
        if (index<0){
            index = index + this.capacity;
        }
        return this.arr[(index)%this.capacity];
    }

    toArray() {
        const outArray = new Array(this.capacity);
        for (let i = 0; i < this.arr.length; i++) {
            outArray[i] = this.getHistory(this.arr.length-i-1);
        }
        return outArray;
    }

    getAvg(time, scale){
        var acc = {};
        var cnt = 0;
        const firstData = this.getHistory(0).data;
        for(var field in firstData){
            acc[field] = 0;
        }
        
        for(var i in this.arr){
            var elTime = 0;
            switch (scale) {
                case 0:
                    elTime = this.arr[i].timestamp.getSeconds();
                    break;
                case 1:
                    elTime = this.arr[i].timestamp.getMinutes();
                    break;
                case 2:
                    elTime = this.arr[i].timestamp.getHours();
                    break;
                default:
            }
            if(elTime == time){
                cnt++;
                for(var field in this.arr[i].data){
                    acc[field] += this.arr[i].data[field];
                }
            }
        }
        
        for(var field in acc){
            acc[field] = Math.round(acc[field] / cnt);
        }
        
        return acc;
    }

    getPrepared(){
        var arrCopy = structuredClone(this.toArray());
        for(var i in arrCopy){
            arrCopy[i].timestamp = arrCopy[i].timestamp.getTime();
        }
        return arrCopy;
    }
}

module.exports = {
    getTemperatureGraph: function(level){
        switch (level) {
            case "minute":
                return minute.getPrepared();
                break;
            case "hour":
                return hour.getPrepared();
                break;
            case "day":
                return day.getPrepared();
                break;
            default:
                return [];
                break;
        }
    },
    getTemperatureGraphRecent: function(level,lastReload){

        var numOfLogs = 0;
        switch (level) {
            case "minute":
                numOfLogs = minute.capacity;            
                break;
            case "hour":
                numOfLogs = hour.capacity;
                break;
            case "day":
                numOfLogs = day.capacity;
                break;
        
            default:
        }

        var result = [];

        for (let i = 0; i < numOfLogs; i++) {
            var element;
            switch (level) {
                case "minute":
                    element = minute.getHistory(i);       
                    break;
                case "hour":
                    element = hour.getHistory(i);
                    break;
                case "day":
                    element = day.getHistory(i);
                    break;
            
                default:
            }
            element = structuredClone(element);
            element.timestamp = element.timestamp.getTime();

            if(element.timestamp > lastReload){
                result.push(element);
            }else{
                break;
            }
        }

        return result;
    }
}


var currentModuleTemps = {};
function temperatureGraphFetch(){
    var loadedConfig = webConfigAssembler.getConfig("[internal readings logger]");
    if(loadedConfig.DashboardPanel == undefined) return;
    if(loadedConfig.DashboardPanel.TemperatureWidget == undefined) return;
    fetchDataForRows(loadedConfig.DashboardPanel.TemperatureWidget.rows);
    

    //defined to allow recursion for sub"ELements
    function fetchDataForRows(rows,last=""){
        if(rows){
            rows.forEach(element => {
                if(element.charted == true){                    
                    fetchDataAsJson("http://127.0.0.1:"+element.port+element.resource)
                    .then(response =>{
                        
                        currentModuleTemps[last + element.name] = Math.round(response[element.component]);
                    })
                    .catch(err => {
                        currentModuleTemps[last + element.name] = null;
                        console.error("ERROR while trying to fetch current temperature for: "+element.name + "\n"+err.message);
                    });
                    
                    if(element.sub_rows && last === ""){ //stops recursion
                        fetchDataForRows(element.sub_rows,element.name+".");
                    }
                    
                }
            });
        }
    }
    
    
    //var loadedConfig = yaml.load(fs.readFileSync("webConfig.yaml"));
}




const readingDelay = 1.5;
const currDate  = new Date();
var minute     = new temperatureData(60);
var lastMinute  = currDate.getMinutes();
var hour       = new temperatureData(60);
var lastHour    = currDate.getHours();
var day        = new temperatureData(24);
function temperatureGraphReload(){
    temperatureGraphFetch();

    minute.push(structuredClone(currentModuleTemps));
    //console.log(lastMinute, (new Date()).getMinutes());


    if((new Date()).getMinutes() != lastMinute){
        hour.push(minute.getAvg(lastMinute,1));
        lastMinute = (new Date()).getMinutes();
        //console.log(minute.toArray());
        //console.log(hour.toArray());
        
        //fs.writeFileSync("out_minute.txt",  JSON.stringify(minute.toArray() , null, 2));
        //fs.writeFileSync("out_hour.txt",    JSON.stringify(hour.toArray()   , null, 2));
        //fs.writeFileSync("out_day.txt",     JSON.stringify(day.toArray()    , null, 2));
    }


    if((new Date()).getHours() != lastHour){
        day.push(hour.getAvg(lastHour,2));
        lastHour = (new Date()).getHours();
    }
}


temperatureGraphFetch();
setTimeout(()=>{
    setInterval(() => temperatureGraphReload(),1000*readingDelay);
},1000);

async function fetchDataAsJson(url) {
    const response = await fetch(url,
                            {
                                method: "GET",
                                headers: {
                                    'Content-Type': 'text/plain', //it has to be plain text else it will send a complex request with an additional OPTIONS request
                                },
                                signal: AbortSignal.timeout( 10000 )                           
                            }
                        );
    //console.log(response);
    return response.json()
}
