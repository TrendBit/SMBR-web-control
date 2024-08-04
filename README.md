# index.html
html for the website. It also has some utility functions in javascript.

- can be opened from any browser

# graphTest.html
a simple test that spams the API (curently has the URL written into code) with get requests and graphs the "test" attribute in returned json object. The site graphs the last 900 values

- can be run from browser while the node.js testing api is running on 127.0.0.1:8080

# basicFunctions.js
has basic functions for comunicating with the API from client

# chart.js
initializes a simple chart.js chart

# /UI/*
Icons, scetches, ui elements 

# /server/*
a node.js server that uses the "express" package to host an api used for teting. 

- can be run using `node .` command in the */server/* directory
- uses the 8080 port

## libraries
**cors** for achieving a correctly secured connection 
**express** for hosting the API

## licenses
the licenses will be added in future updates
**simple-code-editor**   (MIT)
**VUE.js**               (MIT)


## /test-get (API)
returns a random whole number on a GET request in the following json format: 
```
{
  "test": <random whole number between 0-1000>
}
```

## /test-combined (API)
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
