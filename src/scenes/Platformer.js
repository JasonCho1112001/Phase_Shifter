class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    preload() {
    this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
    }

    init() {
        // variables and settings
        //Physics + the world --------------------------------------------------------------
        this.physics.world.gravity.y = 1500;
        this.SCALE = 1.75;
        //Game
        this.playerScore = 0;

        //Cheats
        this.infiniteDodges = false;
        this.godMode = false;

        //Basic stats ----------------------------------------------------------------------
        this.healthPoints = [];

        //Basic Movement -------------------------------------------------------------------
        this.ACCELERATION = 1400;
        this.DRAG = 1400; 
        this.playerFacedRight = false;
        this.MAX_SPEED = 250;
        //Jumps
        this.JUMP_VELOCITY = -500;
        this.isJumping = false;
        this.jumpTimer = 0;
        this.MIN_JUMP_TIME = 50; // in milliseconds
        //Double Jump
        this.doubleJumpActive = false; 
        this.doubleJumpAvailable = 0;

        //Wall Jumps -----------------------------------------------------------------------
        this.wallJumpActive = false;
        this.wallJumpAvailable = 0;

        //Wall Slide + Jump Stuff
        this.WALL_SLIDE_SPEED = 100;  // max slide speed when against wall
        this.WALL_JUMP_X = 900;   // Horizontal velocity away from the wall
        this.WALL_JUMP_Y = -500;  // Vertical jump strength from wall
        this.isWallJumpLocked = false;
        this.wallJumpLockoutTimer = 0;
        this.WALLJUMP_LOCKOUT_DURATION = 300; // milliseconds

        //Air Dodge ------------------------------------------------------------------------
        this.dashActive = false;
        this.dashingState = false;
        this.airDodgeSpeed = 550;
        this.airDodgeDuration = 300; // ms
        this.airDodgeTimer = 0;
        this.airDodgeDecayRate = 0.95; // Velocity decay per frame
        this.airDodgeVector = new Phaser.Math.Vector2(0, 0);
        this.canAirDodge = true;
        this.intangible = false;

        //Tile Switching -------------------------------------------------------------------
        this.visionState = "red";   
        //Hazards --------------------------------------------------------------------------
        this.ranProjectileFire;
        this.ranCannonIndex;
        //Particles ------------------------------------------------------------------------
        this.PARTICLE_VELOCITY = 50;
        //Camera ---------------------------------------------------------------------------
        this.LOOKAHEAD = 100; // how far ahead the camera looks based on movement direction
        this.CAMERA_LERP = 0.05; // smoothness factor (0 = no follow, 1 = instant snap)
        this.currentLookahead = 0;
        this.lookaheadTarget = 0;
        this.LOOKAHEAD_THRESHOLD = 250;  // Minimum horizontal speed before lookahead activates
        this.LOOKAHEAD_DELAY = 400; 

        //Checkpoints
        this.checkPointReached = false;

        //Audio
        this.footsteps = [
            this.sound.add('footstep1'),
            this.sound.add('footstep2')
        ];
        this.currentFootstepIndex = 0;
        this.footstepCooldown = 0; // time before next sound
        this.FOOTSTEP_INTERVAL = 150; // ms between steps

        //Jump
        this.jumpSfx = this.sound.add('jump');
        this.jumpSfx.setVolume(0.75);

        //Dodge
        this.dodgeSfx = this.sound.add('coin');
        this.dodgeSfx.setVolume(0.9);

        //Second Gas variables
        this.leftGasTriggered = false;
    }

    create() {
        this.map = this.add.tilemap("draft-platformer-level", 18, 18, 120, 20); //new more dynamic way
        this.spawn = this.map.getObjectLayer("Spawns").objects.find((obj) => obj.name === "spawnPoint");
        my.sprite.player = this.physics.add.sprite(this.spawn.x, this.spawn.y, "playerOne");
        my.sprite.player.setScale(this.SCALE);

        

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

        /////////////////////////////////////
        

        // Checkpoint creation
        const checkpointData = this.map.getObjectLayer("Spawns").objects.find(obj => obj.name === "checkPoint");

        // Create an invisible rectangle
        this.checkPoint = this.add.rectangle(
            checkpointData.x,
            checkpointData.y,
            checkpointData.width,
            checkpointData.height,
            0xff0000,
            0 //alpha
        );

    // Enable Arcade Physics on it
    this.physics.add.existing(this.checkPoint, true); // true = static body

        this.redTiles = this.groundLayer.filterTiles((tile) => {
                if(tile.properties.vision == "red"){
                    return true;
                } else{
                    return false;
                }
                
        });

        this.blueTiles = this.groundLayer.filterTiles((tile) => {
                if(tile.properties.vision == "blue"){
                    return true;
                } else{
                    return false;
                }
        });
        for(let elements of this.blueTiles){
                    elements.tint = 0x4a4a4a;
                }
        for(let elements of this.redTiles){
            elements.tint = 0xff0000;
        }
        
        
        this.cannonTiles = this.groundLayer.filterTiles((tile) =>{
            if(tile.properties.isCannon){
                    return true;
                } else{
                    return false;
                }
        });
        /////////////////////////////////////

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

        /*this.enemyList = this.map.createFromObjects("Dangers",{
            name: "enemy",
            key:"pixel_line_tiles",
            frame:56
        });*/

        this.dashPowerUp = this.map.createFromObjects("Collectibles", {
            name: "dashPowerUp",
            key: "industrial_tilemap_sheet",
            frame: 61
        });

        this.doubleJumpPowerUp = this.map.createFromObjects("Collectibles", {
            name: "doubleJumpPowerUp",
            key: "industrial_tilemap_sheet",
            frame: 61
        });
        for(let elements of this.doubleJumpPowerUp){
            elements.setTint(0xFF0000);
        }

        this.wallJumpPowerUp = this.map.createFromObjects("Collectibles", {
            name: "wallJumpPowerUp",
            key: "industrial_tilemap_sheet",
            frame: 61
        });

        for(let elements of this.wallJumpPowerUp){
            elements.setTint(0xFFFF00);
        }
        
        
        // TODO: Add turn into Arcade Physics here
        this.physics.world.enable(this.collectibles, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.bff, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.envDangersList, Phaser.Physics.Arcade.STATIC_BODY);
        //this.physics.world.enable(this.enemyList);

        this.physics.world.enable(this.dashPowerUp, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.doubleJumpPowerUp, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.wallJumpPowerUp, Phaser.Physics.Arcade.STATIC_BODY);




        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.collectibleGroup = this.add.group(this.collectibles);
        this.dangersGroup = this.add.group(this.envDangersList);

        ////Elijah 
        this.projectileGroup = this.add.group();

        /*this.enemyGroup = this.add.group(this.enemyList);

        for(let elements of this.enemyList){
            elements.x--;
        }*/

        //Walking
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            // TODO: Try: add random: true
            random: true,
            scale: {start: 0.04, end: 0.01},
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 200,
            // TODO: Try: gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
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
            alpha: {start: 1, end: 0.2}, 
        }); 
        
        //Jumping VFX
        my.vfx.jump = this.add.particles(0, 0, "kenny-particles", {
            frame: ['muzzle_01.png','muzzle_02.png', 'muzzle_03.png', 'muzzle_04.png','muzzle_05.png',],
            // TODO: Try: add random: true
            random: true,
            scale: {start: 0.1, end: 0.1},
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 200,
            // TODO: Try: gravityY: -400,
            alpha: {start: 0.75, end: 0.1}, 
        });
        my.vfx.jump.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 20, my.sprite.player.displayHeight / 2 - 20, false);
       
        //Trail (blue)
        my.vfx.trail = this.add.particles(0, 0, "kenny-particles", {
            frame: ['spark_01.png', 'spark_02.png', 'spark_03.png', 'spark_04.png'],
            // TODO: Try: add random: true
            random: true,
            scale: {start: 0.025, end: 0.075},
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 200,
            // TODO: Try: gravityY: -400,
            alpha: {start: 1, end: 0.75}, 
            frequency: 10,
            tint: 0x00ffff,
        });


        my.vfx.walking.stop();
        my.vfx.jumping.stop();
        my.vfx.sparkle.stop();
        my.vfx.jump.stop();
        
        //Control depth
        my.sprite.player.setDepth(1);   // Make player depth 1
        my.vfx.walking.setDepth(0);     
        //my.vfx.walls.setDepth(2);
        my.vfx.jump.setDepth(2);
        //my.vfx.trail.setDepth(0);

        for(let i = 0;i <60;i= i+20){
            this.healthPoints.push(this.add.sprite(i+600,-500,"playerOne"));
        }

    
        
        //////////////////////////////
        let collisionHandler = (obj1,obj2) =>{

         }

         let processHandler = (obj1,obj2) =>{
            if(obj2.tint == 0x4a4a4a){
                return false
            }

            return true
         }
        // Enable collision handling
        this.physics.world.TILE_BIAS = 40;
        this.physics.add.collider(my.sprite.player, this.groundLayer, collisionHandler, processHandler);
         ///////////////////////////////////////////////
       

        // TODO: Add coin collision handler
        this.physics.add.overlap(my.sprite.player, this.collectibleGroup, (obj1, obj2) => {
            this.playerScore++;
            my.text.pizzaCount.setText("Pizzas: " + this.playerScore);
           
            obj2.destroy(); // remove coin on overlap
            
            my.vfx.sparkle.x = obj2.x;
            my.vfx.sparkle.y = obj2.y;
            this.sound.play("munch",{
                volume:.3
            });
            my.vfx.sparkle.start();
           
        });

        this.physics.add.overlap(my.sprite.player, this.bff, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            
            my.vfx.sparkle.x = obj2.x;
            my.vfx.sparkle.y = obj2.y;
             this.sound.play("collection",{
                volume:.7
                 });
            my.vfx.sparkle.start();
            this.scene.start("win");
        });

        //////////////////////////
        this.physics.add.overlap(my.sprite.player, this.projectileGroup, (obj1,obj2)=>{
            //Check if player is intangible
            if(!this.intangible && !this.godMode) {
                this.sound.play("damageSound",{
                    volume:.8 
                    });
                    this.cameras.main.shake(100,.008 ); 
                    if(this.checkPointReached == true) {
                        console.log("checkpointReached: " + this.checkPointReached);
                        console.log("CheckPoint");
                        my.sprite.player.x = this.checkPoint.x; 
                        my.sprite.player.y = this.checkPoint.y; 
                    } else {
                        console.log("checkpointReached: " + this.checkPointReached);
                        console.log("Spawn");
                        my.sprite.player.x = this.spawn.x; 
                        my.sprite.player.y = this.spawn.y; 
                    }
                    
                    my.sprite.player.setVelocityX(0);
            }
            else {
                //If they are, give the airdodge back
                this.canAirDodge = true;
            }
        });
        //////////////////////////////
        this.physics.add.overlap(my.sprite.player, this.dangersGroup, (obj1,obj2)=>{
            //this.currHealthPointSprite = this.healthPoints[0];
            //this.currHealthPointsSprite.destroy();
            this.currHealthPointSprite = this.healthPoints.pop();

            console.log("Took DAMAGE");
            if(this.currHealthPointSprite){
                 this.currHealthPointSprite.destroy();
                 this.sound.play("damageSound",{
                volume:.8 
                 });
                 this.cameras.main.shake(100,.008 ); 
                 my.sprite.player.x = this.spawn.x; 
                my.sprite.player.y = this.spawn.y; 
                my.sprite.player.setVelocityX(0);

            }
        });

        this.physics.add.overlap(my.sprite.player, this.dashPowerUp, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            this.dashActive = true;
            my.vfx.sparkle.x = obj2.x;
            my.vfx.sparkle.y = obj2.y;
            this.sound.play("collection",{
                volume:.7
                 });  
            my.vfx.sparkle.start();
        });

        this.physics.add.overlap(my.sprite.player, this.doubleJumpPowerUp, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            this.doubleJumpActive = true;

            my.vfx.sparkle.x = obj2.x;
            my.vfx.sparkle.y = obj2.y;
            this.sound.play("collection",{
                volume:.7
                 });  
            my.vfx.sparkle.start();
        });
        this.physics.add.overlap(my.sprite.player, this.wallJumpPowerUp, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            this.wallJumpActive = true;

            my.vfx.sparkle.x = obj2.x;
            my.vfx.sparkle.y = obj2.y;
            this.sound.play("collection",{
                volume:.7
                 });  
            my.vfx.sparkle.start();
        });

        //Checkpoint collision
        this.physics.add.overlap(my.sprite.player, this.checkPoint, (player, checkpoint) => {
            if (!this.checkPointReached) {
                this.checkPointReached = true;
                this.sound.play("collection", { volume: 0.7 });
                my.vfx.sparkle.x = checkpoint.x;
                my.vfx.sparkle.y = checkpoint.y;
                my.vfx.sparkle.start();
                console.log("checkpointReached: " + this.checkPointReached);
            }
        });
        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();
        this.rKey = this.input.keyboard.addKey('R');
        //Additional Input (Add input keys)
        this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.jKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);

        //Cheats
        this.infiniteAirDodgeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ZERO);
        this.godModeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NINE);

        this.input.keyboard.on('keydown', (event) => {
            if (event.key === '0') {
                this.infiniteDodges = !this.infiniteDodges;
                console.log(`InfiniteDodges ${this.infiniteDodges ? "Enabled" : "Disabled"}`);
            }

            if (event.key === '9') {
                this.godMode = !this.godMode;
                console.log(`God Mode ${this.godMode ? "Enabled" : "Disabled"}`);
            }
        });

         this.input.keyboard.on('keydown-SPACE', () => {
            if(this.dashActive && this.playerFacedRight){
                this.dashingState = true;
                my.sprite.player.setVelocityX(500);
            }else if(this.dashActive){
                this.dashingState = true;
                my.sprite.player.setVelocityX(-500);
            }
            ////////////////////////////////
            this.SwitchVision();
            //////////////////////////////////
        }, this);
        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-L', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);
        this.physics.world.drawDebug = false;
        

        // TODO: add camera code here
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels+120, this.map.heightInPixels);  
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE * 1.1 /*1.1*/);

        // this.cameras.scoreCam = this.cameras.add();
        // this.cameras.scoreCam.startFollow(my.text.playerScoreText, true, 0.25, 0.25);
        // this.cameras.scoreCam.setPosition(-715,-430);
        // this.cameras.scoreCam.setZoom(this.SCALE* 0.5 );

        this.cameras.healthPointsCam = this.cameras.add();
        this.cameras.healthPointsCam.startFollow(this.healthPoints[0], true, 0.25, 0.25) ;
        this.cameras.healthPointsCam.setPosition(500,-400);
        this.cameras.healthPointsCam.setZoom(this.SCALE* 1.1 );


        this.animatedTiles.init(this.map);

        this.anims.play('pizzaFlip',this.collectibles)
        this.anims.play('beeFly', this.bff);
     

        //Jason's working code
        this.hKey = this.input.keyboard.addKey('H');



        
        //Gas implementation [Debugged]

        //starting gas
        this.startGas = this.physics.add.sprite(my.sprite.player.x - 450, my.sprite.player.y - 50, "kenny-particles", "flame_04.png"); //change the number if the player doesnt have enough time beforethis.startGas comes
        this.startGas.setAlpha(2); //making the this.startGas' png more transparent
        this.startGas.setImmovable(true);
        this.children.bringToTop(this.startGas);
        this.startGas.setTint(0xffb701); //sets color to green from the default grey from the flame png
        this.startGas.body.setAllowGravity(false);
        this.startGas.displayHeight = this.scale.height * 2;
        this.startGas.displayWidth = 600;
        this.startGas.body.setSize(this.startGas.displayWidth - 200, this.startGas.displayHeight - 800); //without minus 130, the player would get hit by hitbox before the visual smoke sprite 
        this.startGas.setVelocityX(90);
        //contact check, did the player get hit by thethis.startGas
        this.physics.add.overlap(my.sprite.player, this.startGas, () => {

            this.scene.start("lose");
        });

        //second trigger gas
        this.leftMovingGas = this.physics.add.sprite(2400, 2400, "kenny-particles", "flame_04.png");
        this.leftMovingGas.setAlpha(2);
        this.leftMovingGas.setImmovable(true);
        this.children.bringToTop(this.leftMovingGas);
        this.leftMovingGas.setTint(0xffb701);
        this.leftMovingGas.body.setAllowGravity(false);
        this.leftMovingGas.displayHeight = this.scale.height;
        this.leftMovingGas.displayWidth = 600;
        this.leftMovingGas.body.setSize(this.leftMovingGas.displayWidth - 300, this.leftMovingGas.displayHeight - 250);
        this.leftMovingGas.setVelocityX(0); //starts at 0 speed since its not triggered yet
        //contact check
        this.physics.add.overlap(my.sprite.player, this.leftMovingGas, () => {

            this.scene.start("lose");
        });
        

        //New cannon code
        this.time.addEvent({
            delay: 2000, // Fire every second
            loop: true,
            callback: () => {
                for (let i = 0; i < this.cannonTiles.length; i++) {
                    let spawnX = this.cannonTiles[i].pixelX;
                    let spawnY = this.cannonTiles[i].pixelY;

                    let projectile = this.physics.add.sprite(spawnX, spawnY + 9, 'pizzaBullet');
                    projectile.setTint(0xFF0000); 
                    this.projectileGroup.add(projectile);
                    projectile.setGravityY(-this.physics.world.gravity.y);
                    projectile.setVelocityX(-150); // Change as needed per cannon direction
                }
            }
        });

        // Destroy projectiles that hit a tile marked with "collides: true"
        this.physics.add.collider(this.projectileGroup, this.groundLayer, (projectile, tile) => {
            
            projectile.destroy();
        });

        //Text
        let centerX = this.cameras.main.width / 2;
        let centerY = this.cameras.main.height / 2;

        my.text = my.text || {};
        my.text.pizzaCount = this.add.text(centerX + 225, centerY - 125, "Pizzas: 0", {
            fontFamily: 'Courier New',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(1, 0); 

        my.text.pizzaCount.setScrollFactor(0); 

        //Instructions
        // update HTML description
            document.getElementById('description').innerHTML = '<h2><br> A: Left // D: Right // J: Jump // H: Dodge </h2><br>Use the dodge to switch between red and blue tiles! Dodging also makes you immune to projectiles. 9: God Mode // 0: Infinite Airdodges'
    }
    
    update() {

        if(this.healthPoints == false){
            this.scene.start("lose");
        }
        //Movement
        //Prevent movement during specific states
        if(!this.dashingState) {
            //Wall jump locked movement
            if (this.isWallJumpLocked) {
                // Force max horizontal velocity in facing direction
                const velX = this.playerFacedRight ? this.MAX_SPEED : -this.MAX_SPEED;
                my.sprite.player.setVelocityX(velX);
                my.sprite.player.setAccelerationX(0); // ensure no extra acceleration is applied
            }
            //Detect Input
            else { 
                if ((cursors.left.isDown || this.aKey.isDown)) {            
                    this.playerFacedRight = false;
                    my.sprite.player.setAccelerationX(-this.ACCELERATION);
                    my.sprite.player.setFlip(true, false);
                    my.sprite.player.anims.play('walk', true);

                    //Particle code
                    my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
                    my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
                    if (my.sprite.player.body.blocked.down) 
                        my.vfx.walking.start();
                    else { my.vfx.walking.stop(); }

                } else if((this.dKey.isDown || cursors.right.isDown)) {
                    this.playerFacedRight = true;
                    my.sprite.player.setAccelerationX(this.ACCELERATION);
                    my.sprite.player.resetFlip();
                    my.sprite.player.anims.play('walk', true);

                    //Particle code
                    my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-20, my.sprite.player.displayHeight/2-5, false);
                    my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
                    if (my.sprite.player.body.blocked.down) 
                        my.vfx.walking.start();
                    else { my.vfx.walking.stop(); }

                } else {
                    // Set acceleration to 0 and have DRAG take over
                    my.sprite.player.setAccelerationX(0);
                    if(this.dashActive){
                        my.sprite.player.setDragX(this.DRAG);
                    }else{
                        my.sprite.player.setDragX(this.DRAG);

                    }
                    my.sprite.player.anims.play('idle');
                    // TODO: have the vfx stop playing
                    my.vfx.walking.stop();
                }
            }
        }
        //Speed cap
        my.sprite.player.body.velocity.x = Phaser.Math.Clamp(my.sprite.player.body.velocity.x, -this.MAX_SPEED, this.MAX_SPEED);

        //Wall Slide Stuff
        let touchingLeftWall = my.sprite.player.body.blocked.left;
        let touchingRightWall = my.sprite.player.body.blocked.right;
        let falling = my.sprite.player.body.velocity.y > 0;
        let inAir = !my.sprite.player.body.blocked.down;

        let pressingLeft = cursors.left.isDown || this.aKey.isDown;
        let pressingRight = cursors.right.isDown || this.dKey.isDown;

        let isWallSliding = inAir && falling && (
            (touchingLeftWall && pressingLeft) || 
            (touchingRightWall && pressingRight)
        );

        // Wall slide condition
        if (inAir && falling) {
            if ((touchingLeftWall && pressingLeft) || (touchingRightWall && pressingRight)) {
                // Clamp fall speed
                my.sprite.player.body.setVelocityY(Math.min(my.sprite.player.body.velocity.y, this.WALL_SLIDE_SPEED));
                // Make player sprite funny
                my.sprite.player.setScale(this.SCALE * 0.8, this.SCALE);
                // Start wall sliding vfx
                //my.vfx.walls.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 20, my.sprite.player.displayHeight / 2, false);
                //my.vfx.walls.setParticleSpeed(0, this.PARTICLE_VELOCITY);  // falling smoke
               // my.vfx.walls.start();
            } else { /*my.vfx.walls.stop(); */}
        } else {
            //Revert the funny
            my.sprite.player.setScale(this.SCALE, this.SCALE);
            //Stop vfx
            //my.vfx.walls.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && !this.isJumping && (Phaser.Input.Keyboard.JustDown(cursors.up) || this.jKey.isDown)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            
            // Start jump vfx
            my.vfx.jump.explode();
            //Audio
            this.jumpSfx.play();

            //Variable Jump
            this.isJumping = true;
            this.jumpTimer = 0;

            //Double Jump
            if(!my.sprite.player.body.blocked.down && this.doubleJumpActive){
                this.doubleJumpAvailable = 0;
            }
        }
        //Detect for wall jump
        if (isWallSliding && (Phaser.Input.Keyboard.JustDown(cursors.up) || Phaser.Input.Keyboard.JustDown(this.jKey))) {
            if (touchingLeftWall) {
                this.canAirDodge = true;
                this.playerFacedRight = true;
                my.sprite.player.resetFlip();
                my.sprite.player.setVelocityX(this.WALL_JUMP_X);  // Jump to the right
            } else if (touchingRightWall) {
                this.canAirDodge = true;
                this.playerFacedRight = false;
                my.sprite.player.setFlip(true, false);
                my.sprite.player.setVelocityX(-this.WALL_JUMP_X); // Jump to the left
            }

            my.sprite.player.setVelocityY(this.WALL_JUMP_Y); // Jump upward
            this.isJumping = true;
            this.jumpTimer = 0;

            // Lock out directional movement
            this.isWallJumpLocked = true;
            this.wallJumpLockoutTimer = this.time.now;

            // Start jump vfx
            my.vfx.jump.explode();
            //Audio
            this.jumpSfx.play();
            
        }
        //Handle end of wallJumpLocked
        if (this.isWallJumpLocked) {
            if (this.time.now - this.wallJumpLockoutTimer > this.WALLJUMP_LOCKOUT_DURATION) {
                this.isWallJumpLocked = false;
            } else {
                // During lockout, prevent unintended drift
                my.sprite.player.setAccelerationX(0);
            }
        }
        // Variable jump handling
        if (this.isJumping) {
            this.jumpTimer += this.game.loop.delta;

            // Player releases jump after MIN_JUMP_TIME while still ascending
            if (
                !(cursors.up.isDown || this.jKey.isDown) &&
                my.sprite.player.body.velocity.y < 0 &&
                this.jumpTimer >= this.MIN_JUMP_TIME
            ) {
                my.sprite.player.body.setVelocityY(my.sprite.player.body.velocity.y * 0.5); // cut jump
                this.isJumping = false;
            }

            // End jump early if player stops ascending or hits ceiling
            if (my.sprite.player.body.velocity.y >= 0 || my.sprite.player.body.blocked.up) {
                this.isJumping = false;
            }
        }
        if(my.sprite.player.body.blocked.down && this.doubleJumpActive) {
            this.doubleJumpAvailable = 1;
        }

        if(my.sprite.player.body.blocked.down && this.dashActive) {
            this.dashingState = false;
        }

        


        //Restart
        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
            

        //Basic Airdodge code
        // Airdodge in 8 directions
        if (Phaser.Input.Keyboard.JustDown(this.hKey) && !this.dashingState && this.canAirDodge) {
            this.dodgeSfx.play();

            this.canAirDodge = false;
            let inputX = 0; 
            let inputY = 0;
            const speed = this.airDodgeSpeed;
            this.intangible = true;

            if (cursors.left.isDown || this.aKey.isDown) inputX -= 1;
            if (cursors.right.isDown || this.dKey.isDown) inputX += 1;
            if (cursors.up.isDown || this.wKey.isDown) inputY -= 1;
            if (cursors.down.isDown || this.sKey.isDown) inputY += 1;

            let dir = new Phaser.Math.Vector2(inputX, inputY);

            // If no directional input, default to facing direction
            if (dir.length() === 0) {
                dir.x = this.playerFacedRight ? 1 : -1;
                dir.y = 0;
            }

            dir = dir.normalize().scale(speed);
            this.airDodgeVector.copy(dir);
            my.sprite.player.setVelocity(dir.x, dir.y);

            this.dashingState = true;
            this.airDodgeTimer = this.time.now;
            my.sprite.player.body.allowGravity = false;

            // Switch vision when dodging
            this.SwitchVision();
        }


        //Handle Dashing state
        if (this.dashingState) {
            const elapsed = this.time.now - this.airDodgeTimer;
            const progress = Phaser.Math.Clamp(elapsed / this.airDodgeDuration, 0, 1);

            // Lerp from initial vector to zero
            let currentVx = Phaser.Math.Linear(this.airDodgeVector.x, 0, progress);
            let currentVy = Phaser.Math.Linear(this.airDodgeVector.y, 0, progress);
            my.sprite.player.setVelocity(currentVx, currentVy);

            //VFX
            my.vfx.trail.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 20, my.sprite.player.displayHeight / 2 - 15, false);
            my.vfx.trail.start();

            if (elapsed >= this.airDodgeDuration || my.sprite.player.body.blocked.down && currentVy != 0) {
                this.dashingState = false;
                my.sprite.player.body.allowGravity = true;
                this.intangible = false;
                my.vfx.trail.stop();
            }
        }

        //Give canDodge back (We do this when the player is also wallsliding)
        if(my.sprite.player.body.blocked.down || this.infiniteDodges) {
            this.canAirDodge = true;
        }
        
        //Audio
        //Reduce cooldown each frame
        this.footstepCooldown -= this.game.loop.delta;

        const isRunning = (cursors.left.isDown || this.aKey.isDown || cursors.right.isDown || this.dKey.isDown);
        const isOnGround = my.sprite.player.body.blocked.down;

        if (isRunning && isOnGround && this.footstepCooldown <= 0) {
            this.footsteps[this.currentFootstepIndex].play({ volume: 0.25 });
            
            // Alternate to the other sound for next time
            this.currentFootstepIndex = (this.currentFootstepIndex + 1) % this.footsteps.length;

            // Reset cooldown
            this.footstepCooldown = this.FOOTSTEP_INTERVAL;
        }
    
        //trigger for leftgas to move
        if (!this.leftGasTriggered && my.sprite.player.x <= 1742 && my.sprite.player.y <= 2646) {
            this.leftMovingGas.setVelocityX(-90);  // move left
            this.leftGasTriggered = true;
            console.log("Left-moving gas triggered!");
        }
    }

    SwitchVision()
    {
        if(this.visionState === "red"){
                this.visionState = "blue";
                console.log(this.blueTiles)
                 for(let elements of this.blueTiles){
                    elements.tint =  0x00ffff;
                }
                 for(let elements of this.redTiles){
                    elements.tint = 0x4a4a4a;
                }

                my.vfx.trail.destroy();
                my.vfx.trail = null; 
                //Trail (blue)
                my.vfx.trail = this.add.particles(0, 0, "kenny-particles", {
                    frame: ['spark_01.png', 'spark_02.png', 'spark_03.png', 'spark_04.png'],
                    // TODO: Try: add random: true
                    random: true,
                    scale: {start: 0.025, end: 0.075},
                    // TODO: Try: maxAliveParticles: 8,
                    lifespan: 200,
                    // TODO: Try: gravityY: -400,
                    alpha: {start: 1, end: 0.75}, 
                    frequency: 10,
                    tint: 0x00ffff,
                });
            }else{
                 this.visionState = "red";
                 for(let elements of this.redTiles){
                    elements.tint =  0xff0000;
                }
                 for(let elements of this.blueTiles){
                    elements.tint = 0x4a4a4a;
                }

                my.vfx.trail.destroy();
                my.vfx.trail = null; 
                my.vfx.trail = this.add.particles(0, 0, "kenny-particles", {
                    frame: ['spark_01.png', 'spark_02.png', 'spark_03.png', 'spark_04.png'],
                    // TODO: Try: add random: true
                    random: true,
                    scale: {start: 0.025, end: 0.075},
                    // TODO: Try: maxAliveParticles: 8,
                    lifespan: 200,
                    // TODO: Try: gravityY: -400,
                    alpha: {start: 1, end: 0.75}, 
                    frequency: 10,
                    tint: 0xff0000,
                });
            }
    }
        
}
