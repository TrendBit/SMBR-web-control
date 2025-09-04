var apiUpdateWorkerUpdate;
var device = {};


    setInterval(() => {updateSite(document);}, 5000);
    
    onloadQueue.push( () => updateSite(document));
    
    apiUpdateWorkerUpdate = async (element) => {
        console.debug("apiUpdateWorker: updating ", element);
        element.disabled = true;
        await updateSite(element);
        element.disabled = false;
    };
var updateIndex = 0;

function writeChangesToDeviceCache(path, value, target=device){
    path = path.split("/");
    
    for (let i = 0; i < path.length-1; i++) {
        const element = path[i];
        if(target[element] == undefined){
            target[element] = {};
        }
        target = target[element];
    }
    target[path[path.length-1]] = value;
    
}

async function updateSite(root){
    if(!updateSwitch){
        return;
    }
    //if(root == document && currContext.el != null){
    //    root = currContext.el
    //}
    const apiFetchers = root.getElementsByClassName('api-fetcher');
    
    for (let i = 0; i < apiFetchers.length; i++) {
        const element = apiFetchers[i];
        if(element.getAttribute("update-cost")!=undefined){
            if(updateIndex%element.getAttribute("update-cost") != 0){
                continue;
            }
        }
        if(element.classList.contains("handler")!=""){
            try {
                element.handler.update();         
            } catch (error) {

            }
            continue; 
        }
        let outMultiplier = 1;
        if(element.getAttribute("output-multiplier")!=undefined && element.getAttribute("output-multiplier")!=""){
             outMultiplier = Number(element.getAttribute("output-multiplier"));
        }
        if (element.getAttribute("resource")!="") {
            fetchDataAsJson(":"+element.getAttribute("port")+element.getAttribute("resource"))
            .then(response => {
                innerVal = ""
                const responseValue=response[element.getAttribute("component")];
                console.debug("Numeric/String value: ",responseValue, typeof responseValue == "number")
                if(typeof responseValue == "number"){
                    console.debug("Numeric value: ",responseValue)
                    if(responseValue == null){
                        innerVal = "Null";
                    }else{
                        var numberOfDecimalPLaces = element.getAttribute("decimal-places");
                        if(numberOfDecimalPLaces==undefined){
                            numberOfDecimalPLaces = 0;
                        }
                        var numberLabel = Number(responseValue) * outMultiplier;
                        
                        innerVal = numberLabel.toFixed(numberOfDecimalPLaces) + " " + element.getAttribute("unit");
                    }
                }else{
                    innerVal = String(responseValue);
                    console.debug("String value: ",innerVal)
                }
                
                
                if(element.getAttribute("to-placeholder") != undefined){
                    element.placeholder = String(innerVal)
                }else{
                    element.innerHTML = String(innerVal)
                }
                element.classList.remove("error");

                let devicePath = element.getAttribute("device-path");
                if(devicePath!=undefined && devicePath!="" ){
                    writeChangesToDeviceCache(devicePath,innerVal);
                }
            })
            .catch(err => {
                if(element.getAttribute("to-placeholder") != undefined){
                    element.placeholder = "Null"
                }else{
                    element.innerHTML = "Null"
                }
                element.classList.add("error");
                //console.error(element,err.message);
                console.debug("unable to fetch resource: ",
                    ":"+element.getAttribute("port")+element.getAttribute("resource"),
                    "\n",
                    err.message,
                    element
                );
            })
            
                    
        }
    }
    
    updateIndex++;
}