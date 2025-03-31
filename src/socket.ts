import { io } from "socket.io-client";

const socketUrl =
    process.env.NODE_ENV === "production"
        ? "https://battleshipserver.hardhus.com/battleship"
        : "http://localhost:3000/battleship";

const socket = io(socketUrl);

export default socket;
