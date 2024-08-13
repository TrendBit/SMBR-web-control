# how to install
clone this repository
```git clone https://github.com/Kulihrasek456/PB-UI-prototype```
or move files into your directory

## dependecies
only npm and node.js are required, rest of the packages are inside the server files.
```sudo apt-get install npm```


# how to run
run server from /server/* (more info in /server/* chapter)
connect to your server via 8080 port




# /server/*
a node.js server that uses the "express" package to host an api and the web server 

- can be run using `node .` command in the */server/* directory
- uses the 8080 port

# /server/views/index.ejs
the website. It also has some utility functions in javascript.

- can be opened from any browser

# /server/public/basicFunctions.js
has basic functions for comunicating with the API from client

# /server/public/chart.js
initializes a simple chart.js chart

# /server/public/UI/*
Icons, scetches, ui elements 

# /server/configs/*
contains config toml files for dynamic websites

# /server/apiTestUtilities.js 
runs when the /test api endpoint gets called and returns a json object containing the configs

- tries to read the test-config.toml file and tries to parse it to json format, if any of that fails, returns a coresponding error

# /server/views/apiTest.ejs
a simple test for different way to interact with the APIs

- is configured with the test-config.toml





## libraries
**cors** for achieving a correctly secured connection 
**express** for hosting the API
**ejs** for creating dynamic sites
**toml** for converting toml to json

## licenses
the licenses will be added in future updates
**simple-code-editor**   (MIT)
**VUE.js**               (MIT)


## (API)/test-get 
returns a random whole number on a GET request in the following json format: 
```
{
  "test": <random whole number between 0-1000>
}
```

## (API)/test-combined 
a test for hosting multiple methods on a single URL and further sorting the request by Content-Type header.

- can be tested using a REST-API tester (for example SoapUI)
- currently supports multiple methods:
	- GET
		- application/json
			- returns text "GET"
		- text/html
			- returns text "OK"
		- else
			- returns 406 and text "406"
	- POST
		- writes some debug information into Output.json file on server
		- returns text "post"
	- DELTE
		- returns text "delete"
	- PUT
		- returns text "put"
	- PATCH
		- returns text "patch"




