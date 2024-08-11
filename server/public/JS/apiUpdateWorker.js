setInterval(updateSite, 5000);
const nodePort = 8080;
const restPort = 0;

updateSite();

async function updateSite(){
    const apiFetchers = document.getElementsByClassName('api-fetcher');
    const url = "http://" + window.location.hostname;

    for (let i = 0; i < apiFetchers.length; i++) {
        const element = apiFetchers[i];
        console.log(element);
        if (element.getAttribute("source") != null) {
            switch(element.getAttribute("source_device")){
                case "node":{
                    element.innerHTML = (await fetchData(url+":"+nodePort+element.getAttribute("source"))).value + " " + element.getAttribute("unit");
                    break;
                }
                case "device":{
                    element.innerHTML = (await fetchData(url+":"+restPort+element.getAttribute("source"))).value + " " + element.getAttribute("unit");
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
    return (await fetch(url)).json();
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