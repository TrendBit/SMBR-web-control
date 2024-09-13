(function() {
setInterval(updateSite, 5000);

updateSite();

async function updateSite(){
    const apiFetchers = document.getElementsByClassName('api-fetcher');
    const url = "http://" + window.location.hostname;
    console.log(currContext);
    if(currContext == 0){
        for (let i = 0; i < apiFetchers.length; i++) {
            const element = apiFetchers[i];
            //console.log(element);
            if (element.getAttribute("resource")!="") {
                fetchDataAsJson(url+":"+element.getAttribute("port")+element.getAttribute("resource"))
                .then(response => {
                    element.innerHTML = Math.round(response[element.getAttribute("component")]) + " " + element.getAttribute("unit")
                })
                .catch(err => {
                        console.error(err);
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