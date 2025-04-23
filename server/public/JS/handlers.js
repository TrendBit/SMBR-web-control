function initHandlers(){
    const allHandlers = document.getElementsByClassName("handler");
    for (let i = 0; i < allHandlers.length; i++) {
        const element = allHandlers[i];
        const handlerID = element.getAttribute("handler-id")
        const handlerClass = handlers[handlerID];
        element.handler = new handlerClass(element);

        try {
            //element.handler = new handlers[handlerID]();
        } catch (error) {
            console.error("UNABLE TO INIT HANDLER "+handlerID+" \n",error.message,element)
        }
    }
}
onloadQueue.push(()=>{
    initHandlers()
});


handlers["Slider1Handler"] = class Slider1Handler {
    constructor(element) {
        console.log("CREATING Slider1Handler")

        this.labels={
            name:element.getElementsByClassName("slider-name")[0],
            value: element.getElementsByClassName("slider-value")[0]
        }
        this.slider={
            min:element.getElementsByClassName("slider-min")[0],
            max:element.getElementsByClassName("slider-max")[0],
            slider:element.getElementsByClassName("slider")[0],
        }
        this.button=element.getElementsByClassName("slider-button")[0];
        console.log(this)
        this.init();
    }

    userInput(data = {}, forced = undefined){
        this.setValue(this.slider.slider.value);
        this.sendSliderData(data,forced);
    }

    sendSliderData(data = {},instant = false){
        const slider = this.slider.slider;
        if(slider.getAttribute("resource") == undefined){
            return;
        }
        if((Date.now()) - slider.getAttribute("lastUpdate") > 100 
            || slider.value == slider.getAttribute("max") 
            || slider.value == slider.getAttribute("min") 
            || instant
            || slider.value == slider.getAttribute("offPos")){
            if(!instant){
                slider.setAttribute("lastUpdate",Date.now());
            }
            sendData(":"+slider.getAttribute("port")+slider.getAttribute("resource"),JSON.stringify(data));
        }
    }

    async buttonGet(){
        try {
            var res = await fetchData(":"+this.button.getAttribute("port")+this.button.getAttribute("resource"));
            if(res.status != 200){
                throw Error("Server responded with: "+res.status+" code");
            }
            this.update();
        } catch (error) {
            console.error("Slider1Handler: Cannot get data: ",error.message);
        }
    }

    setValue(value){
        this.slider.slider.value = value;
        const valueModifier = this.labels.value.getAttribute("value-modifier");
        const slider = this.slider.slider;
        
        var numberLabel = 0;
        if(valueModifier!=undefined){
            numberLabel = Number(slider.value)*valueModifier;
        }else{
            numberLabel =Number(slider.value);
        }
        var numberOfDecimalPLaces = this.labels.value.getAttribute("decimal-places");
        if(numberOfDecimalPLaces==undefined){
            numberOfDecimalPLaces = 0;
        }
        this.labels.value.innerHTML = numberLabel.toFixed(numberOfDecimalPLaces) + slider.getAttribute("unit") ;
        chromeFix_Slider(this.slider.slider);
    }
    init(){
        const element = this.slider.slider;
        if(element.getAttribute("resource")!=undefined){
            fetchDataAsJson(":"+element.getAttribute("port")+element.getAttribute("resource"))
            .then(response => {
                this.setValue(response[element.getAttribute("component")]);
            })
            .catch(err => {
                this.setValue( element.getAttribute("min")+((element.getAttribute("max")-element.getAttribute("min"))/2));
                console.debug(
                    "unable to fetch resource: ",
                    ":"+element.getAttribute("port")+element.getAttribute("resource"), 
                    "\n", 
                    err.message , 
                    element
                );
                //console.error(element,"\n",error.message);
            })
        }else{
            if(element.getAttribute("default")!=undefined){
                this.setValue(element.getAttribute("default"));
            }
        }
    }
    update(){
        console.debug("UPDATING Slider1Handler");
        const element = this.slider.slider;
        if(element.getAttribute("resource")!=undefined){
            this.init();
        }
    }
}

handlers["Slider2Handler"] = class Slider2Handler {
    constructor(element) {
        console.log("CREATING Slider1Handler")

        console.log(this)
    }

    update(){
        this.fetchData(undefined, false);
    }
}