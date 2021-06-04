# Project: CelOcean
## Group Members: Cole Strain, Vikram Peddinti, Tyler Phung

The goal of our project was to create a 3-D, cel-shaded, ocean environment that could be explored in a boat with the user's choice of music.  The environment itself (specifically, the ocean and its waves) will respond to the music being played at the moment. 

## Division of Work
Tyler: Boat Model / Gameplay / Boundaries / Playtesting
Cole: Cel shader / Scenery Models & Sky / Gameplay / Lighting
Vikram: Ocean shader / Music Player / Music Interpreter

## Instructions
Insert desired mp3 file in assets folder and select it in index.html. Launch scene by running "python3 server.py". To explore the environment, use the WASD keys to navigate the boat. To begin the music, select [n] "Play Music" and [m] "Init Music".

## Key Features
* Cel shader (and textured cel shader) that modifies the Phong shader to emulate less soft shading  
* Ocean shader that exploits sinusoidal movement to show waves  
* Music player that modifies the ocean shader depending on bass volume and tempo  
* Scenery designed and textured in Blender  
* Boat controller with camera following and world boundaries  
* Simple skybox with day/night cycle and revolving sun
