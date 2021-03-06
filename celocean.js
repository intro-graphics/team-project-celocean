import {defs, tiny} from './examples/common.js';
import {Shape_From_File} from './examples/obj-file-demo.js'

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Texture, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class CelOcean extends Scene {
    constructor(music_src) {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        //Modified constructor where the music src is passed into us.
        this.audioElement = music_src;

        const initial_corner_point = vec3(-1, -1, 0);
        const row_operation = (s, p) => p ? Mat4.translation(0, .1, 0).times(p.to4(1)).to3()
            : initial_corner_point;
        const column_operation = (t, p) => Mat4.translation(.1, 0, 0).times(p.to4(1)).to3();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            torus: new defs.Torus(15, 15),
            torus2: new defs.Torus(3, 15),
            circle: new defs.Regular_2D_Polygon(1, 15),
            sphere: new defs.Subdivision_Sphere(4),
            axis: new defs.Axis_Arrows(),
            yoyo: new Shape_From_File("assets/Yoyo/yoyo.obj"),
            volcano: new Shape_From_File("assets/Volcano/volcano.obj"),
            crabrock: new Shape_From_File("assets/CrabRock/CrabRock.obj"),
            building: new Shape_From_File("assets/Building/Building.obj"),
            lagoon: new Shape_From_File("assets/Lagoon/Lagoon.obj"),
            santorini: new Shape_From_File("assets/Santorini/Santorini.obj"),
            ocean: new defs.Grid_Patch(100, 100, row_operation, column_operation),
			boat: new Shape_From_File("assets/Boat/Boat.obj")
        };

        // *** Materials
        this.materials = {
            sun: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 0, specularity: 0, color: hex_color("#FCD440")}),
            sphere: new Material(new defs.Cel_Shader(),
                {ambient: .7, diffusivity: .3, specularity: 0.35, smoothness: 40, 
                    low_threshold: -0.01, high_threshold: 0.01, 
                    low_specular: 0.9, high_specular: 0.95,
                    color: hex_color("#ffffff")}),
            axis: new Material(new defs.Cel_Shader(),
                {ambient: .6, diffusivity: .5, specularity: 0, color: hex_color("#ffffff")}),
            sky: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 0, specularity: 0, color: hex_color("#87CEEB")}),
            outline: new Material(new defs.Phong_Shader(),
                {ambient: 0, diffusivity: 0, specularity: 0, color: hex_color("#000000")}),
            volcano: new Material(new defs.Textured_Cel(), 
                {color: color(.1,.1,.1, 1), ambient: 0.8, diffusivity: .4, specularity: 0,
                low_threshold: -0.01, high_threshold: 0.01, 
                texture: new Texture("assets/Volcano/Volcano.png")}),
            crabrock: new Material(new defs.Textured_Cel(), 
                {color: color(.1,.1,.1, 1), ambient: 0.8, diffusivity: .4, specularity: 0,
                low_threshold: -0.01, high_threshold: 0.01, 
                texture: new Texture("assets/CrabRock/CrabRock.png")}),
            building: new Material(new defs.Textured_Cel(), 
                {color: color(.1,.1,.1, 1), ambient: 0.8, diffusivity: .4, specularity: 0,
                low_threshold: -0.01, high_threshold: 0.01, 
                texture: new Texture("assets/Building/Building.png")}),
            lagoon: new Material(new defs.Textured_Cel(), 
                {color: color(.1,.1,.1, 1), ambient: 0.8, diffusivity: .4, specularity: 0,
                low_threshold: -0.01, high_threshold: 0.01, 
                texture: new Texture("assets/Lagoon/Lagoon.png")}),
            santorini: new Material(new defs.Textured_Cel(), 
                {color: color(.1,.1,.1, 1), ambient: 0.8, diffusivity: .4, specularity: 0,
                low_threshold: -0.01, high_threshold: 0.01, 
                texture: new Texture("assets/Santorini/Santorini.png")}),
            ocean: new Material(new defs.Ocean_Shader(),
                {ambient: .7, diffusivity: .3, specularity: 0.35, smoothness: 40, 
                    low_threshold: -0.01, high_threshold: 0.01, 
                    low_specular: 0.9, high_specular: 0.95,
                    color: hex_color("#ffffff")}),
			boat: new Material(new defs.Cel_Shader(),{
                color: color(0.25,.1,0, 1), ambient: 0.8, diffusivity: .4, specularity: 0,
                low_threshold: -0.01, high_threshold: 0.01, 
                color: hex_color("#5e4329")})
        }
        // If N*L is under low_threshold, diffused light is 0.
        // If N*L is over high_threshold, diffused light is maxed.
        // If N*L is between the thresholds, diffused light is interpolated from 0 to max.
        // Same idea with specularity for N*H and low_specular & high_specular
        // For reference, N*L = 0 is when the light is perpendicular to the normal.

        this.paused = false;
        this.t = 0.0;
        this.amplitude = 1;
        this.ampMultiplier = 1;
        this.wavelength = 0.5;
        this.init_music_system();
        this.boat_location_x = 10;
        this.boat_location_z = 7.5;
        this.boat_rotation = Math.PI;
        this.daySky = color(135/256, 206/256, 235/256, 1);
        this.nightSky = color(20/256, 24/256, 82/256, 1);
        this.daylight = color(1,1,1,1);
        this.nightlight = hex_color("#93c9ed");
        this.initial_camera_location = Mat4.look_at(vec3(10, 0.075, 7.9), vec3(5, 0, 7.5), vec3(0, 1, 0));
        this.move_speed = 0.02;
        this.rotate_speed = Math.PI / 32;
        this.forwardVec = vec(0, -this.move_speed);
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Pause light revolution", ["e"], () => this.paused = !this.paused);
        this.key_triggered_button("Inc. Amplitude", ["i"], () => this.ampMultiplier += 0.1);
        this.key_triggered_button("Dec. Amplitude", ["k"], () => this.ampMultiplier -= 0.1);
        this.key_triggered_button("Inc. Wavelength", ["l"], () => this.wavelength += 0.1);
        this.key_triggered_button("Dec. Wavelength", ["j"], () => this.wavelength -= - 0.1);
        this.key_triggered_button("Play Music", ["n"], () => this.audioElement.play());
        this.key_triggered_button("Init Music", ["m"], () => this.audioCtx.resume());

        // MOVEMENT
        this.key_triggered_button("Forward", ["w"], () => this.moveBoat(true));
        this.key_triggered_button("Backward", ["s"], () => this.moveBoat(false));
        this.key_triggered_button("Turn Left", ["a"], () => this.rotateBoat(true));
        this.key_triggered_button("Turn Right", ["d"], () => this.rotateBoat(false));
    }

    moveBoat(forward) {
        // console.log(this.forwardVec);
        // check if moving forward and see if movement would put boat out of bounds
        if (forward == true) {
            if (this.boat_location_x + this.forwardVec[0] > 14 || this.boat_location_x + this.forwardVec[0] < 4 || this.boat_location_z + this.forwardVec[1] > 9 || this.boat_location_z + this.forwardVec[1] < -1) {
                console.log("Out of Bounds!");
            }
            else {
                this.boat_location_x += forward ? this.forwardVec[0] : -this.forwardVec[0];
                this.boat_location_z += forward ? this.forwardVec[1] : -this.forwardVec[1];
            }
        }
        // check if moving backwards and see if movement would put boat out of bounds
        else if (forward == false) {
            if (this.boat_location_x - this.forwardVec[0] > 14 || this.boat_location_x - this.forwardVec[0] < 4 || this.boat_location_z - this.forwardVec[1] > 9 || this.boat_location_z - this.forwardVec[1] < -1) {
                console.log("Out of Bounds!");
            }
            else {
                this.boat_location_x += forward ? this.forwardVec[0] : -this.forwardVec[0];
                this.boat_location_z += forward ? this.forwardVec[1] : -this.forwardVec[1];
            }
        }
    }

    rotateBoat(clockwise) {
        this.boat_rotation += clockwise ? this.rotate_speed : -this.rotate_speed;
        // Dude, I cannot overstate how much I LOVE lin alg
        this.forwardVec = new Matrix([Math.cos(this.boat_rotation), Math.sin(this.boat_rotation)],
                                    [-Math.sin(this.boat_rotation), Math.cos(this.boat_rotation)])
                                .times(vec(0, this.move_speed));
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            //Pass in true to enable movement of camera controls
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls(false));
            // Define the global camera and projection matrices, which are stored in program_state.
            let init = this.initial_camera_location
            program_state.set_camera(this.initial_camera_location);
        }

        // Set frontface culling for making outlines.
        // Enable culling for next drawn objects with gl.enable(gl.CULL_FACE)
        // Disable culling with gl.disable(gl.CULLFACE)
        var gl = context.context;
        gl.cullFace(gl.BACK);

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        if (!this.paused) {
            this.t = program_state.animation_time / 1000;
        }

        //Grab the frequency data
        this.analyser.getByteFrequencyData(this.data);
        //normalize the data @ this moment | out of 255, but raised to make it look more like waves!
        this.amplitude = (this.data[0])/455 * this.ampMultiplier;

        // Directional light from right-top-front
        let light = this.nightlight.mix(this.daylight, Math.sin(this.t / 10));
        program_state.lights = [new Light(vec4(Math.cos(this.t/10), 0.5-0.5*Math.cos(this.t/5), 0, 0), light, 100000)];
        let ambient = 0.55 + 0.25*Math.sin(this.t/10);

        // Sun
        let model_transform = Mat4.identity().times(Mat4.translation(10, 0, this.boat_location_z)).times(Mat4.rotation(this.t / 10, 0, 0, 1)).times(Mat4.translation(10, 0, 0));
        this.shapes.sphere.draw(context, program_state, model_transform, this.materials.sun);
        // Outline
        gl.enable(gl.CULL_FACE);
        let outline_transform = model_transform.times(Mat4.scale(1.03, 1.03, 1.03));
        this.shapes.sphere.draw(context, program_state, outline_transform, this.materials.outline);
        gl.disable(gl.CULL_FACE);

        // Ocean
        model_transform = Mat4.identity().times(Mat4.rotation(Math.PI / 2, 1, 0, 0)).times(Mat4.translation(0,-6,0).times(Mat4.scale(2.5,2.5,1)));
        this.shapes.ocean.draw(context, program_state, model_transform, this.materials.ocean.override({ambient: ambient, color: hex_color("#005493"), amplitude: this.amplitude, wavelength: this.wavelength, time: this.t, speed: 3.0}));
        // console.log("Amplitude: " + this.amplitude + "Wavelength: " + this.wavelength);

        // Test Sphere
        // model_transform = Mat4.identity();
        // this.shapes.sphere.draw(context, program_state, model_transform, this.materials.sphere);

        // Volcano
        model_transform = Mat4.identity().times(Mat4.translation(10, 0.05, 5)).times(Mat4.scale(0.5, 0.5, 0.5));
        this.shapes.volcano.draw(context, program_state, model_transform, this.materials.volcano.override({ambient: ambient}));
        // Outline
        gl.cullFace(gl.FRONT);
        gl.enable(gl.CULL_FACE);
        outline_transform = model_transform.times(Mat4.scale(1.02, 1.02, 1.02));
        this.shapes.volcano.draw(context, program_state, outline_transform, this.materials.outline);
        gl.disable(gl.CULL_FACE);
        
        // Crab Rock
        model_transform = Mat4.identity().times(Mat4.translation(7, 0.35, 2)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.scale(0.5, 0.5, 0.5));
        this.shapes.crabrock.draw(context, program_state, model_transform, this.materials.crabrock.override({ambient: ambient}));
        // Outlines
        gl.enable(gl.CULL_FACE);
        outline_transform = model_transform.times(Mat4.scale(1.02, 1.02, 1.02));
        this.shapes.crabrock.draw(context, program_state, outline_transform, this.materials.outline);
        outline_transform = model_transform.times(Mat4.scale(.98, .98, .98));
        this.shapes.crabrock.draw(context, program_state, outline_transform, this.materials.outline);
        gl.disable(gl.CULL_FACE);
        
        // Building
        model_transform = Mat4.identity().times(Mat4.translation(13, 0.5, 8)).times(Mat4.rotation(Math.PI/4, 1, 1, 1)).times(Mat4.rotation(Math.PI, 0, 1, 0)).times(Mat4.scale(0.5, 0.5, 0.5));
        this.shapes.building.draw(context, program_state, model_transform, this.materials.building.override({ambient: ambient}));
        // Outline
        gl.enable(gl.CULL_FACE);
        outline_transform = model_transform.times(Mat4.scale(1.02, 1.02, 1.02));
        this.shapes.building.draw(context, program_state, outline_transform, this.materials.outline);
        gl.disable(gl.CULL_FACE);
        
        // Lagoon
        model_transform = Mat4.identity().times(Mat4.translation(6, 0.1, 7)).times(Mat4.rotation(-Math.PI/4, 0, 1, 0)).times(Mat4.scale(0.5, 0.5, 0.5));
        this.shapes.lagoon.draw(context, program_state, model_transform, this.materials.lagoon.override({ambient: ambient}));
        // Outlines
        gl.enable(gl.CULL_FACE);
        outline_transform = model_transform.times(Mat4.scale(1.02, 1.02, 1.02));
        this.shapes.lagoon.draw(context, program_state, outline_transform, this.materials.outline);
        outline_transform = model_transform.times(Mat4.scale(.98, .98, .98));
        this.shapes.lagoon.draw(context, program_state, outline_transform, this.materials.outline);
        gl.disable(gl.CULL_FACE);
        
        // Santorini
        model_transform = Mat4.identity().times(Mat4.translation(13, 0.2, 1)).times(Mat4.rotation(Math.PI/4, 0, 1, 0)).times(Mat4.rotation(Math.PI, 0, 1, 0)).times(Mat4.scale(0.5, 0.5, 0.5));
        this.shapes.santorini.draw(context, program_state, model_transform, this.materials.santorini.override({ambient: ambient}));
        // Outline
        gl.enable(gl.CULL_FACE);
        outline_transform = model_transform.times(Mat4.scale(1.02, 1.02, 1.02));
        this.shapes.santorini.draw(context, program_state, outline_transform, this.materials.outline);
        gl.disable(gl.CULL_FACE);

        // Boat
        model_transform = Mat4.identity().times(Mat4.translation(this.boat_location_x, 0.015 + 0.5 * this.y_coord_wave(this.boat_location_x,this.boat_location_z), this.boat_location_z)).times(Mat4.scale(.05,.05,.05).times(Mat4.rotation(this.boat_rotation, 0, 1, 0)));
        this.attached = model_transform;
        this.shapes.boat.draw(context, program_state, model_transform, this.materials.boat.override({ambient: ambient}));
        // Outlines
        gl.enable(gl.CULL_FACE);
        outline_transform = model_transform.times(Mat4.scale(1.03, 1.03, 1.03));
        this.shapes.boat.draw(context, program_state, outline_transform, this.materials.outline);
        outline_transform = model_transform.times(Mat4.scale(.98, .98, .98));
        this.shapes.boat.draw(context, program_state, outline_transform, this.materials.outline);
        gl.disable(gl.CULL_FACE);

        // Sky
        let sky = this.nightSky.mix(this.daySky, Math.sin(this.t / 10));
        model_transform = Mat4.identity().times(Mat4.translation(10, 0, 5)).times(Mat4.scale(12, 12, 12));
        this.shapes.sphere.draw(context, program_state, model_transform, this.materials.sky.override({color: sky}));

        // Camera
        if (this.attached !== undefined) {
            let desired = this.attached;
            desired = Mat4.inverse(desired.times(Mat4.translation(0, 1, -5)).times(Mat4.rotation(Math.PI, 0, 1, 0)))
                        .map((x,i) => Vector.from(program_state.camera_inverse[i]).mix(x, 0.2));
            program_state.set_camera(desired);
        }
    }

    init_music_system(){
        //Using the WebAudio API as described as Mozilla
        this.audioCtx = new AudioContext();
        this.analyser = this.audioCtx.createAnalyser();
        //Standard Settings
        this.analyser.fftSize = 2048;
        // map is source -> analyser -> audiotCTX destination(speaker)
        this.source = this.audioCtx.createMediaElementSource(this.audioElement);
        this.source.connect(this.analyser);
        //this connects our music back to the default output, such as your //speakers 
        this.source.connect(this.audioCtx.destination);
        //Here we are defining data -> to be an array of frequency Bins size(255)
        this.data = new Uint8Array(this.analyser.frequencyBinCount);
    }

    y_coord_wave(x,z){
        var dir1 = vec3(1,1,0);
        var dir2 = vec3(0,1,0);
        var dir3 = vec3(1,0,0);

        var result = this.GerstnerWaveY(dir1, x, z);
        result += this.GerstnerWaveY(dir2, x, z);
        result += this.GerstnerWaveY(dir3, x, z);

        return result/2;
    }
    
    GerstnerWaveY(direction, x, z){
        //Important: we have amplitude, wavelenght, speed, and time being PASSED IN
        //Distortion applied to the x and time
        var k = 2.0 * 3.141 / this.wavelength;
        //Phase Speed
        var c = Math.sqrt(9.8 / k);
        //Amplitude -> The STEEPNESS(prevent loops)
        var a = this.amplitude / k;
        //Direciton is a vector 3 which we must normalize
        
        var d = direction.normalized();
        var position = new Vector3(x,z,0);
        //Final "inside cosine/sine"
        //dot product
        let dot = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
        var f = k * (dot(d, position) - c * this.t);

        var result = d[1] * (a * Math.cos(f));
        return result;
    }
}