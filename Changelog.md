# Changelog SMBR Web Control
This version number is trying to stick to the __MAJOR__.__MINOR__ identifiers but there are some exceptions (marked with a prefix # in the MINOR part).

# 0.1.7
- fixed ServiceStatus not loading
- added support for fluoroCurve oajip endpoints
- added support for new spectrometer endpoints

# 0.1.6 hotfix
- fixed numerous bad entrys in configs
- cleaned console output
- implemented remaining module temperature and load enpoints

# 0.1.6
- temperature chart rework (it is cached on the server and streamed to client)

# 0.1.5.1
- updated new test menu
- added `slider2 handlers`, `enforceMin` and `enforceMax`
- fixed some UI issues

# 0.1.5.1
- added units to kinetic fluorometer chart and a zoom feature using the `chartjs-plugin-zoom` plugin

# 0.1.5
- added a new widget - kinetic fluorometer

# 0.1.4
- added refresh button framework for widgets in dashboard panel and device panel

# 0.1.3
- added reset buttons to every module
- added set all to 0 button to LedArray widget
- cosmetical changes to header-right part of widget

# 0.1.2
- added a basic refresh that fetches new modules from the restAPI
    - calls the moduleApiUpdateWorkerUpdate function which updates the modules but calls nodejsAPI/module-list-refresh which resets the unsuccessfullReloads to 0 and calls the reloadModules fucntion that subsequently calls the initalize function that fetches new modules from the restAPI (#TODO simplify and rewrite) 

# 0.1.1 
- added a new framework for widget header data fields and buttons
    - disapears when not used
- added a new framework for widget errors
    - disapears when not used
- added `noBorder` and `noBg` global classes that disable background or border

# 0.1 basic structure
- Dashboard panel
    - `Temperature`, `Optical density meter`, `Control` and `LedArray` widgets
- TextEditor panel
    - used in `experiments` and `config` panels
- Device panel
    - *prototype version*