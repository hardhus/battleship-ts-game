import Phaser from "phaser";
import socket from "./socket";

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    init(data: { error: string }) {
        if (data.error) {
            alert(data.error);
        }
    }

    preload() {}

    create() {
        const createRoomButton = this.add
            .text(innerWidth / 2, innerHeight / 2, "Create Room", {
                fontSize: "32px",
                color: "#000",
                backgroundColor: "#fff",
                padding: { x: 10, y: 5 },
            })
            .setOrigin(0.5)
            .setInteractive();
        createRoomButton.on("pointerdown", () => {
            socket.emit("room:create");
        });

        socket.on("room:created", (roomName: string) => {
            console.log(`Room created with ID: ${roomName}`);
            this.scene.start("RoomScene", { roomName: roomName });
        });

        const joinRoomButton = this.add
            .text(innerWidth / 2, innerHeight / 2 - createRoomButton.height - 20, "Join Room", {
                fontSize: "32px",
                color: "#000",
                backgroundColor: "#fff",
                padding: { x: 10, y: 5 },
            })
            .setOrigin(0.5)
            .setInteractive();

        joinRoomButton.on("pointerdown", () => {
            const roomName = prompt("Enter Room ID:");
            console.log(roomName);
            socket.emit("room:join", roomName);
        });

        socket.on("room:joined", (roomName: string) => {
            console.log(`Joined room with ID: ${roomName}`);
            this.scene.start("RoomScene", { roomName: roomName });
        });
    }

    // update(time: number, delta: number): void {}
}
