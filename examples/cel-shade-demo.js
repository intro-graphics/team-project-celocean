import {defs, tiny} from './common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Cel_Shade_Demo extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            torus: new defs.Torus(15, 15),
            torus2: new defs.Torus(3, 15),
            circle: new defs.Regular_2D_Polygon(1, 15),
            sphere: new defs.Subdivision_Sphere(4),
            axis: new defs.Axis_Arrows(),
        };

        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: .6, diffusivity: .5, color: hex_color("#ffffff")}),
            sphere: new Material(new defs.Cel_Shader(),
                {ambient: .6, diffusivity: .5, specularity: 1, low_threshold: -0.05, high_threshold: 0.05, color: hex_color("#ffffff")}),
            axis: new Material(new defs.Cel_Shader(),
                {ambient: .6, diffusivity: .5, specularity: 0, low_threshold: -0.05, high_threshold: 0.05, color: hex_color("#ffffff")}),
            background: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 0, specularity: 0, color: hex_color("#b0b0b0")}),
        }
        // If N*L is under low_threshold, diffused light is 0.
        // If N*L is over high_threshold, diffused light is maxed.
        // If N*L is between the thresholds, diffused light is interpolated from 0 to max.
        // For reference N*L = 0 is when the light is perpendicular to the normal.

        this.initial_camera_location = Mat4.look_at(vec3(0, 0, 5), vec3(0, 0, 0), vec3(0, 1, 0));
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

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        // Directional light from right-top-front
        program_state.lights = [new Light(vec4(1, 1, 1, 0), color(1, 1, 1, 1), 1000)];

        // Cel Sphere
        let model_transform = Mat4.identity();
        this.shapes.sphere.draw(context, program_state, model_transform, this.materials.sphere.override({color: [1, 0, 0, 1]}));

        // Cel Axis
        model_transform = model_transform.times(Mat4.translation(2, -1, -1));
        this.shapes.axis.draw(context, program_state, model_transform, this.materials.axis.override({color: hex_color("#c7aa5b")}));

        // Cel Donut
        model_transform = model_transform.times(Mat4.translation(-4.5, 1, 1)).times(Mat4.rotation(t, 1, 2, 0));
        this.shapes.torus.draw(context, program_state, model_transform, this.materials.axis.override({color: hex_color("#ff52dc")}));

        // White background
        model_transform = Mat4.identity().times(Mat4.translation(0, 0, -5)).times(Mat4.scale(100, 100, 100));
        this.shapes.circle.draw(context, program_state, model_transform, this.materials.background);
    }
}