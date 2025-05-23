class gameStart extends Phaser.Scene{

    constructor(){
        super("start");
    }
    init(){

    }

    create(){
        my.text.endMessage = this.add.text(100,100,"The Order has taken your best friend Bartholomew the Bee and you must save him from the toxic facility!" + "\n"+ "How to play: " +  "\n" +"Collect as many Pizzas as you can on your way to save Bartholomew. " +  "\n" +"Keep in mind your lives left in the top right!" +  "\n" +"Collect the blue crate to aquire a special dash and press SPACE to utilize it!")

        my.text.endMessage = this.add.text(game.config.width/2-100,game.config.height/2,"TOXIC ESCAPADE" +  "\n" +"Press space to play")
        this.spaceKey = this.input.keyboard.addKey('SPACE');
    }

    update(){
        if(this.spaceKey.isDown){
            this.scene.start("loadScene");
        }
    }
}