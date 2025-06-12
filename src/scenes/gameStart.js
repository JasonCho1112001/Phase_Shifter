class gameStart extends Phaser.Scene {
    constructor() {
        super("start");
    }

    create() {
        const centerX = game.config.width / 2;
        const centerY = game.config.height / 2;

        // Title text: "Gas!"
        this.add.text(centerX, centerY - 100, "Gas!", {
            font: "96px Courier New",
            fill: "#00ff00"
        }).setOrigin(0.5);

        // Story text
        const storyText = 
            "\n \n \nYou hear the cries of your fellow coal miners\n" +
            "as they choke on poisonous gas that was released " +
            "in a drilling operation.\n \nThere's no time to think. " +
            "You have to get out. NOW. \n" +
            "\n \n \nPress J to continue..."

        this.add.text(centerX, centerY + 20, storyText, {
            font: "20px Courier New",
            fill: "#ffffff",
            align: "center",
            wordWrap: { width: 600, useAdvancedWrap: true }
        }).setOrigin(0.5);

        // Start key
        this.spaceKey = this.input.keyboard.addKey('J');
    }

    update() {
        if (this.spaceKey.isDown) {
            this.scene.start("loadScene");
        }
    }
}
