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

// adding additionalHeaders will cause this to not work on RestApi endpoints
async function fetchDataAsJson(url,additionalHeaders = {}) {
    try {
        const response = await fetch(url,
                                {
                                    method: "GET",
                                    headers: {
                                        'Content-Type': 'text/plain', //it has to be plain text else it will send a complex request with an additional OPTIONS request
                                        ...additionalHeaders
                                    },
                                    signal: AbortSignal.timeout( 10000 )                           
                                }
                            );
        //console.log(response);
        return response.json()
    } catch (error) {
        console.debug("unable to fetch resource: ",url);
    }
}

async function fetchData(url,additionalHeaders = {}) {
    try {
        const response = await fetch(url,
                                {
                                    method: "GET",
                                    headers: {
                                        'Content-Type': 'text/plain', //it has to be plain text else it will send a complex request with an additional OPTIONS request
                                        ...additionalHeaders
                                    }
                                }
                            );
        //console.log(response);
        return response
    } catch (error) {
        console.debug("unable to fetch resource: ",url);
    }
}

async function sendData(url, data) {
    console.debug("sending to ",url,": ",data);
    try {        
        const response = await fetch(url, {
            "credentials": "omit",
            "headers": {
                "Accept": "application/json",
                "Accept-Language": "cs,sk;q=0.8,en-US;q=0.5,en;q=0.3",
                "Content-Type": "application/json",
            },
            "body": data,
            "method": "POST",
            "mode": "cors"
        });   
        return await response;
    } catch (error) {
        console.debug("unable to send data to resource: ",url);
        return 0;
    }
}


function censor(censor) {
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

function mapRangeToRange(number, inMin,inMax, outMin,outMax){
    return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
function enforceMax(el){
    if (el.value != "") {
        if(isNaN(el.value)){
            el.value = el.value.slice(0,-1)
            enforceMax(el)
        }
        if (Number(el.value) > Number(el.max)) {
            el.value = el.max;
        }
    }
}
function enforceMin(el){
    if (el.value != "") {
        if(isNaN(el.value)){
            el.value = el.value.slice(0,-1)
            enforceMax(el)
        }
        if (Number(el.value) < Number(el.min)) {
            el.value = el.min;
        }
    }
}
function enforceMinMax(el) {
    if (el.value != "") {
        if(isNaN(el.value)){
            el.value = el.value.slice(0,-1)
            enforceMax(el)
        }
        if (Number(el.value) < Number(el.min)) {
            el.value = el.min;
        }
        if (Number(el.value) > Number(el.max)) {
            el.value = el.max;
        }
    }
}


function eraseValue(element){
    element.value = "";
}


function sendSliderData(element, data = {},instant = false){
    if((Date.now()) - element.getAttribute("lastUpdate") > 100 
    || element.value == element.getAttribute("max") 
    || element.value == element.getAttribute("min") 
    || instant
    || element.value == element.getAttribute("offPos")){
        if(!instant){
            element.setAttribute("lastUpdate",Date.now());
        }
        const url = "http://" + window.location.hostname;
        sendData(url+":"+element.getAttribute("port")+element.getAttribute("resource"),JSON.stringify(data));
    }
}

function chromeFix_Slider(element){
    if((window.webkitURL != null)){
        const progress = mapRangeToRange(element.value,Number(element.getAttribute("max")),Number(element.getAttribute("min")),100,0) 
        if(element.classList.contains("vertical")){
            element.style.background = "linear-gradient(0deg, var(--acc-color-2) "+progress+"%, var(--bg-color-3) "+progress+"%)";
        }else{
            element.style.background = "linear-gradient(90deg, var(--acc-color-2) "+progress+"%, var(--bg-color-3) "+progress+"%)";
        }
    }
}

function slider2Set(element,value){
    if(element.classList.contains("slider")){ //it was called on slider
        element.value = value;
        const inputLabel = element.parentElement.getElementsByClassName("slider2-inputLabel")[0];
        inputLabel.getElementsByClassName("left")[0].value = value;
        chromeFix_Slider(element);
    }else{ //it was probably called on container
        slider2Set(element.getElementsByClassName("slider")[0],value);
    }
}

function slider2Handler(element,data){
    slider2Set(element,element.value)
    sendSliderData(element,data);
}


function slider2TextInputHandler(element,data){
    const slider = element.parentElement.parentElement.getElementsByClassName("slider")[0];
    slider2Set(slider, element.value);
    sendSliderData(slider,data,true);
}


function slider1Set(element, value){
    if(element.classList.contains("slider")){ //it was called on slider
        element.value = value;
        const valueLabel = element.parentElement.parentElement.getElementsByClassName("slider-value")[0];
        const valueModifier = valueLabel.getAttribute("value-modifier");
        
        var numberLabel = 0;
        if(valueModifier!=undefined){
            numberLabel = Number(element.value)*valueModifier;
        }else{
            numberLabel =Number(element.value);
        }
        var numberOfDecimalPLaces = valueLabel.getAttribute("decimal-places");
        if(numberOfDecimalPLaces==undefined){
            numberOfDecimalPLaces = 0;
        }
        valueLabel.innerHTML = numberLabel.toFixed(numberOfDecimalPLaces) + element.getAttribute("unit") ;
        chromeFix_Slider(element);
    }else{ //it was probably called on container
        slider1Set(element.getElementsByClassName("slider")[0],value);
    }    
}

function slider1Handler(element, data){
    slider1Set(element,element.value);

    sendSliderData(element,data);
}


//should be called on the sender of a button2 (the other one will be used as input data)
async function button2Handler(element,placeholderReset=false){
    const currSide = element.classList.contains("left")
    const dataElement = element.parentElement.getElementsByClassName((currSide)?"right":"left")[0]
    var data = {}
    var value = dataElement.value

    

    if(element.getAttribute("component-type") == "number"){
        if(value === ""){ //catches an edgecase where "" == 0 and Number("") == 0
            console.debug("button2Handler: not sending ",data,"to ",":"+element.getAttribute("port")+element.getAttribute("resource"),element)
            return
        }

        value = Number(value);
        console.debug("button2Handler sending number")
    }else{
        console.debug("button2Handler ¨not sending number",element.getAttribute("component-type"),element)
    }

    data[element.getAttribute("component")] = value

    if(placeholderReset){
        dataElement.value = ""
        dataElement.placeholder = "..."
    }
    
    const url = "http://" + window.location.hostname;
    console.debug("button2Handler: sending ",data,"to ",url+":"+element.getAttribute("port")+element.getAttribute("resource"),element)
    res = await sendData(url+":"+element.getAttribute("port")+element.getAttribute("resource"),JSON.stringify(data));
    console.debug("button2Handler:",res.status)
    if(res == 0){
        dataElement.value = "Err"
        return
    }
    if(res.status != 200){
        dataElement.value = "NetErr"
        return
    }


}




function formatTime(formatString,timestamp =new Date()){
    const seconds = timestamp.getSeconds();
    const minutes = timestamp.getMinutes();
    const hours   = timestamp.getHours();

    formatString = formatString.replaceAll("ss",seconds);
    formatString = formatString.replaceAll("mm",minutes);
    formatString = formatString.replaceAll("hh",hours);
    formatString = formatString.replaceAll("dd",timestamp.getDate());
    formatString = formatString.replaceAll("wd",timestamp.getDay());
    formatString = formatString.replaceAll("mo",timestamp.getMonth());
    formatString = formatString.replaceAll("yyyy",timestamp.getFullYear());

    formatString = formatString.replaceAll("SS",(seconds<10)?"0"+seconds:seconds);
    formatString = formatString.replaceAll("MM",(minutes<10)?"0"+minutes:minutes);
    formatString = formatString.replaceAll("HH",(hours<10)?"0"+hours:hours);

    return formatString;
}