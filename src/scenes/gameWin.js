class gameWin extends Phaser.Scene {
    constructor() {
        super("win");
    }

    create() {
        const centerX = game.config.width / 2;
        const centerY = game.config.height / 2;

        // Title text: "Gas!"
        this.add.text(centerX, centerY - 100, "YOU WIN!\n", {
            font: "96px Courier New",
            fill: "#00ff00"
        }).setOrigin(0.5);

        // Story text
        const storyText = 
            "\n \n \nYou manage to open the exit hatch \n and climb out the mine shaft.\n \n" +
            "You breathe in the fresh air and laugh out loud as you gaze at the beautiful outdoors " +
            "and enjoy the sun on your face. \n\n" +
            "You look around to see if anyone else made it. \n\n\n" +
            "No other survivors... \nMaybe you should go back and look?\n" +
            "\n \n \nPress J to play again!"

        this.add.text(centerX, centerY + 20, storyText, {
            font: "20px Courier New",
            fill: "#ffffff",
            align: "center",
            wordWrap: { width: 600, useAdvancedWrap: true }
        }).setOrigin(0.5);

        // Small credits in bottom-right
        this.add.text(game.config.width - 20, game.config.height - 10, 
            "Created by Jason Cho, Ben Fereydouni, and Elijah Martiniano", {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#bbbbbb'
        }).setOrigin(1, 1);  // align bottom-right

        // Start key
        this.spaceKey = this.input.keyboard.addKey('J');
    }

    update() {
        if (this.spaceKey.isDown) {
            this.scene.start("loadScene");
        }
    }
}
