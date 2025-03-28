import Phaser from "phaser";

export default class EndScene extends Phaser.Scene {
    private text: Phaser.GameObjects.Text | null = null;
    private winner: boolean = false;

    constructor() {
        super("EndScene");
    }

    init(data: { isWinner: boolean }) {
        console.log(data);
        this.winner = data.isWinner;
        console.log(this.winner);
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
        if (this.winner) {
            this.text.setText("You won!");
        } else {
            this.text.setText("You lost!");
        }
    }
}
