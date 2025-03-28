import Phaser from "phaser";
import MenuScene from "./menu";
import GameScene from "./game";
import RoomScene from "./room";
import EndScene from "./end";

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    scene: [MenuScene, GameScene, RoomScene, EndScene],
    // scene: [GameScene, MenuScene, RoomScene],
};

new Phaser.Game(config);
