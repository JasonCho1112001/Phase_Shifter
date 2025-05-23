class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        //this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');

        this.load.setPath("./assets/");

        // Load characters spritesheet
        //this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");

        // Load tilemap information
        this.load.image("playerOne","tile_0045.png");
        this.load.image("playerTwo","tile_0046.png");  
        this.load.audio("collection","confirmation_002.ogg");
        this.load.image("tilemap_tiles", "tilemap_packed.png");      // Packed tilemap
        this.load.tilemapTiledJSON("draft-platformer-level", "draft-platformer-level.tmj");   // Tilemap in JSON

        // Load the tilemap as a spritesheet
        /*this.load.spritesheet("tilemap_sheet", "tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });*/
        this.load.spritesheet("industrial_tilemap_sheet", "tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });

        this.load.spritesheet("food_tilemap_sheet", "food_tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });

         this.load.spritesheet("pixel_line_tiles", "pixel_line_tilemap_packed.png", {
            frameWidth: 16,
            frameHeight: 16
        });

        


        // Oooh, fancy. A multi atlas is a texture atlas which has the textures spread
        // across multiple png files, so as to keep their size small for use with
        // lower resource devices (like mobile phones).
        // kenny-particles.json internally has a list of the png files
        // The multiatlas was created using TexturePacker and the Kenny
        // Particle Pack asset pack.
        this.load.multiatlas("kenny-particles", "kenny-particles.json");
    }

    create() {

       
        this.anims.create({
            key: 'walk',
            frames: [{key:"playerOne"},
                {key:"playerTwo"}
            ],
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            frames: [
                { key: "playerOne" }
            ],
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            frames: [
                { key: "playerTwo" }
            ],
        });

         // ...and pass to the next Scene
         this.scene.start("platformerScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}