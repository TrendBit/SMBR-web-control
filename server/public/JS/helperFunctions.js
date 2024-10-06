function toggleClass(element, className){
    if(element.classList.contains(className)){
        element.classList.remove(className);
    }
    else{
        element.classList.add(className);
    }
}
function toggleClass_Parent(element, className){
    element = element.parentElement;
    toggleClass(element, className);
}

function toggleClass_ByID(elementID, className){
    let element = document.getElementById(elementID);
    toggleClass(element, className);
}

function toggleClass_nthParent(element, className, hopCount){
    for (let i = 0; i < hopCount; i++) {
        element = element.parentElement;
    }
    toggleClass(element, className);
}



function activateClass(element, className){
    if(!element.classList.contains(className)){
        element.classList.add(className);
    }
    
}
function activateClass_Parent(element, className){
    element = element.parentElement;
    activateClass(element, className);
}

function activateClass_ByID(elementID, className){
    let element = document.getElementById(elementID);
    activateClass(element, className);
}

function activateClass_nthParent(element, className, hopCount){
    for (let i = 0; i < hopCount; i++) {
        element = element.parentElement;
    }
    activateClass(element, className);
}



function deactivateClass(element, className){
    if(element.classList.contains(className)){
        element.classList.remove(className);
    }
}
function deactivateClass_Parent(element, className){
    element = element.parentElement;
    deactivateClass(element, className);
}

function deactivateClass_ByID(elementID, className){
    let element = document.getElementById(elementID);
    deactivateClass(element, className);
}

function deactivateClass_nthParent(event, element, className, hopCount){
    event.stopPropagation();
    for (let i = 0; i < hopCount; i++) {
        element = element.parentElement;
    }
    
    deactivateClass(element, className);
}


async function streamToString(stream) {
    const chunks = [];

    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks).toString("utf-8");
}


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
    return response
}

async function sendData(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: data
        });
        
        const result = await response.json();
        console.debug('Data sent: ', result.status());
    } catch (error) {
        console.error('Error while sending data:', error);
    }
}

function censor(censor) { //stolen from https://stackoverflow.com/questions/4816099/chrome-sendrequest-error-typeerror-converting-circular-structure-to-json/9653082#9653082
    var i = 0;
    
    return function(key, value) {
      if(i !== 0 && typeof(censor) === 'object' && typeof(value) == 'object' && censor == value) 
        return '[Circular]'; 
      
      if(i >= 29)
        return '[Unknown]';
    
      ++i;

      return value;  
    }
  }


  
function hexToRgb(hex) {
    hex = hex.replace(/^#/, ''); // Removes symbol # if it exists
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;

    return { r, g, b };
}

function darkenHexColor(hex, percent) {
    let { r, g, b } = hexToRgb(hex);

    r = Math.max(0, Math.min(255, r * (1 - percent / 100)));
    g = Math.max(0, Math.min(255, g * (1 - percent / 100)));
    b = Math.max(0, Math.min(255, b * (1 - percent / 100)));

    return rgbToHex(Math.round(r), Math.round(g), Math.round(b));
}


function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}