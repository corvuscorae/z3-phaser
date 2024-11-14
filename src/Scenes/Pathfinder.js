import EasyStar from "easystarjs";
import { getSolutions } from "../z3.js"

const MAP_SIZE = {
    width: 40,
    height: 25
}
const TARGET_AREA = {
    left: 21,
    right: 29,
    top: 17,
    bottom: 20
}

const INSIDE_SOLUTIONS = await getSolutions([], TARGET_AREA, MAP_SIZE, "inside");
const OUTSIDE_SOLUTIONS = await getSolutions([], TARGET_AREA, MAP_SIZE, "outside");
const ON_SOLUTIONS = await getSolutions([], TARGET_AREA, MAP_SIZE, "on");

export class Pathfinder extends Phaser.Scene {
    constructor() {
        super("pathfinderScene");
    }

    preload() {

    }

    init() {
        this.TILESIZE = 16;
        this.SCALE = 2.0;

        this.my = {sprite: {}}
    }

    create() {
        let my = this.my;

        // Create a new tilemap which uses 16x16 tiles, and is 40 tiles wide and 25 tiles tall
        this.map = this.add.tilemap("three-farmhouses", this.TILESIZE, this.TILESIZE, MAP_SIZE.height, MAP_SIZE.width);

        // Add a tileset to the map
        this.tileset = this.map.addTilesetImage("kenney-tiny-town", "tilemap_tiles");

        // Create the layers
        this.groundLayer = this.map.createLayer("Ground-n-Walkways", this.tileset, 0, 0);
        this.housesLayer = this.map.createLayer("Houses-n-Fences", this.tileset, 0, 0);
        this.stuffLayer = this.map.createLayer("Trees-n-Bushes", this.tileset, 0, 0);

        // Create townsfolk sprite
        // Use setOrigin() to ensure the tile space computations work well
        my.sprite.purpleTownie = this.add.sprite(this.tileToWorld(5), this.tileToWorld(5), "purple").setOrigin(0,0);
        
        // Camera settings
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setZoom(this.SCALE);

        // Create grid of visible tiles for use with path planning
        let tinyTownGrid = this.layersToGrid([this.groundLayer, this.housesLayer, this.stuffLayer]);

        let walkables = [1, 2, 3, 30, 40, 41, 42, 43, 44, 95, 13, 14, 15, 25, 26, 27, 37, 38, 39, 70, 84];

        // Initialize EasyStar pathfinder
        this.finder = new EasyStar.js();

        // Pass grid information to EasyStar
        // EasyStar doesn't natively understand what is currently on-screen,
        // so, you need to provide it that information
        this.finder.setGrid(tinyTownGrid);

        // Tell EasyStar which tiles can be walked on
        this.finder.setAcceptableTiles(walkables);

        this.activeCharacter = my.sprite.purpleTownie;

        // Handle mouse clicks
        // Handles the clicks on the map to make the character move
        // The this parameter passes the current "this" context to the
        // function this.handleClick()
        this.input.on('pointerup',this.handleClick, this);

        this.cKey = this.input.keyboard.addKey('C');
        this.lowCost = false;

        //------------------- DO Z3 -------------------//
        // prune any coords where tiles are already placed on layers for OUTSIDE_SOLUTIONS
        this.preventOverlap(OUTSIDE_SOLUTIONS, [this.housesLayer, this.stuffLayer]);

        // track tiles placed
        this.placed_inside = [];
        this.placed_outside = [];
        this.placed_on = [];

        // make copies of solution sets that can be emptied and re-filled
        this.inside_solutions = this.copyArray(INSIDE_SOLUTIONS);
        this.outside_solutions = this.copyArray(OUTSIDE_SOLUTIONS);
        this.on_solutions = this.copyArray(ON_SOLUTIONS);

        // controls
        this.qKey = this.input.keyboard.addKey('Q');    // put inside fence
        this.aKey = this.input.keyboard.addKey('A');    //  clear inside fence
        this.wKey = this.input.keyboard.addKey('W');    // put outside fence
        this.sKey = this.input.keyboard.addKey('S');    //  clear outside fence
        this.eKey = this.input.keyboard.addKey('E');    // put on fence
        this.dKey = this.input.keyboard.addKey('D');    //  clear on fence
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.cKey)) {
            if (!this.lowCost) {
                // Make the path low cost with respect to grassy areas
                this.setCost(this.tileset);
                this.lowCost = true;
            } else {
                // Restore everything to same cost
                this.resetCost(this.tileset);
                this.lowCost = false;
            }
        }

        //------------------- DO Z3 -------------------//
        // HANDLE INSIDE FENCE PLACEMENTS
        if (Phaser.Input.Keyboard.JustDown(this.qKey)) {   // put INSIDE
            let placed = this.placeSolution(this.inside_solutions, this.stuffLayer, 58);
            if(placed) this.placed_inside.push(placed);
        }
        if (Phaser.Input.Keyboard.JustDown(this.aKey)) {   // clear INSIDE
            this.clearTiles(this.placed_inside);
            this.inside_solutions = this.copyArray(INSIDE_SOLUTIONS);
        }
        // HANDLE OUTSIDE FENCE PLACEMENTS
        if (Phaser.Input.Keyboard.JustDown(this.wKey)) {   // put OUTSIDE
            let placed = this.placeSolution(this.outside_solutions, this.stuffLayer, 95);
            if(placed) this.placed_outside.push(placed);
            console.log(placed)
        }
        if (Phaser.Input.Keyboard.JustDown(this.sKey)) {   // clear OUTSIDE
            this.clearTiles(this.placed_outside);
            this.outside_solutions = this.copyArray(OUTSIDE_SOLUTIONS);
        }
        // HANDLE ON FENCE PLACEMENTS
        if (Phaser.Input.Keyboard.JustDown(this.eKey)) {   // put ON
            let placed = this.placeSolution(this.on_solutions, this.stuffLayer, 84);
            if(placed) this.placed_on.push(placed);
        }
        if (Phaser.Input.Keyboard.JustDown(this.dKey)) {   // clear ON
            this.clearTiles(this.placed_on);
            this.on_solutions = this.copyArray(ON_SOLUTIONS);
        }
    }

    // pick a random solution and place tile_id at those coords in layer
    placeSolution(solution_set, layer, tile_id){
        // pick a random coord from solution set
        let random = Phaser.Math.Between(0,solution_set.length-1);
        let put_at = null;

        if(solution_set.length === 0) console.log("Solution set depleted!");
        // delete choice from set to prevent repeating
        else{ put_at = solution_set.splice(random, 1)[0]; }

        if(put_at){
            return layer.putTileAt(tile_id, put_at.x, put_at.y)
        }
    }

    // remove tiles from layer
    clearTiles(tile_array){
        tile_array.forEach(tile => {
            if(tile) tile.layer.tilemapLayer.removeTileAt(tile.x, tile.y);
        });
    }

    // return a deep copy of array
    copyArray(array){
        let result = []; 
        array.forEach((elem) => {
            if(elem) result.push(elem);
        });
        return result;
    }

    // remove coordinates where tiles have already been placed on layers
    preventOverlap(solution_set, layers){
        layers.forEach((layer) => {
            layer.forEachTile((tile) => { 
                if(tile.index > -1){ // if there's a tile drawn here
                    for(let i = 0; i < solution_set.length; i++){
                        let coord = solution_set[i];
                        if(coord.x === `${tile.x}` && coord.y === `${tile.y}`){
                            solution_set.splice(i, 1);
                        }
                    }
                }
            });
        });
    }

    resetCost(tileset) {
        for (let tileID = tileset.firstgid; tileID < tileset.total; tileID++) {
            let props = tileset.getTileProperties(tileID);
            if (props != null) {
                if (props.cost != null) {
                    this.finder.setTileCost(tileID, 1);
                }
            }
        }
    }

    tileToWorld(tile) {
        return tile * this.TILESIZE;
    }

    // layersToGrid
    //
    // Uses the tile layer information in this.map and outputs
    // an array which contains the tile ids of the visible tiles on screen.
    // This array can then be given to Easystar for use in path finding.
    layersToGrid() {
        let grid = [];
        // Initialize grid as two-dimensional array
        let rows = this.map.height;
        let cols = this.map.width;
        for(let i = 0; i < rows; i++){
            let row = [];
            for(let j = 0; j < cols; j++){ row[j] = null; }
            grid[i] = row;
        }        

        // Loop over layers to find tile IDs, store in grid
        let arrayOfLayers = this.map.layers;
        for(let layer of arrayOfLayers){
            for(let x = 0; x < rows; x++){
                for(let y = 0; y < cols; y++){
                    let tile = layer.tilemapLayer.getTileAt(y,x);
                    if(tile){ grid[x][y] = tile.index; }
                }
            }
        }
        return grid;
    }

    handleClick(pointer) {
        let x = pointer.x / this.SCALE;
        let y = pointer.y / this.SCALE;
        var toX = Math.floor(x/this.TILESIZE);
        var toY = Math.floor(y/this.TILESIZE);
        var fromX = Math.floor(this.activeCharacter.x/this.TILESIZE);
        var fromY = Math.floor(this.activeCharacter.y/this.TILESIZE);
        //console.log('going from ('+fromX+','+fromY+') to ('+toX+','+toY+')');
    
        this.finder.findPath(fromX, fromY, toX, toY, (path) => {
            if (path === null) {
                console.warn("Path was not found.");
            } else {
                //console.log(path);
                this.moveCharacter(path, this.activeCharacter);
            }
        });
        this.finder.calculate(); // ask EasyStar to compute the path
        // When the path computing is done, the arrow function given with
        // this.finder.findPath() will be called.
    }
    
    moveCharacter(path, character) {
        // Sets up a list of tweens, one for each tile to walk, that will be chained by the timeline
        var tweens = [];
        for(var i = 0; i < path.length-1; i++){
            var ex = path[i+1].x;
            var ey = path[i+1].y;
            tweens.push({
                x: ex*this.map.tileWidth,
                y: ey*this.map.tileHeight,
                duration: 200
            });
        }
    
        this.tweens.chain({
            targets: character,
            tweens: tweens
        });

    }

    // A function which takes as input a tileset and then iterates through all
    // of the tiles in the tileset to retrieve the cost property, and then 
    // uses the value of the cost property to inform EasyStar, using EasyStar's
    // setTileCost(tileID, tileCost) function.
    setCost(tileset) {
        for(let tileID = tileset.firstgid; tileID <= tileset.total; tileID++){
            let props = tileset.getTileProperties(tileID);  
            if(props){ 
                let cost = props.cost; 
                this.finder.setTileCost(tileID, cost);
            }
        }
    }
}
