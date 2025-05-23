class gameWin extends Phaser.Scene{

    constructor(){
        super("win");
    }
    init(){

    }

    create(){
        my.text.endMessage = this.add.text(this.game.config.width/2,this.game.config.height/2,"You saved Bartholomew!"+ "\n" +"SPACE to play again");
        this.spaceKey = this.input.keyboard.addKey('SPACE');
    }

    update(){
        if(this.spaceKey.isDown){
            this.scene.start("loadScene");
        }
    }
}