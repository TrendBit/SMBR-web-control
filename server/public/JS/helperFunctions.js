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