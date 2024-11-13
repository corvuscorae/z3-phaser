import { Scene, AUTO } from "phaser";
import { getSolutions } from "../z3.js"

let test = await getSolutions([]);

export class Load extends Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load townsfolk
        this.load.image("purple", "purple_townie.png");
        this.load.image("blue", "blue_townie.png");

        // Load tilemap information
        this.load.image("tilemap_tiles", "tilemap_packed.png");                   // Packed tilemap
        this.load.tilemapTiledJSON("three-farmhouses", "three-farmhouses.tmj");   // Tilemap in JSON
    }

    create() {
        console.log(test)
        // define constraints here, get solution sets

        // ...and pass to the next Scene
         this.scene.start("pathfinderScene");
    }
}