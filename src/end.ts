import Phaser from "phaser";

export default class EndScene extends Phaser.Scene {
    private text: Phaser.GameObjects.Text | null = null;
    private loser: boolean = false;

    constructor() {
        super("EndScene");
    }

    init(data: { isLoser: boolean }) {
        console.log(data);
        this.loser = data.isLoser;
        console.log(this.loser);
    }

    create() {
        this.text = this.add
            .text(innerWidth / 2, innerHeight / 2, "", {
                fontSize: "32px",
                color: "#ffffff",
                backgroundColor: "fff",
                padding: {
                    x: 10,
                    y: 5,
                },
            })
            .setOrigin(0.5);
        if (this.loser) {
            this.text.setText("You lost!");
        } else {
            this.text.setText("You won!");
        }
    }
}
