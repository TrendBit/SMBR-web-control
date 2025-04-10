var apiUpdateWorkerUpdate;



(function() {
    setInterval(() => {updateSite(document);}, 5000);
    
    onloadQueue.push( () => updateSite(document));
    
    apiUpdateWorkerUpdate = async (element) => {
        console.debug("apiUpdateWorker: updating ", element);
        element.disabled = true;
        await updateSite(element);
        element.disabled = false;
    };
var updateIndex = 0;
async function updateSite(root){
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
        if (element.getAttribute("resource")!="") {
            fetchDataAsJson(":"+element.getAttribute("port")+element.getAttribute("resource"))
            .then(response => {
                innerVal = ""
                if(isNaN(response[element.getAttribute("component")])){
                    innerVal = response[element.getAttribute("component")];
                }else{
                    var numberOfDecimalPLaces = element.getAttribute("decimal-places");
                    if(numberOfDecimalPLaces==undefined){
                        numberOfDecimalPLaces = 0;
                    }
                    var numberLabel = Number(response[element.getAttribute("component")]);
                    
                    innerVal = numberLabel.toFixed(numberOfDecimalPLaces) + " " + element.getAttribute("unit")
                }
                
                
                if(element.getAttribute("to-placeholder") != undefined){
                    element.placeholder = innerVal
                }else{
                    element.innerHTML = innerVal
                }
                element.classList.remove("error");
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
})();