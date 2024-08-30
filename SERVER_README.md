
# /server/*
a node.js server that uses the "express" package to host an api and the web server 

- can be run using `node .` command in the */server/* directory
- uses the 80 port

## /server/views/index.ejs
the website. It also has some utility functions in javascript.


## /server/public/chart.js
initializes a simple chart.js chart

## /server/public/UI/*
Icons, sketches, ui elements 

## /server/configs/*
contains config toml files for dynamic websites

## /server/apiTestUtilities.js 
runs when the /test api endpoint gets called and returns a json object containing the configs

- tries to read the test-config.toml file and tries to parse it to json format, if any of that fails, returns a coresponding error

## /server/views/apiTest.ejs
a simple test for different way to interact with the APIs

- is configured with the test-config.toml





## libraries
**cors** for achieving a correctly secured connection 
**express** for hosting the API
**ejs** for creating dynamic sites
**toml** for converting toml to json

___
# API

## (API)/delete-file
enables the user to delete (unlink) files on the node server by sending a special request

__headers__
**target-directory** sets the target directory, can only be one of the allowed directories set in the endpoint functions and returns a 403 error if its not.
**file-name** sets the file name, must not be blank and returns a 400 error if not used correctly, if the file doesn't exist, it sends a 122 error.


## (API)/send-file
enables the user to send and overwrite files to the node server by sending a special request
creates a new file if it doesn't exist

__headers__
**target-directory** sets the target directory, can only be one of the allowed directories set in the endpoint functions and returns a 403 error if its not.
**file-name** sets the file name, must not be blank and returns a 400 error if not used correctly


__body__
**contains the file data in utf8 text format**


## (API)/file-list
returns an JSON array of file names in the requested directory

__headers__ 
**target-directory** sets the target directory, can only be one of the allowed directories set in the endpoint functions and returns a 403 error if its not.


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




