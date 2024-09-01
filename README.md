# now added

extremely simple validation, when saving a file, the server tries to parse it to yaml, if it fails, it sends a err500. if it succeeds it tryes to validate it using the databse_exporter.yaml and sends a 400 if that fails.

# about
this repo is for the web control system.

It allows the user to setup experiments and view data from the isntalled modules in a graphical UI.
___
# how to use
to connect to the website, you can use any web browser.
#### dashboard
- Temperature widget
	- shows the current temperature of multiple snesors
	- can be used to set certain modules target temperature

#### experiments
- editing, creating new and deleting experiment configurations

#### configs
- editing existing config files for a number of systems

#### device
- viewing raw data and setting advanced settings on specific modules
___
# how to install
clone this repository into you desired directory
```
git clone git@github.com:TrendBit/SMBR-web-control.git
```

if you don't have npm installed, install it
```
sudo apt-get install npm
```
___

# how to run
make sure that the **80 port** is free

run server 
```
npm start --prefix ~/path/to/the/server/directory &
```
__the server does not support HTTPS protocol__
___

the web control system uses a number of packages, fonts and libraries that require their license to be shipped with the finished product
all of their licenses are inside the licenses folder