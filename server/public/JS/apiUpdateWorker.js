setInterval(updateSite, 5000);
const nodePort = 8080;
const restPort = 8089;

updateSite();

async function updateSite(){
    const apiFetchers = document.getElementsByClassName('api-fetcher');
    const url = "http://" + window.location.hostname;

    for (let i = 0; i < apiFetchers.length; i++) {
        const element = apiFetchers[i];
        //console.log(element);
        if (element.getAttribute("source") != null) {
            switch(element.getAttribute("source_device")){
                case "node":{
                    element.innerHTML = 
                        (await 
                            fetchData(url+":"+nodePort+element.getAttribute("source"))
                        )[element.getAttribute("component")] 
                        + " " 
                        + element.getAttribute("unit");

                    break;
                }
                case "device":{
                    element.innerHTML = 
                        (await 
                            fetchData("http://192.168.1.188"+":"+restPort+element.getAttribute("source"))
                        )[element.getAttribute("component")] 
                        + " " 
                        + element.getAttribute("unit");

                    break;
                }
                default:{
                    console.error("invalid api-fetcher format: " + element.getAttribute("source_device"));
                }
            }
        }else{
            console.error("invalid api-fetcher format: " + element.getAttribute("source") );
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