var moduleApiUpdateWorkerUpdate;
(function() {
setInterval((() => updateSite(false,false)), 15000);

onloadQueue.push(() => updateSite(true));
moduleApiUpdateWorkerUpdate = async (element) => {
    element.disabled = true;
    await updateSite(true,true);
    element.disabled = false;
};



var loadedModules = [];
var currSetStatus = "";

async function updateSite(skipConextCheck, refresh){
    const apiFetchers = document.getElementsByClassName('module-api-fetcher');
    const url = "http://" + window.location.hostname;

    var newModules = {};
    try {
        if(refresh){
            newModules = await fetchDataAsJson(url+"/module-list-refresh");
        }else{
            newModules = await fetchDataAsJson(url+"/module-list");
        }
        
    } catch (error) {
        setMainPopup("error","lost connection to the server");
        document.getElementById("module-list").getElementsByClassName("name")[0].children[0].innerHTML = "<p>lost connection to the server</p>";
        document.getElementById("module-list").classList.add("error");

        setStatus("error");
        currSetStatus = "error";
        
        console.error("unable to load module list");
        return
    }

    if(currSetStatus=="error"){
        setStatus("standby");
        resetMainPopup();
        document.getElementById("module-list").getElementsByClassName("name")[0].children[0].innerHTML = "<p></p>";
        document.getElementById("module-list").classList.remove("error");
    }
    
    var noChanges = true;
    if(loadedModules.length == newModules.length){
        for (let i = 0; i < loadedModules.length; i++) {
            const element1 = loadedModules[i];
            const element2 = newModules[i];
            
            if(element1 == element2){
                noChanges = false;
            }
        }
    }else{
        noChanges = false;
    }

    loadedModules = newModules;

    if(!noChanges && !skipConextCheck){
        setMainPopup("error","change in modules<br>please reload the website");
        document.getElementById("module-list").getElementsByClassName("name")[0].innerHTML += "<p>outdated data, please reload</p>";
        document.getElementById("module-list").classList.add("error");
    }

    if( currContext == 3 || skipConextCheck){
        for (let i = 0; i < apiFetchers.length; i++) {
            const element = apiFetchers[i];
            
            if (element.getAttribute("resource")!="") {
                const port = (element.getAttribute("port"))?element.getAttribute("port"):"8089";

                fetchDataAsJson(url+":"+port+element.getAttribute("resource"))
                .then(response => {
                    element.innerHTML = Math.round(response[element.getAttribute("component")]) + " " + element.getAttribute("unit")
                    element.classList.remove("error");
                })
                .catch(err => {
                    element.innerHTML = "Null";
                    element.classList.add("error");
                    console.error(element, err.message);
                })
                
            }
        }
    }
}




})();