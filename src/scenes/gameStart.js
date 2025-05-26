class gameStart extends Phaser.Scene{

    constructor(){
        super("start");
    }
    init(){

    }

    create(){
        my.text.endMessage = this.add.text(100,100,"The Order has taken your best friend Bartholomew the Bee and you must save him from the toxic facility!" + "\n"+ "How to play: " +  "\n" +"Use Left, Right, and Up Keys for movement. "+  "\n" +"Collect as many Pizzas as you can on your way to save Bartholomew. " +  "\n" +"Keep in mind your lives left in the top right!" +  "\n" +"[Yellow crates] to aquire a Wall Jump, collide against obstacle & press Up Arrow to activate!"+  "\n" +"[Blue crates] to aquire a Dash, press SPACE to utilize!"+  "\n" +"[Red crates] to aquire a Double Jump, jump while in mid-air to activate!")

        my.text.endMessage = this.add.text(game.config.width/2-100,game.config.height/2,"TOXIC ESCAPADE" +  "\n" +"Press space to play")
        this.spaceKey = this.input.keyboard.addKey('SPACE');
    }

    update(){
        if(this.spaceKey.isDown){
            this.scene.start("loadScene");
        }
    }
}