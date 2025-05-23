class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");

    }

    preload() {
    this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
    }

    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 800;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.35;
        this.playerScore = 0;

        this.healthPoints = [];

        this.dashActive = false;
        this.playerFacedRight = false;

        
    }

    create() {
        my.text.playerScoreText = this.add.text(-500,-500,"SCORE: "+this.playerScore)
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("draft-platformer-level", 18, 18, 120, 20);
    
        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("industrial-tiles", "tilemap_tiles");

        // Create a layer
        this.backgroundLayer = this.map.createLayer("Background", this.tileset, 0, 0);
        //this.backgroundLayer.setTint(0xffffff00)
        this.backgroundLayer.setTint(0x4a4a4a)
        this.groundLayer = this.map.createLayer("Tile Layer 1", this.tileset, 0, 0);
        
        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });


        this.collectibles = this.map.createFromObjects("Collectibles", {
            name: "pizza",
            key: "food_tilemap_sheet",
            frame: 106
        });
        this.collectibleList = this.map.getObjectLayer("Collectibles").objects;

        this.bff = this.map.createFromObjects("Collectibles", {
            name: "bff",
            key: "pixel_line_tiles",
            frame: 51
        });
        
        this.envDangersList = this.map.createFromObjects("Dangers",{
            name: "toxic",
            key:"industrial_tilemap_sheet",
            frame:28 
        });

        this.enemyList = this.map.createFromObjects("Dangers",{
            name: "enemy",
            key:"pixel_line_tiles",
            frame:56
        });

        this.powerUp = this.map.createFromObjects("Collectibles", {
            name: "PowerUp",
            key: "industrial_tilemap_sheet",
            frame: 61
        });

        this.spawn = this.map.getObjectLayer("Spawns").objects.find((obj) => obj.name === "spawnPoint");
        
        
        // TODO: Add turn into Arcade Physics here
        this.physics.world.enable(this.collectibles, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.bff, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.envDangersList, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.enemyList);

        this.physics.world.enable(this.powerUp, Phaser.Physics.Arcade.STATIC_BODY);



        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.collectibleGroup = this.add.group(this.collectibles);
        this.dangersGroup = this.add.group(this.envDangersList);
        this.enemyGroup = this.add.group(this.enemyList);

        for(let elements of this.enemyList){
            elements.x--;
        }

// TODO: Add movement vfx here
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['muzzle_03.png', 'muzzle_05.png'], 
            // TODO: Try: add random: true
            scale: {start: 0.08, end: 0.03},
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 185,
            // TODO: Try: gravityY: -400,
            radial:true,
            alpha: {start: .6, end: 0.1}, 
        });

        my.vfx.jumping = this.add.particles(0, 0, "kenny-particles", {
            frame: ["trace_04.png", "trace_05.png"], 
            // TODO: Try: add random: true
            //scale: {start: 0.07, end: 0.05},
            scaleX:{start: .7, end: 0.05},
            scaleY:{start: .07, end: 0.05},

            // TODO: Try: maxAliveParticles: 8,
            duration: 25,
            lifespan: 250,
            gravityY:-500,
            // TODO: Try: gravityY: -400,
            alpha: {start: .8, end: 0.1}, 
        });

        my.vfx.sparkle = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'light_01.png','light_02.png','light_03.png'],
            // TODO: Try: add random: true
            scale: {start: 0.03, end: 0.1},
            // TODO: Try: maxAliveParticles: 8,
            duration: 200,
            lifespan: 100,
            // TODO: Try: gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.pizzaFlip = this.add.particles(0, 0, "food_tilemap_sheet", {
            frame: ['tile_0105.png', 'tile_0106.png'],
            // TODO: Try: add random: true
            scale: {start: 0.03, end: 0.1},
            // TODO: Try: maxAliveParticles: 8,
            duration: 200,
            lifespan: 100,
            // TODO: Try: gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
        });
        my.vfx.walking.stop();
        my.vfx.jumping.stop();
        my.vfx.sparkle.stop();

        



        for(let i = 0;i <60;i= i+20){
            this.healthPoints.push(this.add.sprite(i+600,-500,"playerOne"));
        }

    
        my.sprite.player = this.physics.add.sprite(this.spawn.x, this.spawn.y, "playerOne");
        my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);
        this.physics.add.collider(this.enemyGroup, this.groundLayer);

       

        // TODO: Add coin collision handler
        this.physics.add.overlap(my.sprite.player, this.collectibleGroup, (obj1, obj2) => {
            this.playerScore++;
            my.text.playerScoreText.setText("SCORE: "+ this.playerScore);
           
            obj2.destroy(); // remove coin on overlap
            
            my.vfx.sparkle.x = obj2.x;
            my.vfx.sparkle.y = obj2.y;
            this.sound.play("collection",{
                volume:.7
            });
            my.vfx.sparkle.start();
           
        });

        this.physics.add.overlap(my.sprite.player, this.bff, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            
            my.vfx.sparkle.x = obj2.x;
            my.vfx.sparkle.y = obj2.y;
            my.vfx.sparkle.start();
            this.scene.start("win");
        });

        this.physics.add.overlap(my.sprite.player, this.dangersGroup, (obj1,obj2)=>{
            //this.currHealthPointSprite = this.healthPoints[0];
            //this.currHealthPointsSprite.destroy();
            this.currHealthPointSprite = this.healthPoints.pop();

            console.log("Took DAMAGE");
            if(this.currHealthPointSprite){
                 this.currHealthPointSprite.destroy();
                 this.cameras.main.shake(100,.004);
                 my.sprite.player.x = this.spawn.x;
                my.sprite.player.y = this.spawn.y;
                my.sprite.player.setVelocityX(0);

            }
        });

        this.physics.add.overlap(my.sprite.player, this.powerUp, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            this.dashActive = true;
            my.vfx.sparkle.x = obj2.x;
            my.vfx.sparkle.y = obj2.y;
            my.vfx.sparkle.start();
        });



        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();
        this.rKey = this.input.keyboard.addKey('R');


         this.input.keyboard.on('keydown-SPACE', () => {
            if(this.dashActive && this.playerFacedRight){
                my.sprite.player.setVelocityX(500);
            }else if(this.dashActive){
                my.sprite.player.setVelocityX(-500);
            }
        }, this);
        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        

        // TODO: add camera code here
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels+120, this.map.heightInPixels);  
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        this.cameras.scoreCam = this.cameras.add();
        this.cameras.scoreCam.startFollow(my.text.playerScoreText, true, 0.25, 0.25);
        this.cameras.scoreCam.setPosition(-1070,-425);
        this.cameras.scoreCam.setZoom(this.SCALE*1.2);

        this.cameras.healthPointsCam = this.cameras.add();
        this.cameras.healthPointsCam.startFollow(this.healthPoints[0], true, 0.25, 0.25);
        this.cameras.healthPointsCam.setPosition(500,-400);
        this.cameras.healthPointsCam.setZoom(this.SCALE*2);


        this.animatedTiles.init(this.map);
     
    }
    
    update() {
        for(let elements of this.enemyList){
            elements.x--;
        }
        if(this.healthPoints == false){
            this.scene.start("lose");
        }
        if(cursors.left.isDown) {            
            this.playerFacedRight = false;
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, (my.sprite.player.displayWidth/2)+10, my.sprite.player.displayHeight/2-5, false);
            my.vfx.walking.particleRotate = 90;

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }

        } else if(cursors.right.isDown) {
            this.playerFacedRight = true;
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, (my.sprite.player.displayWidth/2)-25, my.sprite.player.displayHeight/2-5, false);
            my.vfx.walking.particleRotate = -90;
            my.vfx.walking.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            if(this.dashActive){
                my.sprite.player.setDragX(this.DRAG*2);
            }else{
                my.sprite.player.setDragX(this.DRAG);

            }
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
            my.vfx.walking.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            my.vfx.jumping.x = my.sprite.player.x;
            my.vfx.jumping.y = my.sprite.player.y;
            my.vfx.jumping.start();
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
            
    }
        
}