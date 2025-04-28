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

        
        
        const header = element.getElementsByClassName("header")[0];
        this.fileEditor  = {
            element:       element.getElementsByClassName("fileEditor-editor")[0], 
            calledLines:   [],
            header:        header, 
            headerPopup:   element.getElementsByClassName("popup")[0], 
            deleteButton:  element.getElementsByClassName("delete-button")[0],
            saveButton:    element.getElementsByClassName("save-button")[0],
            assignButton:  element.getElementsByClassName("assign-button")[0],
            fileName:      header.getElementsByClassName("fileName")[0], 
            fileExtension: header.getElementsByClassName("fileExtension")[0],
            code:          null, 
            codeElement:   null
        }
        this.fileEditor.code=CodeMirror.fromTextArea(element.getElementsByClassName('codeeditor')[0], {
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

        this.connectedToRuntime=false;

        console.log("FileEditorHandler",this);
        
        this.setButtonState(false)
        
        this.reloadFileList()
        this.resetEditor()
    }

    setButtonState(state){
        if(state){
            this.fileEditor.deleteButton.disabled=undefined;
            this.fileEditor.assignButton.disabled=undefined;
            this.fileEditor.saveButton.disabled=undefined;
        }else{
            this.fileEditor.deleteButton.disabled=true;
            this.fileEditor.assignButton.disabled=true;
            this.fileEditor.saveButton.disabled=true;
        }
    }

    addToFileList(name){
        this.fileBrowser.files.push(name)
        return "<li onclick=\"getHandlerObj(this,'FileEditorHandler').loadFileIntoEditor('"+name+"')\">"+name+"</li>";
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
        this.connectedToRuntime = false;
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

        this.resetEditor();

        this.fileEditor.fileName.innerHTML = response.name;
        this.fileEditor.fileExtension.innerHTML = "";

        this.fileEditor.code.setValue(response.content);
        this.fileEditor.code.setOption('readOnly', false); 
        this.fileEditor.code.refresh();
        this.setButtonState(true)

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
}
