import Phaser from "phaser";
import socket from "./socket";

export default class RoomScene extends Phaser.Scene {
    private roomNameText: Phaser.GameObjects.Text | undefined;
    private copyButton: Phaser.GameObjects.Text | undefined;
    private roomName: string = "";

    constructor() {
        super("RoomScene");
    }

    init(data: { roomName: string }) {
        const room = data.roomName;
        this.roomName = room;
        console.log(`Room ID: ${room}`);

        if (!room) {
            this.scene.start("MenuScene", { error: "Room ID not provided" });
            return;
        }

        this.roomNameText = this.add
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
        this.roomNameText.setText(`Room ID: ${room}`);

        this.copyButton = this.add
            .text(innerWidth / 2, innerHeight / 2 + 50, "Copy Room ID", {
                fontSize: "32px",
                color: "#000",
                backgroundColor: "#007BFF", // Buton rengi
                padding: {
                    x: 10,
                    y: 5,
                },
            })
            .setOrigin(0.5)
            .setInteractive();

        this.copyButton.on("pointerdown", () => {
            this.copyToClipboard(room);
        });
    }

    create() {
        socket.on("room:player:joined", (playerId: string) => {
            console.log(`Player ${playerId} has joined the room`);
            console.log("socket.id", socket.id);
            console.log("playerId", playerId);
            this.scene.start("GameScene", {
                isPlayerTurn: socket.id === playerId,
                roomName: this.roomName,
            });
        });
    }

    copyToClipboard(roomName: string) {
        if (navigator.clipboard) {
            navigator.clipboard
                .writeText(roomName)
                .then(() => {
                    console.log("Room ID copied to clipboard");
                })
                .catch((err) => {
                    console.error("Failed to copy Room ID to clipboard", err);
                });
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = roomName;
            textArea.select();
            try {
                document.execCommand("copy");
                console.log("Room ID copied to clipboard");
            } catch (err) {
                console.error("Failed to copy Room ID to clipboard", err);
            }
            textArea.remove();
        }
    }
}
