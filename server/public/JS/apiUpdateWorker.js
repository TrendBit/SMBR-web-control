(function() {
setInterval(updateSite, 5000);

onloadQueue.push( () => updateSite());

async function updateSite(){
    const apiFetchers = document.getElementsByClassName('api-fetcher');
    const url = "http://" + window.location.hostname;
    console.log(currContext);
    if(currContext == 0){
        for (let i = 0; i < apiFetchers.length; i++) {
            const element = apiFetchers[i];
            
            if (element.getAttribute("resource")!="") {
                fetchDataAsJson(url+":"+element.getAttribute("port")+element.getAttribute("resource"))
                .then(response => {
                    element.innerHTML = Math.round(response[element.getAttribute("component")]) + " " + element.getAttribute("unit")
                    element.classList.remove("error");
                })
                .catch(err => {
                    element.innerHTML = "Null"
                    element.classList.add("error");
                    console.error(element,err);
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