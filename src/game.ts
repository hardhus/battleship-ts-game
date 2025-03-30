import Phaser from "phaser";
import socket from "./socket";

const boardConfig = {
    size: 10,
    spacing: 10,
    offset: {
        top: 50,
        left: 50,
        // right: 50,
        // bottom: 50,
    },
    cellSize: 50,
    shipOffset: 10,
};

export default class GameScene extends Phaser.Scene {
    private board: Phaser.GameObjects.Rectangle[][] = [];
    private turnText: Phaser.GameObjects.Text | undefined;
    private remainingShipsText: Phaser.GameObjects.Text | undefined;
    private otherPlayerWaitingText: Phaser.GameObjects.Text | undefined;

    private normalShips: Phaser.GameObjects.Image[] = [];
    private destroyedShips: Phaser.GameObjects.Image[] = [];

    private ships: { name: number; x: number; y: number }[] = [];

    private cellDefaultColor: number = 0x1e90ff;
    private cellHitColor: number = 0xdc143c;
    private cellMissColor: number = 0xffd700;

    private remainingShips = 5;

    private isPlayerTurn = true;
    private isShipsPlaced = false;
    private isGameStarted = false;

    private roomName: string = "";

    constructor() {
        super("GameScene");
    }

    init(data: { isPlayerTurn: boolean; roomName: string }) {
        this.isPlayerTurn = data.isPlayerTurn;
        this.roomName = data.roomName;
        console.log(this.isPlayerTurn);
    }

    preload() {
        this.load.image("normalShip", "Assets/normalShip.png");
        this.load.image("destroyedShip", "Assets/destroyedShip.png");
    }

    create() {
        this.createBoard();

        this.createText();

        this.initSocket();
    }

    initSocket() {
        socket.on("room:player:ready", (playerId: string) => {
            if (socket.id !== playerId) {
                this.otherPlayerWaitingText?.setText("Other player is ready!");
            }
        });

        socket.on("room:game:start", () => {
            this.remainingShipsText?.destroy();
            this.otherPlayerWaitingText?.destroy();
            this.turnText?.setVisible(true);
            this.isGameStarted = true;
        });

        socket.on("room:player:turn", (data: { x: number; y: number }) => {
            if (!this.isPlayerTurn) {
                console.log("Other player clicked on cell", data.x, data.y);
                this.isPlayerTurn = true;
                this.turnText?.setText("Your Turn");
            }
        });

        socket.on("room:player:hit", (data: { playerId: string; x: number; y: number }) => {
            console.log("Kosul testsi sonucu", socket.id === data.playerId);
            console.log("data", data);
            if (socket.id === data.playerId) {
                // vuran kişi
                this.handleAttackerHit(data);
            } else {
                // vurulan kişi
                this.handleDefenderHit(data);
            }
        });

        socket.on("room:game:end", (loser: string) => {
            console.log("Game ended", {
                socket: socket.id,
                data: loser,
                win: loser === socket.id,
            });
            const isLoser = loser === socket.id;

            this.scene.start("EndScene", { isLoser });
        });
    }

    handleAttackerHit(data: { playerId: string; x: number; y: number }) {
        console.log("Sen bir gemiyi vurdun!", data);
        this.board[data.x][data.y].fillColor = this.cellHitColor;
    }

    handleDefenderHit(data: { playerId: string; x: number; y: number }) {
        console.log("Bir gemin vuruldun!", data);

        const shipIndex = this.ships.findIndex((ship) => ship.x === data.x && ship.y === data.y);

        if (shipIndex !== -1) console.log("ERRORRRRRR!!!!");

        this.normalShips[shipIndex].destroy();
        this.normalShips.splice(shipIndex, 1);
        this.ships.splice(shipIndex, 1);

        const { x, y } = data;

        const pixelX =
            boardConfig.offset.left + boardConfig.cellSize / 2 + y * (boardConfig.spacing + 50);
        const pixelY =
            boardConfig.offset.top + boardConfig.cellSize / 2 + x * (boardConfig.spacing + 50);

        const destroyedShip = this.add
            .image(pixelX, pixelY, "destroyedShip")
            .setOrigin(0.5, 0.5)
            .setDisplaySize(
                boardConfig.cellSize - boardConfig.shipOffset,
                boardConfig.cellSize - boardConfig.shipOffset,
            );

        this.destroyedShips.push(destroyedShip);
        if (this.destroyedShips.length === 5) {
            socket.emit("room:game:end", { roomName: this.roomName, loser: socket.id });
        }
    }

    createBoard() {
        for (let i = 0; i < boardConfig.size; i++) {
            this.board[i] = [];
            for (let j = 0; j < boardConfig.size; j++) {
                const x =
                    boardConfig.offset.left +
                    boardConfig.cellSize / 2 +
                    j * (boardConfig.spacing + 50);
                const y =
                    boardConfig.offset.top +
                    boardConfig.cellSize / 2 +
                    i * (boardConfig.spacing + 50);

                const cell = this.add
                    .rectangle(
                        x,
                        y,
                        boardConfig.cellSize,
                        boardConfig.cellSize,
                        this.cellDefaultColor,
                    )
                    .setOrigin(0.5, 0.5)
                    .setInteractive()
                    .on("pointerdown", () => {
                        this.onCellClick(i, j, x, y);
                    });

                this.board[i][j] = cell;
            }
        }
    }

    onCellClick(i: number, j: number, x: number, y: number) {
        if (!this.isShipsPlaced) {
            this.placeShip(i, j, x, y);
        } else {
            if (!this.isGameStarted) {
                return;
            }
            if (this.isPlayerTurn) {
                this.playerTurn(i, j);
            }
        }
    }

    playerTurn(i: number, j: number) {
        console.log("Player clicked on cell: ", i, j);
        this.board[i][j].fillColor = this.cellMissColor;
        socket.emit("room:player:turn", {
            roomName: this.roomName,
            playerId: socket.id,
            x: i,
            y: j,
        });
        this.isPlayerTurn = false;
        this.turnText?.setText("Other's Turn");
    }

    placeShip(i: number, j: number, x: number, y: number) {
        const isAlreadyPlaced = this.ships.some((ship) => ship.x === i && ship.y === j);

        if (isAlreadyPlaced) {
            return;
        }

        const ship = this.add
            .image(x, y, "normalShip")
            .setOrigin(0.5, 0.5)
            .setDisplaySize(
                boardConfig.cellSize - boardConfig.shipOffset,
                boardConfig.cellSize - boardConfig.shipOffset,
            );
        this.normalShips.push(ship);
        this.ships.push({ name: this.remainingShips, x: i, y: j });
        this.remainingShips--;
        this.remainingShipsText?.setText(`Ships: ${this.remainingShips}`);

        if (this.remainingShips == 0) {
            this.isShipsPlaced = true;
            socket.emit("room:player:ready", this.roomName, this.ships);
        }
    }

    createText() {
        this.turnText = this.add
            .text(50, 10, this.isPlayerTurn ? "Your Turn" : "Other's Turn", {
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
    }
}
