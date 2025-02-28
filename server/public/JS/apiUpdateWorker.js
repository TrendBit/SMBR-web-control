var apiUpdateWorkerUpdate;



(function() {
    setInterval(() => {updateSite(document);}, 5000);
    
    onloadQueue.push( () => updateSite(document));
    
    apiUpdateWorkerUpdate = async (element) => {
        element.disabled = true;
        await updateSite(element.parentNode.parentNode.parentNode);
        element.disabled = false;
    };

async function updateSite(root){
    const apiFetchers = root.getElementsByClassName('api-fetcher');
    const url = "http://" + window.location.hostname;
    if(currContext == 0){
        for (let i = 0; i < apiFetchers.length; i++) {
            const element = apiFetchers[i];
            
            if (element.getAttribute("resource")!="") {
                fetchDataAsJson(url+":"+element.getAttribute("port")+element.getAttribute("resource"))
                .then(response => {
                    if(isNaN(response[element.getAttribute("component")])){
                        element.innerHTML = response[element.getAttribute("component")];
                    }else{
                        var numberOfDecimalPLaces = element.getAttribute("decimal-places");
                        if(numberOfDecimalPLaces==undefined){
                            numberOfDecimalPLaces = 0;
                        }
                        var numberLabel = Number(response[element.getAttribute("component")]);
                        element.innerHTML = numberLabel.toFixed(numberOfDecimalPLaces) + " " + element.getAttribute("unit")
                    }
                    element.classList.remove("error");
                })
                .catch(err => {
                    element.innerHTML = "Null"
                    element.classList.add("error");
                    console.error(element,err.message);
                })



                /*
                try{
                    element.innerHTML = 
                            Math.round((await 
                                fetchDataAsJson(url+":"+element.getAttribute("port")+element.getAttribute("resource"))
                            )[element.getAttribute("component")])
                            + " " 
                            + element.getAttribute("unit");
                }
                catch(err){
                    console.error(err);
                }*/
                
            }
        }
    }
    
}
})();