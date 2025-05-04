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

handlers["FileEditorHandler"] = class FileEditorHandler {
    constructor(element) {
        console.log("CREATING FileEditorHandler")

        this.url=element.getAttribute("source-url");

        this.fileBrowser = {
            element:element.getElementsByClassName("fileEditor-browser")[0],
            files:[],
            fileListEl:element.getElementsByClassName("fileEditor-list")[0],
            newFileText:element.getElementsByClassName("add-button-fileName")[0]
        }

        
        
        const fileEditor = element.getElementsByClassName("fileEditor-editor")[0];
        const header = fileEditor.getElementsByClassName("header")[0];
        this.fileEditor  = {
            element:       fileEditor, 
            calledLines:   [],
            header:        header, 
            headerPopup:   fileEditor.getElementsByClassName("popup")[0], 
            deleteButton:  fileEditor.getElementsByClassName("delete-button")[0],
            saveButton:    fileEditor.getElementsByClassName("save-button")[0],
            assignButton:  fileEditor.getElementsByClassName("assign-button")[0],
            fileName:      header.getElementsByClassName("fileName")[0], 
            fileExtension: header.getElementsByClassName("fileExtension")[0],
            code:          null, 
            codeElement:   null
        }
        this.fileEditor.code=CodeMirror.fromTextArea(fileEditor.getElementsByClassName('codeeditor')[0], {
            lineNumbers: true,
            mode: 'text/x-yaml',
            indentUnit: 2,
            readOnly: true,
            extraKeys: {
                "Tab": function(cm) {
                    var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
                    cm.replaceSelection(spaces);
                }
            }
        });
        this.fileEditor.code.refresh()
        this.fileEditor.codeElement=this.fileEditor.code.getWrapperElement().getElementsByClassName("codemirror-code")[0];
        this.runtimeInfo = element.getElementsByClassName("fileEditor-runtime-container")[0];
        this.resizeBar = {
            open:true,
            visible:true,
            element:element.getElementsByClassName("resize-bar")[0],
            hide:null,
        }
        if( this.resizeBar.element!=undefined){
            this.resizeBar.hide = this.resizeBar.element.getElementsByClassName("hide")[0]

            this.resizeBar.hide.onclick = () => this.hideRuntimeToggle(this);
        }
        this.runtime = {
            element:element.getElementsByClassName("runtime-info")[0],
            handler:null,
            originalWidth:"",
            originalDisplay:""
        }
        if( this.runtime.element!=undefined){
            this.runtime.originalWidth= this.runtime.element.style.width
            this.runtime.originalDisplay=this.runtime.element.style.display
        }

        this.connectedToRuntimeInfo = false;

        console.log("FileEditorHandler",this);
        
        this.setButtonState(false)
        
        this.reloadFileList()
        this.resetEditor()
    }

    setButtonState(state){
        if(state){
            this.fileEditor.deleteButton.disabled=undefined;
            this.fileEditor.saveButton.disabled=undefined;
            if(this.fileEditor.assignButton!=undefined){
                this.fileEditor.assignButton.disabled=undefined;
            }
        }else{
            this.fileEditor.deleteButton.disabled=true;
            this.fileEditor.saveButton.disabled=true;
            if(this.fileEditor.assignButton!=undefined){
                this.fileEditor.assignButton.disabled=true;
            }
        }
    }

    addToFileList(name){
        this.fileBrowser.files.push(name)
        return "<li onclick=\"getHandlerObj(this,'FileEditorHandler').loadFileIntoEditor('"+name+"')\">"+name+"</li>";
    }
    selectFile(fileName){
        const fileSelectElements = this.fileBrowser.fileListEl.children
        for (let i = 0; i < fileSelectElements.length; i++) {
            const element = fileSelectElements[i];
            
            element.classList.remove("active")
            if(element.innerHTML == fileName){
                element.classList.add("active")
            }
        }
    }
    clearFileList(){
        this.fileBrowser.files = [];
        this.fileBrowser.fileListEl.innerHTML="";
    }

    async reloadFileList(){
        var files=[]
        try {
            files = await fetchDataAsJson(this.url)
        } catch (err) {
            this.setHeaderPopup("error","error while reloading files:<br>"+err)
            return
        }
        var newInnerHTML = "";
        console.log("reloadFiles ",files)
        for (let i = 0; i < files.length; i++) {
            newInnerHTML+=this.addToFileList(files[i])
        }
        this.fileBrowser.fileListEl.innerHTML = newInnerHTML;
        this.selectFile(this.getCurrFileName());
    }
    resetEditor(){
        this.setButtonState(false)
        this.fileEditor.code.setOption('readOnly', true);
        this.fileEditor.fileName.innerHTML="No file selected";
        this.fileEditor.fileExtension.innerHTML = "";
        this.connectedToRuntimeInfo = false;
    }
    async loadFileIntoEditor(fileName){
        const response = await fetchDataAsJson(this.url+"/"+fileName).catch(err => {
            this.resetEditor();
            console.error('Error while getting file:', err);
            this.fileEditor.fileName.innerHTML="ERROR WHILE OPENING FILE"
            this.fileEditor.code.setValue("");
            this.fileEditor.code.refresh();
            this.setHeaderPopup("error", "error while opening the file:<br>" + err);
            
            return;
        })
        if(response == undefined) return
        this.loadDataIntoEditor(response.name,response.content)
    }
    loadDataIntoEditor(fileName, data, readOnly = false){
        this.resetEditor();

        this.fileEditor.fileName.innerHTML = fileName;
        this.fileEditor.fileExtension.innerHTML = "";

        this.fileEditor.code.setValue(data);
        this.fileEditor.code.setOption('readOnly', readOnly); 
        this.fileEditor.code.refresh();
        this.setButtonState(!readOnly)

        this.setHeaderPopup("ok", "");

        this.selectFile(fileName);
    } 
    async sendCurrentFileToServer(){
        if(this.fileEditor.code.getOption('readOnly')==true){
            this.setHeaderPopup("warning", "Cannot save file while in read only mode");
            return;
        }
        this.sendFile(this.getCurrFileName(),this.getEditorValue());
    }
    async deleteCurrentFile(){
        if(this.fileEditor.code.getOption('readOnly')==true){
            this.setHeaderPopup("warning", "Cannot delete a file while in read only mode");
            return;
        }
        this.deleteFile(this.getCurrFileName());
    }
    async sendFile(fileName,fileData){
        const fileDataObj = {
            name:fileName,
            content:fileData
        }

        const response = await sendData(this.url+"/"+fileName, JSON.stringify(fileDataObj),undefined,"PUT").catch(err => {
            console.error('Error while uploading file:', err);
            this.setHeaderPopup("error", "Error while uploading file:<br>" + err);
            return
        })
        if(await this.handleResponseError(response)){
            return
        }

        this.setHeaderPopup("info", "file "+fileName+" uploaded");
        this.reloadFileList()
    }
    async createNewFile(fileName){
        if(fileName == undefined || fileName == ""){
            fileName = this.fileBrowser.newFileText.value
        }
        console.warn("createNewFile: name:",fileName)
        this.sendFile(fileName,"")
    }
    async deleteFile(fileName){
        const response = await fetchData(this.url+"/"+fileName,undefined,"DELETE").catch(err => {
            console.error('Error while deleting file:', err);
            this.setHeaderPopup("error", "Error while deleting file:<br>" + err);
            return
        })
        if(await this.handleResponseError(response)){
            return
        }

        this.setHeaderPopup("info", "file "+fileName+" deleted");
        this.reloadFileList()
    }

    async assignCurrentFileToScheduler(){
        await this.sendCurrentFileToServer();
        this.runtimeInfo.handler.assignFile(this.getCurrFileName());
    }

    async handleResponseError(response){
        if(response == undefined){
            console.error('Error , no response from server');
            this.setHeaderPopup("error", "Error,<br>no response from server");
            return true
        }
        if(response.status != 200){
            var messageBody=await streamToString(response.body);
            console.error('Error code('+response.status+'):',messageBody);
            this.setHeaderPopup("error", 'Error code('+response.status+'):<br>'+messageBody);
            return true
        }
        return false
    }
    setHeaderPopup(messageType, message){
        this.fileEditor.header.classList = "header " + messageType;
        this.fileEditor.headerPopup.innerHTML = message;
    }
    update(){
        this.reloadFileList();
    }
    getEditorValue(){
        return this.fileEditor.code.getValue()
    }
    getCurrFileName(){
        return this.fileEditor.fileName.innerHTML
    }

    setCalledLines(arrayOfLineNums = []){
        if(this.connectedToRuntimeInfo){
            requestAnimationFrame(() => {
                for (let i = 0; i < this.fileEditor.calledLines.length; i++) {
                    const element = this.fileEditor.calledLines[i];
                    element.classList.remove("called");
                }
                this.fileEditor.calledLines = [];
                for (let i = 0; i < arrayOfLineNums.length; i++) {
                    const lineNum = arrayOfLineNums[i];
                    const targetLine=this.fileEditor.codeElement.children[lineNum-1];
                    targetLine.classList.add("called");
                    this.fileEditor.calledLines.push(targetLine);
                }
            });
        }
        
    }
}

handlers["HostnameTitleHandler"] = class HostnameTitleHandler{
    constructor(element){
        this.element = element.getElementsByClassName("api-fetcher")[0];
    }

    async update(){
        var response;
        try {
            response = await fetchDataAsJson(":"+this.element.getAttribute("port")+this.element.getAttribute("resource"));
            const hostname = response[this.element.getAttribute("component")];
            if(hostname != undefined){
                document.title = "SMPBR-" + hostname;
            }
        } catch (error) {
            document.title = "SMPBR";
        }
    }
}


handlers["RuntimeInfoHandler"] = class RuntimeInfoHandler{
    constructor(element){
        console.log("CREATING RuntimeInfoHandler");
        this.url=element.getAttribute("source-url");
        this.scriptInfo = {
            name:element.getElementsByClassName("selected-script-name")[0],
            contentLines:[],
            processID:element.getElementsByClassName("selected-script-processID")[0],
            callStack:element.getElementsByClassName("call-stack")[0],
            timeStarted:element.getElementsByClassName("selected-script-timeStarted")[0],
            timeElapsed:element.getElementsByClassName("selected-script-timeElapsed")[0],
            console:element.getElementsByClassName("console")[0],
            status:{
                element: element.getElementsByClassName("status")[0],
                string: element.getElementsByClassName("status-string")[0],
                image: element.getElementsByClassName("status-image")[0]
            }
        }
        this.console = {
            cachedMessages:[],
        }
        this.header=element.getElementsByClassName("header")[0]
        this.headerPopup=element.getElementsByClassName("popup")[0]
        this.scriptLoaded=false;

        this.element = element;
        this.fileEditor = undefined;

        
        this.currentPanel = element;
        while(!this.currentPanel.classList.contains("content-panel")){
            this.currentPanel = this.currentPanel.parentElement;
        }

        this.connectedToFileEditor=false;
        //this.addToCallstack(45)

        this.clearConsole()        

        this.reload();
        setInterval(()=>{
            this.reload();
            
        },500);
        console.log("RuntimeInfoHandler",this);
        
    }


    setHeaderPopup(messageType, message){
        this.header.classList = "header " + messageType;
        this.headerPopup.innerHTML = message;
    }
    async handleResponseError(response){
        if(response == undefined){
            console.error('Error , no response from server');
            this.setHeaderPopup("error", "Error,<br>no response from server");
            return true
        }
        if(response.status != 200){
            var messageBody=await streamToString(response.body);
            console.error('Error code('+response.status+'):',messageBody);
            this.setHeaderPopup("error", 'Error code('+response.status+'):'+messageBody);
            return true
        }
        return false
    }

    async start(){
        const response = await sendData(this.url+"/start","").catch(err => {
            console.error('Unable to start script: ', err);
            this.setHeaderPopup("error", "Unable to start script: " + err);
            return
        })
        if(response == undefined){
            return
        }
        if(await this.handleResponseError(response)){
            return
        }

        this.setHeaderPopup("info","script started")
        this.reload()
    }

    async stop(){
        const response = await sendData(this.url+"/stop","").catch(err => {
            console.error('Unable to start stop: ', err);
            this.setHeaderPopup("error", "Unable to stop script: " + err);
            return
        })
        if(response == undefined){
            return
        }

        if(await this.handleResponseError(response)){
            return
        }

        this.setHeaderPopup("info","script stopped")
        this.reload()
    }

    setStatus(status){
        this.scriptInfo.status.string.innerHTML = status;
        this.scriptInfo.status.image.classList.remove("running");
        this.scriptInfo.status.image.classList.remove("stopped");
        this.scriptInfo.status.image.classList.remove("uundefined");
        this.scriptInfo.status.image.classList.add(status);
        switch (status) {
            case "running":
                this.scriptInfo.status.image.innerHTML="clock_loader_10"
                break;
            case "stopped":
                this.scriptInfo.status.image.innerHTML="pause"
                break;
        
            default:
                this.scriptInfo.status.image.innerHTML="help"
                break;
        }
        
    }

    async reload(){
        if(this.currentPanel.classList.contains("hidden")){
            return;
        }
        const response = await fetchDataAsJson(this.url+"/runtime").catch(err => {
            console.error('Error while getting runtime info:', err);
            this.setHeaderPopup("error", "error while getting runtime info:<br>" + err);
            return
        })
        if(response == undefined) return
        this.scriptLoaded=true;
        if(response.name==""){
            this.scriptLoaded=false;
        }
        this.scriptInfo.name.innerHTML=response.name
        this.scriptInfo.processID.innerHTML=response.processId
        this.scriptInfo.timeStarted.innerHTML=response.startedAt
        this.setStatus("undefined")

        if(response.started){
            this.setStatus("running")
        }
        if(response.stopped){
            this.setStatus("stopped")
        }

        this.setConsole(response.output)

        if(this.scriptLoaded){
            const response = await fetchDataAsJson(this.url+"/recipe").catch(err => {
                console.error('Error while getting file:', err);
                this.setHeaderPopup("error", "error while opening the file:<br>" + err);
                return
            })
            if(response == undefined) return

            this.scriptInfo.contentLines = response.content.split("\n");
        }

        this.clearCallstack();
        for (let i = 0; i < response.stack.length; i++) {
            this.addToCallstack(response.stack[i])                
        }
        if(this.fileEditor!=undefined){ 
            this.fileEditor.setCalledLines(response.stack);
        }

        
        
    }

    addToSubspace(element, left, right){
        var body = element.getElementsByClassName("body")[0].children[0]
        body.innerHTML+="<tr><td>"+left+"</td><td>"+right+"</td></tr>"
    }
    changeLineInSubspace(element,index,left,right){
        var body = element.getElementsByClassName("body")[0].children[0]
        body.children[index].innerHTML="<td>"+left+"</td><td>"+right+"</td>"
    }
    clearSubspace(element){
        var body = element.getElementsByClassName("body")[0].children[0]
        body.innerHTML=""
    }
    clearCallstack(){
        this.clearSubspace(this.scriptInfo.callStack);
    }
    addToCallstack(lineNum){
        this.addToSubspace(this.scriptInfo.callStack,lineNum,this.scriptInfo.contentLines[lineNum-1])
    }
    clearConsole(){
        this.clearSubspace(this.scriptInfo.console);
        this.scriptInfo.console.getElementsByClassName("log-counter")[0].innerHTML=0;
        this.console.cachedMessages = [];
    }
    addToConsole(text){
        const textSplit = text.split(" ");
        const timestamp = textSplit[0]+" "+textSplit[1];

        this.addToSubspace(this.scriptInfo.console,timestamp,textSplit[2]);
        var logCount = this.scriptInfo.console.getElementsByClassName("log-counter")[0];
        logCount.innerHTML = Number(logCount.innerHTML) + 1;
        this.console.cachedMessages.push(text)
    }
    setConsole(outputArr){
        requestAnimationFrame(() => {
            this.clearConsole();
            for (let i = outputArr.length-1; i >= 0 ; i--) {
                this.addToConsole(outputArr[i]);
            }
        });
    }

    async connectToFileEditor(){
        this.fileEditor = getHandlerObj(this.element,"FileEditorHandler");

        const response = await fetchDataAsJson(this.url+"/recipe").catch(err => {
            console.error('Error while connecting to file editor:', err);
            this.setHeaderPopup("error", "Error while connecting to file editor:<br>" + err);
            return
        })
        if(response == undefined){
            return
        }
        
        this.fileEditor.loadDataIntoEditor(response.name+" - scheduler cached", response.content, true);
        this.fileEditor.connectedToRuntimeInfo=true;
        this.connectedToFileEditor = true;
    }

    async loadSchedulerFileIntoEditor(){
        await this.reload()
        await this.scriptsHandler.loadSchedulerFileIntoEditor();
        await this.reload()
    }

    async assignFile(fileName){
        const response = await sendData(this.url+"/recipe", '"'+fileName+'"').catch(err => {
            console.error('Unable to assign file:', err);
            this.setHeaderPopup("error", "Error while assigning file:<br>" + err);
            return
        })
        
        if(await this.handleResponseError(response)){
            return
        }

        this.setHeaderPopup("info", "file "+fileName+" assigned to sheduler");
        this.reload()
    }
}