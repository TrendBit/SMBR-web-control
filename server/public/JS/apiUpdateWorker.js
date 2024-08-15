setInterval(updateSite, 5000);

updateSite();

async function updateSite(){
    const apiFetchers = document.getElementsByClassName('api-fetcher');
    const url = "http://" + window.location.hostname;

    for (let i = 0; i < apiFetchers.length; i++) {
        const element = apiFetchers[i];
        //console.log(element);
        if (element.getAttribute("resource")!="") {
            try{
                element.innerHTML = 
                        Math.round((await 
                            fetchData(url+":"+element.getAttribute("port")+element.getAttribute("resource"))
                        )[element.getAttribute("component")])
                        + " " 
                        + element.getAttribute("unit");
            }
            catch(err){
                console.error(err);
            }
            
        }
    }
}


async function fetchData(url) {
    const response = await fetch(url,
                            {
                                method: "GET",
                                headers: {
                                    'Content-Type': 'text/plain', //it has to be plain text else it will send a complex request with an additional OPTIONS request
                                }
                            }
                        );
    //console.log(response);
    return response.json();
}
/*
function fetchData(url) { //wierd method, dont use
    fetch(url)
        .then(response => response.json())
        .then(response => {
            console.log("returning response");
            return response;
        })
        .catch(error => console.error('Error fetching data:', error));            
}*/