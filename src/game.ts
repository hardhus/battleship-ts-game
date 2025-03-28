import Phaser from "phaser";
import socket from "./socket";

const BoardConfig = {
    size: 10,
};

export default class GameScene extends Phaser.Scene {
    private board: Phaser.GameObjects.Rectangle[][] = [];
    private circles: Phaser.GameObjects.Arc[] = [];
    private otherCircles: Phaser.GameObjects.Arc[] = [];
    private yourCircles: Phaser.GameObjects.Arc[] = [];
    private turnText: Phaser.GameObjects.Text;
    private remainingShipsText: Phaser.GameObjects.Text;
    private otherPlayerWaitingText: Phaser.GameObjects.Text;
    private boardSize = 10;
    private cellSpacing = 10;
    private boardOffset = 100;
    private cellSizeX =
        (innerWidth - 2 * this.boardOffset - (this.boardSize - 1) * this.cellSpacing) /
        this.boardSize;
    private cellSizeY =
        (innerHeight - 2 * this.boardOffset - (this.boardSize - 1) * this.cellSpacing) /
        this.boardSize;
    private isPlayerTurn = true;
    private isShipPlaced = false;
    private remainingShips = 5;
    private roomName = "";
    private ships: { name: number; x: number; y: number }[] = [];
    private normalShip: Phaser.GameObjects.Image;
    private destroyedShip: Phaser.GameObjects.Image;
    private normalShips: Phaser.GameObjects.Image[] = [];
    private destroyedShips: Phaser.GameObjects.Image[] = [];

    constructor() {
        super("GameScene");
    }

    init(data: { isPlayerTurn: boolean; roomName: string }) {
        this.roomName = data.roomName;
        this.isPlayerTurn = data.isPlayerTurn;
        console.log(this.isPlayerTurn);
    }

    preload() {
        this.load.image("normalShip", "Assets/normalShip.png");
        this.load.image("destroyedShip", "Assets/destroyedShip.png");
    }

    create() {
        this.createBoard();

        this.turnText = this.add
            .text(100, 25, this.isPlayerTurn ? "Your Turn" : "Other's Turn", {
                fontSize: "32px",
                color: "#ffffff",
                backgroundColor: "fff",
                padding: {
                    x: 10,
                    y: 5,
                },
            })
            .setVisible(false);

        const remainingShipsNumber = this.remainingShips.toString();

        this.remainingShipsText = this.add.text(400, 25, `Ships: ${remainingShipsNumber}`, {
            fontSize: "32px",
            color: "#ffffff",
            backgroundColor: "fff",
            padding: {
                x: 10,
                y: 5,
            },
        });

        this.otherPlayerWaitingText = this.add.text(750, 25, "Wait other player...", {
            fontSize: "32px",
            color: "#ffffff",
            backgroundColor: "fff",
            padding: {
                x: 10,
                y: 5,
            },
        });

        socket.on("room:player:ready", (playerId: string) => {
            if (socket.id !== playerId) {
                this.otherPlayerWaitingText.setText("Other player is ready!");
            }
        });

        socket.on("room:game:start", () => {
            this.remainingShipsText.destroy();
            this.otherPlayerWaitingText.destroy();
            this.turnText.setVisible(true);
        });

        socket.on("room:player:turn", (data: { x: number; y: number }) => {
            if (!this.isPlayerTurn) {
                console.log("Other player clicked on cell", data.x, data.y);
                this.isPlayerTurn = true;
                this.turnText.setText("Your Turn");
            }
        });

        socket.on("room:player:hit", (data: { playerId: string; x: number; y: number }) => {
            console.log("Kosul testsi sonucu", socket.id === data.playerId);
            if (socket.id === data.playerId) {
                // vuran kişi
                const hitX =
                    this.boardOffset +
                    data.x * (this.cellSizeX + this.cellSpacing) +
                    this.cellSizeX / 2;
                const hitY =
                    this.boardOffset +
                    data.y * (this.cellSizeY + this.cellSpacing) +
                    this.cellSizeY / 2;

                // this.otherCircles.push(
                //     this.add
                //         .circle(hitX - 30, hitY, this.cellSizeX / 5, 0x00ff00)
                //         .setOrigin(0.5, 0.5),
                // );
                const ship = this.add
                    .image(hitX + this.cellSizeX / 2, hitY + this.cellSizeY / 2, "normalShip")
                    .setScale(3, 3);
                this.destroyedShips.push(ship);
                this.ships.push({ name: this.remainingShips, x: hitX, y: hitY });
                this.remainingShips--;
                this.remainingShipsText.setText(`Ships: ${this.remainingShips}`);
                if (this.otherCircles.length === 5) {
                    socket.emit("room:game:end", { roomName: this.roomName, winner: socket.id });
                }
            } else {
                // vurulan kişi
                const hitX =
                    this.boardOffset +
                    data.x * (this.cellSizeX + this.cellSpacing) +
                    this.cellSizeX / 2;
                const hitY =
                    this.boardOffset +
                    data.y * (this.cellSizeY + this.cellSpacing) +
                    this.cellSizeY / 2;

                const ship = this.circles.find((circle) => {
                    return circle.x === hitX && circle.y === hitY;
                });

                if (ship) {
                    ship.setFillStyle(0xff0000); // Kırmızı renk
                }
            }
        });

        socket.on("room:game:end", (winner: string) => {
            console.log("Game ended", {
                socket: socket.id,
                data: winner,
                win: winner === socket.id,
            });
            const isWinner = winner === socket.id;

            this.scene.start("EndScene", { isWinner });
        });
    }

    createBoard() {
        // Hücreleri oluşturuyoruz, her hücreye boşluk ekliyoruz
        for (let i = 0; i < this.boardSize; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                const x = this.boardOffset + i * (this.cellSizeX + this.cellSpacing); // X koordinatı
                const y = this.boardOffset + j * (this.cellSizeY + this.cellSpacing); // Y koordinatı

                // Hücreyi oluşturuyoruz
                const cell = this.add.rectangle(x, y, this.cellSizeX, this.cellSizeY, 0x87cefa);

                // Hücrenin başlangıç noktasını ayarlıyoruz
                cell.setOrigin(0, 0);

                // Hücreye etkileşim ekliyoruz
                cell.setInteractive();
                cell.on("pointerdown", () => {
                    if (!this.isShipPlaced) {
                        // const circle = this.add.circle(
                        //     x + this.cellSizeX / 2,
                        //     y + this.cellSizeY / 2,
                        //     this.cellSizeX / 5,
                        //     0xff00ff,
                        // );
                        // this.circles.push(circle);
                        const ship = this.add
                            .image(x + this.cellSizeX / 2, y + this.cellSizeY / 2, "normalShip")
                            .setScale(3, 3);
                        this.normalShips.push(ship);
                        this.ships.push({ name: this.remainingShips, x: i, y: j });
                        this.remainingShips--;
                        this.remainingShipsText.setText(`Ships: ${this.remainingShips}`);

                        if (this.remainingShips === 0) {
                            this.isShipPlaced = true;
                            socket.emit("room:player:ready", this.roomName, this.ships);
                        }
                    } else {
                        if (this.isPlayerTurn) {
                            console.log("Player clicked on cell", i, j);
                            const circle = this.add.circle(
                                x + 30 + this.cellSizeX / 2,
                                y + this.cellSizeY / 2,
                                this.cellSizeX / 5,
                                0x0000ff,
                            );
                            this.yourCircles.push(circle);
                            socket.emit("room:player:turn", {
                                roomName: this.roomName,
                                playerId: socket.id,
                                x: i,
                                y: j,
                            });
                            this.isPlayerTurn = false;
                            this.turnText.setText("Other's Turn");
                        }
                    }
                });

                // Hücreyi tahtaya ekliyoruz
                this.board[i].push(cell);
            }
        }
    }
}
