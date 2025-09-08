# Changelog SMBR Web Control
This version number is trying to stick to the __MAJOR__.__MINOR__ identifiers but there are some exceptions (marked with a prefix # in the MINOR part).

# 0.2.5
- most of the NodeJS server command line outputs were disabled (can be shown by running the server with the -v option)
- fixed information being displayed in wrong format (for instance, short ID "8e67" being displayed as "8e+67")
- added StatusIndicator at the top-right corner. It provides information about currently active errors and warnings.
- added auto-scroll to some text fields that overflow frequently
- fixed incorrect control of shown data in TemperatureWidget chart
- fixed most graphical problems on the safari browser

# 0.2.4
- added an add button to folders to allow easier and faster file creation
- called lines are now distinguished by color brightness.
- icons are no longer selectable as text
- temperatureWidget "folders" that don't have any temperature associated with them no longer allow the user to select them and show them in the chart
- added a new widget: `Quick launch` that allows the user to quickly review if a recipe is running, start stop and pause it, and launch a macro if needed (macros are normal recipes stored in the macros subfolder)

# 0.2.3
- added a different layout for config supporting multiple subDirectories while still being uncluttered
- creating files with the create button now supports `/` character to create subfolders
- A button was added to the FileEditor to reload files from disk (using the patch api endpoint)
- added support for multiple directories in recipes data folder. Diplayed folders can be collapsed for better visibility.
- Kinetic fluorometer exported data files vere renamed to include the following data in the given order: hostname, SID, measurementID, timestamp, separated by "_".

# 0.2.2
- added a warning when there are unsaved changes. Also locked the select script button when there are unsaved changes.
- added support for pausing scripts using RuntimeInfo
- removed "link to file editor" button in RuntimeInfo as its no longer needed
- selected script preview and call stack highlighting has been moved to RuntimeInfo
- fileEditor [tab] key now increments by 4 spaces instad of 2
- minor changes in textEditor button hints
- control widget now supports setting mixer rpm directly
- a scrollbar was added to file list in file editor
- animations in Kinematic fluorometers graph were disabled

# 0.2.1
- added a way to toggle charted temperature data
- string syntax highlighting color changed to be more visible
- text editor can now be saved by using ctrl + s (cmnd + s on mac)
- runtime info is now open by default
- fixed a bug where logs in runtime info are shown only until the first space.

# 0.2.0
- removed units for specrometer absolute values
- fixed path to config files (so the config editor is now working)
- added support for toml language in config files
- Spectrofotometer name is unified across the website. So is LedPanel.
- server can now be run with -d to enable debug mode
- loaded modules are now completely empty when the server loses connection to api (don't contain debug virtual module)
- website title now contains the devices hostname
- most icons were replaced by google material icons
- added a new FileEditor system with runtime info tab. To use it, you have to create a script, assign it to the scheduler and start it.
- Runtime info includes a way to connect to FileEditor and display call stack in real time.
- current webConfig is no longer stored in webConfig.yaml file
- added IP address printout to hotbar
- telegraf service in Service status was replaced by reactor-database-export
- added a new way to control heater target temperature (located in Control widget)
- temperature widget no longer has set target and reset inputs
- changed the temperature widget chart to use a relative timestamp (relative to server time).
- changed temperature-graph and temperature-graph-recent endpoints
- increased granuality of day scope to 96 logs/day
- title now says Smart Modular Photo-Bio-Reactor instead of PhenoBottle which was the WIP name for the project.
- icons no longer have a faint colored box around them (some now have a faint white outline)

# 0.1.9
- modules cannot be loaded multiple times
- modules allways get listed in the same order
- lowered number of reconnect tries while not connected to API to 10

# 0.1.8
- sliders now update in realtime (can be buggy)
- added refresh buttons to most widgets
- fixed site not loading on context change
- added automatic refresh on context change
- transmissive spectrometer reading changed, expect longer loading times but no hostname flickering
- fluoroCurve x range fixed
- added reset button to temperature widget


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