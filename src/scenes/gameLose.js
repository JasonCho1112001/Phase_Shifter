class gameLose extends Phaser.Scene{

    constructor(){
        super("lose");
    }
    init(){

    }

    create(){
        my.text.endMessage = this.add.text(this.game.config.width/2,this.game.config.height/2,"GAME OVER!" +  "\n" +"Press Space to try again!")
        this.spaceKey = this.input.keyboard.addKey('SPACE');
    }

    update(){
        if(this.spaceKey.isDown){
            this.scene.start("loadScene");
        }
    }
}