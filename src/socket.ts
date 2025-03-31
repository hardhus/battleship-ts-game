import { io } from "socket.io-client";

const socketUrl =
    process.env.NODE_ENV === "production"
        ? "http://battleshipserver.hardhus.com"
        : "http://localhost:3000/battleship";

const socket = io(socketUrl);

export default socket;
