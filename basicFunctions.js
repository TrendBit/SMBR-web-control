function fetchData(url) { //wierd method, dont use
    fetch('http://localhost:8080/'+url)
        .then(response => response.json())
        .then(response => {
            console.log(response);
        })
        .catch(error => console.error('Error fetching data:', error));            
}

async function readData(url, method) {
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        console.log('Úspěch:', result);
        return result;
    } catch (error) {
        console.error('Chyba:', error);
    }
}

async function sendData(url, data, method) {
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        console.log('Úspěch:', result);
        return result;
    } catch (error) {
        console.error('Chyba:', error);
    }
}