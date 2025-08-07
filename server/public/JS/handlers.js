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


handlers["Popup"] = class Popup {
    constructor(element, text = "debug", type = "info", disapearTimer = undefined){
        let self = this;
        
        if(disapearTimer!=undefined){
            setTimeout(()=>{
                self.disapear();
            }, disapearTimer);
        }

        const popup = document.createElement("div");
        const closeButton = document.createElement("i");

        popup.setAttribute("handler-id", "Popup");
        popup.className = `handler popup ${type}`;

        popup.innerHTML = text.replaceAll("\n", "<br>");
        
        closeButton.className = "popup-closeButton material-icons";
        closeButton.title     = "close popup"
        closeButton.onclick = () => {
            self.disapear();
        };
        closeButton.innerHTML = "close";
        popup.appendChild(closeButton);
        element.appendChild(popup);

        this.element = popup;
    }
    disapear(){
        if(this.element === undefined){
            return;
        }
        this.element.parentNode.removeChild(this.element);
        this.element = undefined;
    }
}

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

handlers["FileEditorHandler"] = class FileEditorHandler {
    constructor(element) {
        console.log("CREATING FileEditorHandler")

        this.url=element.getAttribute("source-url");

        this.fileBrowser = {
            element:element.getElementsByClassName("fileEditor-browser")[0],
            files:[],
            filesRaw:[],
            fileListEl:element.getElementsByClassName("fileEditor-list")[0],
            addButton:{
                newFileText:element.getElementsByClassName("add-button-fileName")[0],
                rolette:element.getElementsByClassName("add-button")[0],
            }

        }

        this.fileClass = class FileEditorHandlerFileClass{
            constructor(name, isDirectory = false){
                this.name = name;
                this.subFiles = {};
                this.isDirectory = isDirectory;
            }

            addSubFile(file, shortFileName = file.name) {
                this.subFiles[shortFileName] = file;
                this.isDirectory = true;
            }

            getHTML(recursionDepth = -1,displayFileName = this.name){
                if(recursionDepth === 0){
                    return "";
                }
                let result = "";
                if(this.isDirectory){
                    const filesArray = Object.entries(this.subFiles).map(([shortFileName, file]) => ({ shortFileName, file }));
                    filesArray.sort((a, b) => {
                        if (a.file.isDirectory && !b.file.isDirectory) return -1;
                        if (!a.file.isDirectory && b.file.isDirectory) return 1;
                        
                        return a.file.name.localeCompare(b.file.name);
                    });

                    result+="<ul full-name=\""+this.name+"\" class=\"closed\">";
                    result+="<div class=\"fileEditor-browser-folderTitle\">";
                        result+="<div class=\"folderTitle-left\" onclick=\"toggleClass_nthParent(this,'closed',2)\">";
                            result+="<h2>"+displayFileName+"</h2>";
                            result+="<i class=\"material-icons folderTitle-collapser\" title=\"collapse/extend folder\">keyboard_arrow_down</i>";
                        result+="</div>";
                        result+="<div class=\"folderTitle-right\" >";
                            result+="<i onclick=\"getHandlerObj(this,'FileEditorHandler').prepareNewFileCreation('"+this.name+"')\" ";
                            result+="class=\"material-icons folderTitle-create\" title=\"create file in this folder\">+</i>";
                        result+="</div>";
                    result+="</div>";
                    filesArray.forEach(({ shortFileName, file }) => {
                        result+= file.getHTML(recursionDepth-1,shortFileName);
                    });
                    result+="</ul>";
                }else{
                    result+="<li full-name=\""+this.name+"\" onclick=\"getHandlerObj(this,'FileEditorHandler').loadFileIntoEditor('"+this.name+"')\">"+displayFileName+"</li>";
                }
                return result;
            }

            getHTML_alt(recursionDepth = -1,displayFileName = this.name){
                if(recursionDepth === 0){
                    return "";
                }
                let result = "";
                if(this.isDirectory){
                    result+="<ul full-name=\""+this.name+"\" class=\"closed\">";
                    result+="<div class=\"fileEditor-browser-folderTitle\" onclick=\"getHandlerObj(this,'FileEditorHandler').twoCol_changeFolder('"+displayFileName+"')\">";
                        result+="<div class=\"folderTitle-left\">";
                            result+="<h2>"+displayFileName+"</h2>"
                            result+="<i class=\"material-icons\" title=\"collapse/extend folder\">chevron_right</i>"
                        result+="</div>"
                    result+="</div>"
                    for(let shortFileName in this.subFiles){
                        result+= this.subFiles[shortFileName].getHTML_alt(recursionDepth-1,shortFileName);
                    }
                    result+="</ul>";
                }
                return result;
            }
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

        const self = this;
        this.fileEditor.code=CodeMirror.fromTextArea(fileEditor.getElementsByClassName('codeeditor')[0], {
            lineNumbers: true,
            mode: element.getAttribute("language"),
            indentUnit: 4,
            readOnly: true,
            extraKeys: {
                "Tab": function(cm) {
                    var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
                    cm.replaceSelection(spaces);
                },
                "Ctrl-S": (cm) => self.sendCurrentFileToServer(),
                "Cmd-S": (cm) => self.sendCurrentFileToServer(),
            }
        });
        
        this.fileEditor.code.on("change", function(cm, change) {
            if(!self.fileEditor.code.isClean()){
                self.setHeaderPopup("warning","unsaved changes");
                self.setAssignButtonState(false);
            }
            // Tady můžeš volat isClear(), nastavit "dirty" flag, atd.
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

        this.twoCol ={
            active: element.getAttribute("two-column") === "true",
            fileListEl: undefined,
            currFolder: undefined
        }
        this.twoCol.fileListEl = (this.twoCol.active)?element.getElementsByClassName("fileEditor-browser-folders-list")[0]:undefined;

        console.log("FileEditorHandler",this);
        
        this.setButtonState(false)
        
        this.reloadFileList()
        this.resetEditor()
    }

    setButtonState(state){
        if(state){
            if(this.fileEditor.deleteButton!=undefined){
                this.fileEditor.deleteButton.disabled=undefined;
            }
            this.fileEditor.saveButton.disabled=undefined;
            
        }else{
            if(this.fileEditor.deleteButton!=undefined){
                this.fileEditor.deleteButton.disabled=true;
            }
            this.fileEditor.saveButton.disabled=true;
            
        }
        this.setAssignButtonState(state);
    }
    
    setAssignButtonState(state){
        if(this.fileEditor.assignButton!=undefined){
            this.fileEditor.assignButton.disabled=(state)?undefined:true;
        }
        
    }

    selectFile(fileName, fileSelectElements = this.fileBrowser.fileListEl.children){
        for (let i = 0; i < fileSelectElements.length; i++) {
            const element = fileSelectElements[i];
            const elementFullName = element.getAttribute("full-name");
            
            element.classList.remove("active")
            if(elementFullName === fileName){
                element.classList.add("active")
            }
            this.selectFile(fileName,element.children);
        }
    }
    clearFileList(){
        this.fileBrowser.files = [];
        this.fileBrowser.fileListEl.innerHTML="";
    }

    twoCol_changeFolder(folderName){
        let path = folderName.split("|");
        let target = this.fileBrowser.files;
        for (let i = 0; i < path.length; i++) {
            const pathSegment = path[i];
            target = target.subFiles[pathSegment];
        }
        this.twoCol.currFolder = target;
        console.log("FileEditorHandler - changed current folder to",target);
        this.reloadFileList(undefined, true);
    }

    async reloadFileList(reloadFromDisk = false, forcedReload = false){
        var files=[]
        try {
            files = await fetchDataAsJson(this.url,undefined,(reloadFromDisk)?"PATCH":"GET");
        } catch (err) {
            this.setHeaderPopup("error","error while reloading files:<br>"+err)
            return
        }

        if(reloadFromDisk){
            this.setHeaderPopup("info","files were succesfully reloaded from disk");
        }

        if(this.fileBrowser.filesRaw.length==files.length){
            let changeDetected = forcedReload;
            for (let i = 0; i < files.length; i++) {
                if(files[i] != this.fileBrowser.filesRaw[i]){
                    changeDetected=true;
                    break;
                }
            }
            if(!changeDetected){
                return;
            }
        }

        this.fileBrowser.filesRaw=files;
        

        this.fileBrowser.files= new this.fileClass("root",true);
        for (let i = 0; i < files.length; i++) {
            let file = files[i];

            let filePath = file.split("|");
            let target = this.fileBrowser.files;
            let usedPath = "";
            for (let i = 0; i < filePath.length-1; i++) {
                const element = filePath[i];
                usedPath += element + "|";
                if(target.subFiles[element] == undefined){
                    target.addSubFile(new this.fileClass(usedPath,true),element);
                }
                target = target.subFiles[element];
            }
            let shortFileName = filePath[filePath.length-1];
            target.addSubFile(new this.fileClass(file),shortFileName);
        }

        /*var newInnerHTML = "";
        console.log("reloadFiles ",files)
        for (let i = 0; i < files.length; i++) {
            newInnerHTML+=this.addToFileList(files[i])
        }*/
        if(this.twoCol.active){
            this.twoCol.fileListEl.innerHTML = this.fileBrowser.files.getHTML_alt(2);      
            if(this.twoCol.currFolder != undefined){
                this.fileBrowser.fileListEl.innerHTML = this.twoCol.currFolder.getHTML();
                this.selectFile(this.twoCol.currFolder.name,this.twoCol.fileListEl.children);
            }      
        }else{
            this.fileBrowser.fileListEl.innerHTML = this.fileBrowser.files.getHTML();
        }
        this.selectFile(this.getCurrFileName());
        writeChangesToDeviceCache("fileEditors"+this.url+"/files",this.fileBrowser.files);
    }
    resetEditor(){
        this.setButtonState(false)
        this.fileEditor.code.setOption('readOnly', true);
        this.fileEditor.fileName.innerHTML="No file selected";
        this.fileEditor.fileExtension.innerHTML = "";
        this.connectedToRuntimeInfo = false;
    }
    async loadFileIntoEditor(fileName){
        const response = await fetchDataAsJson(this.url+"/"+encodeURIComponent(fileName)).catch(err => {
            this.resetEditor();
            console.error('Error while getting file:', err);
            this.fileEditor.fileName.innerHTML="ERROR WHILE OPENING FILE"
            this.fileEditor.code.setValue("");
            this.fileEditor.code.refresh();
            if(err.response != undefined){
                this.handleResponseError(err.response);
            }else{
                this.setHeaderPopup("error", "error while opening the file:<br>" + err);
            }
            
            return;
        })
        if(response == undefined) return
        this.loadDataIntoEditor(response.name,response.content)
    }
    loadDataIntoEditor(fileName, data, readOnly = false){
        if(this.checkChangesAbort()) return;

        this.resetEditor();

        this.fileEditor.fileName.innerHTML = fileName.replaceAll("|","/");
        this.fileEditor.fileExtension.innerHTML = "";

        this.fileEditor.code.setValue(data);
        this.fileEditor.code.setOption('readOnly', readOnly); 
        this.fileEditor.code.refresh();
        this.setButtonState(!readOnly)

        this.selectFile(fileName);
        
        this.fileEditor.code.markClean();
        this.resetHeaderPopup();
    } 
    async sendCurrentFileToServer(){
        if(this.fileEditor.code.getOption('readOnly')==true){
            this.setHeaderPopup("warning", "Cannot save file while in read only mode");
            return;
        }
        if(await this.sendFile(this.getCurrFileName(),this.getEditorValue()) === 0){
            this.setAssignButtonState(true);
        }
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

        const response = await sendData(this.url+"/"+encodeURIComponent(fileName), JSON.stringify(fileDataObj),undefined,"PUT").catch(err => {
            console.error('Error while uploading file:', err);
            this.setHeaderPopup("error", "Error while uploading file:<br>" + err);
            return 1;
        })
        if(await this.handleResponseError(response)){
            return 2;
        }

        this.setHeaderPopup("info", "file "+fileName+" uploaded");
        this.reloadFileList()

        this.fileEditor.code.markClean();
        return 0;
    }
    checkChangesAbort(){
        if(!this.fileEditor.code.isClean()){
            return !window.confirm("you have unsaved changes, do you want to continue?");
        }
        return false;
    }
    async createNewFile(){
        let fileName = this.fileBrowser.addButton.newFileText.value.replaceAll("/","|");
        for (let i = 0; i < this.fileBrowser.filesRaw.length; i++) {
            const file = this.fileBrowser.filesRaw[i];
            if(file == fileName){
                this.setHeaderPopup("warning","file \""+fileName+"\" allready exists!<br>No file was created or changed.");
                return
            }
        }
        this.sendFile(fileName,"");
        this.fileBrowser.addButton.newFileText.value = "";
        this.fileBrowser.addButton.rolette.classList.remove("activated");
        this.fileEditor.code.markClean();
    }

    async prepareNewFileCreation(presetPath = ""){
        this.fileBrowser.addButton.rolette.classList.add("activated");
        this.fileBrowser.addButton.newFileText.value = presetPath.replaceAll("|","/");
    }

    async deleteFile(fileName){
        if(this.checkChangesAbort()) return;
        const response = await fetchData(this.url+"/"+encodeURIComponent(fileName),undefined,"DELETE").catch(err => {
            console.error('Error while deleting file:', err);
            this.setHeaderPopup("error", "Error while deleting file:<br>" + err);
            return
        })
        if(await this.handleResponseError(response)){
            return
        }

        this.setHeaderPopup("info", "file "+fileName+" deleted");
        this.reloadFileList();

        this.fileEditor.code.markClean();
    }

    async assignCurrentFileToScheduler(){
        await this.runtimeInfo.handler.assignFile(this.getCurrFileName());
    }

    async handleResponseError(response){
        if(response == undefined){
            console.error('Error , no response from server');
            this.setHeaderPopup("error", "Error,<br>no response from server");
            return true
        }
        if(response.status != 200){
            var messageBody=await streamToString(response.body);
            if(response.status == 500){
                this.setHeaderPopup("error",messageBody);
            }else{
                this.setHeaderPopup("error", 'Error('+response.status+'):<br>'+messageBody);
            }
            console.error('Error('+response.status+'):',messageBody);
            return true
        }
        return false
    }

    resetHeaderPopup(){
        if(this.fileEditor.code.isClean()){
            this.setHeaderPopup("ok","");
        }else{
            this.setHeaderPopup("warning","unsaved changes");
        }
    }
    setHeaderPopup(messageType, message){
        this.fileEditor.header.classList = "header " + messageType;
        this.fileEditor.headerPopup.innerHTML = message;

        if(messageType=="info"){
            setTimeout(() => {
                if(this.fileEditor.headerPopup.innerHTML == message 
                && this.fileEditor.header.classList.contains(messageType)){
                    this.resetHeaderPopup();
                }
            }, 2000);
        }
    }
    update(){
        this.reloadFileList();
    }
    getEditorValue(){
        return this.fileEditor.code.getValue()
    }
    getCurrFileName(){
        return this.fileEditor.fileName.innerHTML.replaceAll("/","|");
    }

    setCalledLines(arrayOfLineNums = []){
        if(this.connectedToRuntimeInfo){
            requestAnimationFrame(() => {
                for (let i = 0; i < this.fileEditor.calledLines.length; i++) {
                    const element = this.fileEditor.calledLines[i];
                    const calledLineID = this.fileEditor.calledLines.length-i;
                    element.classList.remove("called");
                    element.classList.remove("called"+calledLineID);
                }
                this.fileEditor.calledLines = [];
                for (let i = 0; i < arrayOfLineNums.length; i++) {
                    const lineNum = arrayOfLineNums[i];
                    const calledLineID = arrayOfLineNums.length-i;

                    const targetLine=this.fileEditor.codeElement.children[lineNum-1];
                    targetLine.classList.add("called");
                    targetLine.classList.add("called"+calledLineID);
                    this.fileEditor.calledLines.push(targetLine);
                }
            });
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

        this.scriptPreview = {
            name: "",
            code: null,
            codeElement: null,
            calledLines: []
        }

        this.scriptPreview.code = CodeMirror.fromTextArea(element.getElementsByClassName('scriptPreview')[0], {
            lineNumbers: true,
            mode: element.getAttribute("language"),
            indentUnit: 2,
            readOnly: true,
            extraKeys: {
            }
        });
        this.scriptPreview.code.refresh();
        this.scriptPreview.codeElement=this.scriptPreview.code.getWrapperElement().getElementsByClassName("codemirror-code")[0];

        this.clearConsole()        

        this.reload();
        setInterval(()=>{
            this.reload();
        },500);
        console.log("RuntimeInfoHandler",this);
        
    }

    resetHeaderPopup(){
        this.setHeaderPopup("ok","");
    }
    setHeaderPopup(messageType, message){
        this.header.classList = "header " + messageType;
        this.headerPopup.innerHTML = message;


        if(messageType=="info"){
            setTimeout(() => {
                if(this.headerPopup.innerHTML == message 
                && this.header.classList.contains(messageType)){
                    this.resetHeaderPopup();
                }
            }, 2000);
        }
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
            if(response.status == 500){
                this.setHeaderPopup("error",messageBody);
            }else{
                this.setHeaderPopup("error", 'Error('+response.status+'):<br>'+messageBody);
            }
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
            console.error('Unable to stop script: ', err);
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

    async pause(){
        const response = await sendData(this.url+"/pause","").catch(err => {
            console.error('Unable to pause script: ', err);
            this.setHeaderPopup("error", "Unable to pause script: " + err);
            return
        })
        if(response == undefined){
            return
        }

        if(await this.handleResponseError(response)){
            return
        }

        this.setHeaderPopup("info","script paused")
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
                this.scriptInfo.status.image.innerHTML="stop_circle"
                break;
        
            default:
                this.scriptInfo.status.image.innerHTML="help"
                break;
        }
        
    }

    async reload(){
        if(this.currentPanel.classList.contains("hidden") || !updateSwitch){
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
        if(response.name != this.scriptPreview.name){
            this.scriptPreview.name = response.name;
            this.reloadScriptPreview();
        }
        this.scriptInfo.name.innerHTML=response.name.replaceAll("|","/");
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
        this.setCalledLines(response.stack.slice(-2));      
        
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
        const timestamp = text.slice(0,19);

        this.addToSubspace(this.scriptInfo.console,timestamp,text.slice(19));
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

        this.fileEditor.setHeaderPopup("info","successfully connected to runtime info");
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
        this.scriptPreview.name = "";
        await this.reload();

        //this.connectToFileEditor();
    }

    async reloadScriptPreview(){
        const response = await fetchDataAsJson(this.url+"/recipe").catch(err => {
            console.error('Unable to get selected script content:', err);
            this.setHeaderPopup("error", "Error while getting selected script content:<br>" + err);
            return
        })
        if(response == undefined){
            return
        }

        this.scriptPreview.code.setValue(response.content);
        this.scriptPreview.code.refresh();

        this.fileEditor.setHeaderPopup("info","successfully connected to runtime info");

        this.setHeaderPopup("info", "file "+fileName+" assigned to sheduler");
    }


    setCalledLines(arrayOfLineNums = []){
        requestAnimationFrame(() => {
            for (let i = 0; i < this.scriptPreview.calledLines.length; i++) {
                const element = this.scriptPreview.calledLines[i];
                const calledLineID = this.scriptPreview.calledLines.length-i;
                element.classList.remove("called");
                element.classList.remove("called"+calledLineID);
            }
            this.scriptPreview.calledLines = [];
            for (let i = 0; i < arrayOfLineNums.length; i++) {
                const lineNum = arrayOfLineNums[i];
                const targetLine=this.scriptPreview.codeElement.children[lineNum-1];

                const calledLineID = arrayOfLineNums.length-i;
                targetLine.classList.add("called");
                targetLine.classList.add("called"+calledLineID);
                this.scriptPreview.calledLines.push(targetLine);
            }
        });
        
    }
}

handlers["AutoGridHandler"] = class AutoGridHandler{
    constructor(element) {
        console.log("CREATING AutoGridHandler")

        this.element = element
        this.lastClientHeights = []
        requestAnimationFrame(() => {
            this.update();
        });


        console.log(this)
    }

    
    update(){
        let overflow_detected = false
        let had_effect = false
        for (let i = 0; i < this.element.children.length; i++) {
            const child = this.element.children[i];
            if(child.clientHeight<child.scrollHeight){
                if(child.style.gridRow!=""){
                    const gridRow = child.style.gridRow;
                    const gridRowSpan = Number(gridRow.split(" ")[1])
                    child.style.gridRow = "span "+(gridRowSpan+1);
                    overflow_detected = true
                }else{
                    child.style.gridRow = "span 1"
                }

            }
            if(this.lastClientHeights[i] !== child.clientHeight){
                this.lastClientHeights[i] = child.clientHeight;
                had_effect = true
            }
        }
        console.warn("AutoGridHandler update");
        if(overflow_detected && had_effect){
            requestAnimationFrame(() => {
                this.update();
            });
        }
    }
}