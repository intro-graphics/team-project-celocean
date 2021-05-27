import {defs, tiny} from './common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Texture, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;


export class Music extends Scene {
    constructor(music_src) {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.audioElement = music_src;
        console.log(music_src);
        const initial_corner_point = vec3(-1, -1, 0);
        const row_operation = (s, p) => p ? Mat4.translation(0, .1, 0).times(p.to4(1)).to3()
            : initial_corner_point;
        const column_operation = (t, p) => Mat4.translation(.1, 0, 0).times(p.to4(1)).to3();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            torus: new defs.Torus(15, 15),
            torus2: new defs.Torus(3, 15),
            circle: new defs.Regular_2D_Polygon(1, 15),
            sphere: new defs.Subdivision_Sphere(6),
            axis: new defs.Axis_Arrows(),
            square: new defs.Square(),
            cube: new defs.Cube(),
            grid: new defs.Grid_Patch(100, 100, row_operation, column_operation),
        };

        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: .7, diffusivity: .3, specularity: 0.35, color: hex_color("#ffffff")}),
            sphere: new Material(new defs.Cel_Shader(),
                {ambient: .7, diffusivity: .3, specularity: 0.35, smoothness: 40, 
                    low_threshold: -0.01, high_threshold: 0.01, 
                    low_specular: 0.9, high_specular: 0.95,
                    color: hex_color("#ffffff")}),
            axis: new Material(new defs.Cel_Shader(),
                {ambient: .6, diffusivity: .5, specularity: 0.1, color: hex_color("#ffffff")}),
            background: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 0, specularity: 0, color: hex_color("#b0b0b0")}),
            outline: new Material(new defs.Phong_Shader(),
                {ambient: 0, diffusivity: 0, specularity: 0, color: hex_color("#000000")}),
            ocean: new Material(new defs.Ocean_Shader(),
                {ambient: .7, diffusivity: .3, specularity: 0.35, smoothness: 40, 
                    low_threshold: -0.01, high_threshold: 0.01, 
                    low_specular: 0.9, high_specular: 0.95,
                    color: hex_color("#ffffff")})
        }
        // If N*L is under low_threshold, diffused light is 0.
        // If N*L is over high_threshold, diffused light is maxed.
        // If N*L is between the thresholds, diffused light is interpolated from 0 to max.
        // Same idea with specularity for N*H and low_specular & high_specular
        // For reference, N*L = 0 is when the light is perpendicular to the normal.

        this.paused = false;
        this.t = 0.0;
        this.initial_camera_location = Mat4.look_at(vec3(4, 0, 48), vec3(0, 0, 0), vec3(0, 1, 0));
        this.amplitude = 0.2;
        this.wavelength  = 5.0;
        this.music_test();
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Pause light revolution", ["e"], () => this.paused = !this.paused);
        this.key_triggered_button("Inc. Modifier", ["w"], () => this.amplitude = this.amplitude + 0.1);
        this.key_triggered_button("Dec. Modifier", ["s"], () => this.amplitude = this.amplitude - 0.1);
        this.key_triggered_button("Inc. Modifier", ["d"], () => this.wavelength = this.wavelength + 1.0);
        this.key_triggered_button("Dec. Modifier", ["a"], () => this.wavelength = this.wavelength - 1.0);
        this.key_triggered_button("Play Music", ["m"], () => this.audioElement.play());
        this.key_triggered_button("Play Musict", ["m"], () => this.audioCtx.resume());
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
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

        // Directional light from right-top-front
        program_state.lights = [new Light(vec4(1, 1, 1, 0), color(1, 1, 1, 1), 100000)];

        let model_transform = Mat4.identity().times(Mat4.rotation(90,1,0,0)).times(Mat4.scale(2,2,2));

        //Interestingly, spheres are SMOOTHER
        //this.shapes.sphere.draw(context, program_state, model_transform, this.materials.ocean.override({color: [1, 0, 0, 1]}));
        //Drawing the wave grid!
        this.analyser.getByteFrequencyData(this.data);
        this.amplitude = (this.data[0])/255;

        this.shapes.grid.draw(context, program_state, model_transform, this.materials.ocean.override({color: [0.68, 0.85, 0.90, 1], amplitude: this.amplitude, wavelength: this.wavelength, time: this.t, speed: 3.0}));

        // White background
        model_transform = Mat4.identity().times(Mat4.translation(0, 0, -5)).times(Mat4.scale(100, 100, 100));
        this.shapes.cube.draw(context, program_state, model_transform, this.materials.background);

    }

    music_test(){
        this.audioCtx = new AudioContext();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 2048;
        this.source = this.audioCtx.createMediaElementSource(this.audioElement);
        this.source.connect(this.analyser);
        //this connects our music back to the default output, such as your //speakers 
        this.source.connect(this.audioCtx.destination);
        this.data = new Uint8Array(this.analyser.frequencyBinCount);


    }
}