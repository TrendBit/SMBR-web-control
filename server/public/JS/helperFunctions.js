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

async function streamToString(stream) {
    const chunks = [];

    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks).toString("utf-8");
}