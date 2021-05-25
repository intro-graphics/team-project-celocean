import {defs, tiny} from './examples/common.js';
import {Shape_From_File} from './examples/obj-file-demo.js'

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Texture, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class CelOcean extends Scene {
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
            yoyo: new Shape_From_File("assets/Yoyo/yoyo.obj"),
            volcano: new Shape_From_File("assets/volcano.obj")
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
                {ambient: .6, diffusivity: .5, specularity: 0, color: hex_color("#ffffff")}),
            background: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 0, specularity: 0, color: hex_color("#b0b0b0")}),
            outline: new Material(new defs.Phong_Shader(),
                {ambient: 0, diffusivity: 0, specularity: 0, color: hex_color("#000000")}),
            yoyo: new Material(new defs.Textured_Cel(), {
                color: color(.1,.1,.1, 1), ambient: 0.8, diffusivity: .4, specularity: 0,
                low_threshold: 0.1, high_threshold: 0.11, 
                texture: new Texture("assets/Yoyo/796630369.png")
            }),
        }
        // If N*L is under low_threshold, diffused light is 0.
        // If N*L is over high_threshold, diffused light is maxed.
        // If N*L is between the thresholds, diffused light is interpolated from 0 to max.
        // Same idea with specularity for N*H and low_specular & high_specular
        // For reference, N*L = 0 is when the light is perpendicular to the normal.

        this.paused = false;
        this.t = 0.0;
        this.initial_camera_location = Mat4.look_at(vec3(0, 0, 5), vec3(0, 0, 0), vec3(0, 1, 0));
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Pause light revolution", ["e"], () => this.paused = !this.paused);
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
        program_state.lights = [new Light(vec4(Math.sin(this.t), 1, Math.cos(this.t), 0), color(1, 1, 1, 1), 100000)];

        // Cel Sphere
        let model_transform = Mat4.identity();
        this.shapes.sphere.draw(context, program_state, model_transform, this.materials.sphere.override({color: [1, 0, 0, 1]}));
        // Outline for Cel Sphere
        gl.enable(gl.CULL_FACE);
        let outline_transform = model_transform.times(Mat4.scale(1.05, 1.05, 1.05));
        this.shapes.sphere.draw(context, program_state, outline_transform, this.materials.outline);
        gl.disable(gl.CULL_FACE);

        // Cel Axis
        model_transform = model_transform.times(Mat4.translation(2, -1, -1));
        this.shapes.axis.draw(context, program_state, model_transform, this.materials.axis.override({color: hex_color("#c7aa5b")}));
        // Outlining does not work because some faces are inside-out
        // gl.enable(gl.CULL_FACE);
        // outline_transform = model_transform.times(Mat4.scale(1.05, 1.05, 1.05));
        // this.shapes.axis.draw(context, program_state, outline_transform, this.materials.outline);
        // gl.disable(gl.CULL_FACE);

        // Cel Donut
        model_transform = model_transform.times(Mat4.translation(-4.5, 1, 1)).times(Mat4.rotation(this.t, 1, 2, 0));
        this.shapes.torus.draw(context, program_state, model_transform, this.materials.axis.override({color: hex_color("#ff52dc")}));
        // Outline for Cel Donut
        gl.enable(gl.CULL_FACE);
        outline_transform = model_transform.times(Mat4.scale(1.05, 1.05, 1.05));
        this.shapes.torus.draw(context, program_state, outline_transform, this.materials.outline);
        // Interior lines for Cel Donut
        outline_transform = model_transform.times(Mat4.scale(0.9, 0.9, 0.9));
        this.shapes.torus.draw(context, program_state, outline_transform, this.materials.outline);
        gl.disable(gl.CULL_FACE);

        // Textured human (Just ignore the head. I don't know how to use multiple textures)
        model_transform = Mat4.identity().times(Mat4.translation(5, 0.5, 0)).times(Mat4.scale(0.9, 0.9, 0.9));
        this.shapes.yoyo.draw(context, program_state, model_transform, this.materials.yoyo);
        // Outlines
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.FRONT);
        outline_transform = model_transform.times(Mat4.scale(1.02, 1.02, 1.02));
        this.shapes.yoyo.draw(context, program_state, outline_transform, this.materials.outline);
        // Interior lines
        outline_transform = model_transform.times(Mat4.scale(0.97, 0.97, 0.97));
        this.shapes.yoyo.draw(context, program_state, outline_transform, this.materials.outline);
        gl.disable(gl.CULL_FACE);

        // Volcano
        model_transform = Mat4.identity().times(Mat4.translation(0, 0, -20)).times(Mat4.scale(10, 10, 10));
        this.shapes.volcano.draw(context, program_state, model_transform, this.materials.axis.override({color: hex_color("#857446")}));
        // Outlines
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.FRONT);
        outline_transform = model_transform.times(Mat4.scale(1.02, 1.02, 1.02));
        this.shapes.volcano.draw(context, program_state, outline_transform, this.materials.outline);

        // White background
        model_transform = Mat4.identity().times(Mat4.translation(0, 0, -5)).times(Mat4.scale(100, 100, 100));
        this.shapes.sphere.draw(context, program_state, model_transform, this.materials.background);

        // Display comparison
        {
            model_transform = Mat4.identity().times(Mat4.translation(0, -5, 0));
            this.shapes.sphere.draw(context, program_state, model_transform, this.materials.test.override({color: [1, 0, 0, 1]}));
            
            model_transform = model_transform.times(Mat4.translation(2.5, 0, 0));
            this.shapes.sphere.draw(context, program_state, model_transform, this.materials.sphere.override({color: [1, 0, 0, 1]}));
            
            model_transform = model_transform.times(Mat4.translation(2.5, 0, 0));
            this.shapes.sphere.draw(context, program_state, model_transform, this.materials.test.override({color: [1, 0, 0, 1]}));
            gl.cullFace(gl.BACK);
            gl.enable(gl.CULL_FACE);
            outline_transform = model_transform.times(Mat4.scale(1.05, 1.05, 1.05));
            this.shapes.sphere.draw(context, program_state, outline_transform, this.materials.outline);
            gl.disable(gl.CULL_FACE);

            model_transform = model_transform.times(Mat4.translation(2.5, 0, 0));
            this.shapes.sphere.draw(context, program_state, model_transform, this.materials.sphere.override({color: [1, 0, 0, 1]}));
            // Outline for Cel Sphere
            gl.enable(gl.CULL_FACE);
            outline_transform = model_transform.times(Mat4.scale(1.05, 1.05, 1.05));
            this.shapes.sphere.draw(context, program_state, outline_transform, this.materials.outline);
            gl.disable(gl.CULL_FACE);
        }
    }
}