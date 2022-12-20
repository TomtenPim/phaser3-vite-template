import Phaser, { Game } from 'phaser'

import HelloWorldScene from './HelloWorldScene'
import GameScene from './scene/GameScene'

const config = {
	type: Phaser.AUTO,
	parent: 'app',
	width: 800,
	fps: { forceSetTimeOut: true, target: 60 },
	height: 600,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 300 },
		},
	},
	scene: [GameScene],
}

export default new Phaser.Game(config)
