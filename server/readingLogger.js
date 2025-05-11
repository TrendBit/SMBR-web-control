const fs = require('fs');
const yaml = require('js-yaml');
const webConfigAssembler = require('./webConfigAssembler.js');

Number.prototype.countDecimals = function () {
    if(Math.floor(this.valueOf()) === this.valueOf()) return 0;
    return this.toString().split(".")[1].length || 0; 
}

class temperatureLogs {
    constructor(capacity) {
        this.capacity = capacity; 
        this.arr = new Array(capacity);
        this.head = 0; 
        this.emptyFields = capacity;

        for(var i=0; i<this.capacity; i++){
            this.arr[i] = {'data':{}, 'id': -1};  
        } 
    }

    push(obj, id) {
        this.head=this.head;
        this.arr[this.head] = {'data':obj, 'id': id};
        this.head = (this.head+1)%this.capacity;
        if(this.emptyFields>0){
            this.emptyFields--;
        }
    }

    getAvg() {
        // {
        //  BottleTop: {value: 5, count: 4},
        //}
        var sums = {};
        for (let i = 0; i < this.arr.length; i++) {
            const element = this.arr[i];

            for(var field in element.data){
                var originalSum = sums[field];
                if(element.data[field]==undefined || isNaN(element.data[field])){
                    continue;
                }
                if(originalSum!=undefined){
                    sums[field].value = Number(element.data[field])+Number(originalSum.value);
                    sums[field].count++;
                }else{
                    sums[field]= {
                        value: Number(element.data[field]),
                        count: 1
                    }
                }
            }
        }
        var result = {};
        for(var field in sums){
            result[field] = sums[field].value/sums[field].count
        }
        return result;
    }

    toArray(containEmptyFields = false) {
        const emptyFieldsCount = (!containEmptyFields)?this.emptyFields:0;
        const outArray = new Array(this.capacity-emptyFieldsCount);
        for (let i = emptyFieldsCount; i < this.arr.length; i++) {
            outArray[i-emptyFieldsCount] = this.arr[(i+this.head)%this.arr.length];
        }
        return outArray;
    }

    getHistory(fromID){
        const allLogs = this.toArray();
        if(allLogs.length==0){
            return [];
        }
        const lastLogID = allLogs[allLogs.length-1].id;
        var returnElCount = 0;
        for (let i = allLogs.length-1; i >=0; i--) {
            if(allLogs[i].id<=fromID){
                break;
            }else{
                returnElCount++;
            }
        }
        if(returnElCount>0){
            return allLogs.slice(-returnElCount);
        }
        return [];
    }
}

module.exports = {
    getTemperatureGraph: function(level){
        const returnObj = {granuality:0,serverTime:(new Date()).getTime(),data:[]};
        switch (level) {
            case "minute":
                returnObj.granuality = (60*1000)/(logsPerMinute);
                returnObj.data = minuteLogs.toArray(true);
                break;
            case "hour":
                returnObj.granuality = (60*60*1000)/(logsPerHour);
                returnObj.data = hourLogs.toArray(true);
                break;
            case "day":
                returnObj.granuality = (24*60*60*1000)/(logsPerDay);
                returnObj.data = dayLogs.toArray(true);
                break;
            default:
                break;
        }
        return returnObj;
    },
    getTemperatureGraphRecent: function(level,lastID){
        const returnObj = {granuality:0,serverTime:(new Date()).getTime(),data:[]};
        switch (level) {
            case "minute":
                returnObj.granuality = (60*1000)/logsPerMinute;
                returnObj.data = minuteLogs.getHistory(lastID);
                break;
            case "hour":
                returnObj.granuality = (60*60*1000)/(logsPerHour);
                returnObj.data = hourLogs.getHistory(lastID);
                break;
            case "day":
                returnObj.granuality = (24*60*60*1000)/(logsPerDay);
                returnObj.data = dayLogs.getHistory(lastID);
                break;
            default:
                break;
        }
        return returnObj;
    }
}

function deepEqual(x, y) {
    const ok = Object.keys, tx = typeof x, ty = typeof y;
    return x && y && tx === 'object' && tx === ty ? (
      ok(x).length === ok(y).length &&
        ok(x).every(key => deepEqual(x[key], y[key]))
    ) : (x === y);
  }



var loadedConfig = {DashboardPanel:{TemperatureWidget:{rows:[]}}};
var currentModuleTemps = {};
async function temperatureGraphFetch(){
    
    const newConfig = webConfigAssembler.getConfig("[internal readings logger]");
    if(!deepEqual(newConfig,loadedConfig)){
        loadedConfig = newConfig;
        currentModuleTemps = {};
    }
    
    if(loadedConfig == undefined) return;
    if(loadedConfig.DashboardPanel == undefined) return;
    if(loadedConfig.DashboardPanel.TemperatureWidget == undefined) return;

    await fetchDataForRows(loadedConfig.DashboardPanel.TemperatureWidget.rows);


    //defined to allow recursion for sub"ELements
    async function fetchDataForRows(rows,last=""){
        
        if(rows){
            for(var field in rows){
                const element = rows[field];


                if(element.resource != undefined){          
                    try {
                        var response = await fetchDataAsJson("http://127.0.0.1:"+element.port+element.resource)
                        numberOfDecimalPLaces=(element.decimalPlaces)?element.decimalPlaces:0;
                        currentModuleTemps[last + element.name] = Number(response[element.component]).toFixed(numberOfDecimalPLaces);
                    } catch (err) {
                        currentModuleTemps[last + element.name] = null;
                        console.error("ERROR while trying to fetch current temperature for: "+element.name + "\n"+err.message);
                    }          
                    
                    
                }
                if(element.sub_rows && last === ""){ //stops recursion
                    await fetchDataForRows(element.sub_rows,element.name+".");
                }
            }
        }
    }
    
    
    //var loadedConfig = yaml.load(fs.readFileSync("webConfig.yaml"));
}


const logsPerMinute = 60;
const logsPerHour   = 60;
const logsPerDay    = 96;

var minuteLogs     = new temperatureLogs(logsPerMinute);
var hourLogs       = new temperatureLogs(logsPerHour  );
var dayLogs        = new temperatureLogs(logsPerDay   );
var currID         = 0;
const readingDelay = 60000/logsPerMinute;


const logsBetweenHourPush = Math.floor(logsPerMinute*(60/logsPerHour));
const logsBetweenDayPush = Math.floor(logsPerMinute*(1440/logsPerDay));
async function temperatureGraphReload(){
    await temperatureGraphFetch();

    minuteLogs.push(structuredClone(currentModuleTemps),currID);
    if(currID%logsBetweenHourPush == 0){
        hourLogs.push(minuteLogs.getAvg(),currID);
    }
    if(currID%logsBetweenDayPush == 0){
        dayLogs.push(hourLogs.getAvg(),currID);
    }

    currID++;
}


temperatureGraphFetch();
setTimeout(()=>{
    setInterval(() => temperatureGraphReload(),readingDelay);
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
