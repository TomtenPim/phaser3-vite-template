import Phaser, { Cameras } from 'phaser'
import ScoreLabel from '../ui/ScoreLabel'
import BombSpawner from './BombSpawner'

const GROUND_KEY = 'ground'
const GROUNDMAIN_KEY = 'groundMain'
const DUDE_KEY = 'dude'
const STAR_KEY = 'star'
const BOMB_KEY = 'bomb'
const SEEKER_KEY = 'seeker'
const SKY_KEY = 'sky'

var velocityX = 0;
var velocityY = 0;
var accelerationX = 0;
var accelerationY = 0;
var pickupVelocityX = 0;
var pickupVelocityY = 0;
var pickupAccelerationX = 0;
var pickupAccelerationY = 0;
var seekerVelocityX = 0;
var seekerVelocityY = 0;
var seekerAccelerationX = 0;
var seekerAccelerationY = 0;
var dash = 1;
var alive = 1;
var timer = 0;

const gravity = 20;

var text1;
var text1ball;
var textGameOver;

export default class GameScene extends Phaser.Scene {
	constructor() {
		super('game-scene')

		this.player = undefined
		this.cursors = undefined
		this.scoreLabel = undefined
		this.stars = undefined
		this.seeker = undefined
		this.bombSpawner = undefined
		this.sky = undefined

		this.gameOver = false
	}

	//Laddar in bild, ljud och spelaren
	preload() {
		this.load.image(SKY_KEY, 'assets/sky.png')
		this.load.image(GROUND_KEY, 'assets/platform.png')
		this.load.image(GROUNDMAIN_KEY, 'assets/platformStor.png')
		this.load.image(STAR_KEY, 'assets/star.png')
		this.load.image(BOMB_KEY, 'assets/bomb.png')
		this.load.spritesheet(SEEKER_KEY, 
			'assets/seeker.png',
			{ frameWidth:28, frameHeight:28}
		)

		this.load.spritesheet(DUDE_KEY,
			'assets/dudeball.png',
			{ frameWidth: 32, frameHeight: 31 }
		)

		this.load.audioSprite(
			'sfx',
			'assets/audio/fx_mixdown.json',
			[
				'assets/audio/fx_mixdown.ogg',
				'assets/audio/fx_mixdown.mp3',
			]);

		this.load.audioSprite(
			'music',
			'assets/audio/MC10_OST.json',
			[
				'assets/audio/MC10_OST.mp3'
			])

	}

	//Skapar objekt som visas och kan interageras med
	create() {
		this.sound.playAudioSprite('music', 'music', { volume: 0.6 })
		this.sound.volume = 0.5

		this.cameras.main.setBounds(-1200, 0, 3200, 600);
		this.physics.world.setBounds(-1200, -100, 3200, 800);

		this.createSky(-1200, 300)
		this.createSky(-400, 300)
		this.createSky(400, 300)
		this.createSky(1200, 300)
		this.createSky(2000, 300)


		text1 = this.add.text(10, 10, '');
		text1ball = this.add.text(500, 10, '');
		textGameOver;

		const platforms = this.createPlatforms()
		const mainPlatform = this.createMainPlatform()
		this.player = this.createPlayer()
		this.stars = this.createStars()
		this.seeker = this.createSeeker()

		this.scoreLabel = this.createScoreLabel(16, 16, 0).setScrollFactor(0);

		this.bombSpawner = new BombSpawner(this, BOMB_KEY)
		const bombsGroup = this.bombSpawner.group

		this.physics.add.collider(this.player, platforms)
		this.physics.add.collider(this.stars, platforms)
		this.physics.add.collider(this.player, mainPlatform)
		this.physics.add.collider(this.stars, mainPlatform)
		this.physics.add.collider(bombsGroup, platforms)
		this.physics.add.collider(bombsGroup, mainPlatform)
		this.physics.add.collider(this.seeker, platforms)
		this.physics.add.collider(this.seeker, mainPlatform)
		this.physics.add.collider(this.player, bombsGroup, this.hitBomb, null, this)
		this.physics.add.collider(this.player, this.seeker, this.hitSeeker, null, this)

		this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this)

		this.cursors = this.input.keyboard.addKeys(
			{
				up: Phaser.Input.Keyboard.KeyCodes.W,
				down: Phaser.Input.Keyboard.KeyCodes.S,
				left: Phaser.Input.Keyboard.KeyCodes.A,
				right: Phaser.Input.Keyboard.KeyCodes.D,
				jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
				dash: Phaser.Input.MOUSE_DOWN,
				reset: Phaser.Input.Keyboard.KeyCodes.R
			});

		this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
	}

	collectStar(player, star) {
		star.disableBody(true, true)

		this.scoreLabel.add(10)

		if (this.stars.countActive(true) === 0) {
			this.stars.children.iterate((child) => {
				child.enableBody(true, child.x, 0, true, true)
			})
		}

		this.sound.playAudioSprite('sfx', 'ping');

		this.bombSpawner.spawn(player.x)

		pickupAccelerationX = accelerationX
		pickupAccelerationY = accelerationY
		pickupVelocityX = velocityX
		pickupVelocityY = velocityY
	}

	createPlatforms() {
		const platforms = this.physics.add.staticGroup()

		platforms.create(400, 370, GROUND_KEY)
		platforms.create(50, 200, GROUND_KEY)
		platforms.create(750, 200, GROUND_KEY)

		return platforms
	}

	createMainPlatform() {
		const mainPlatform = this.physics.add.staticGroup()

		mainPlatform.create(400, 568, GROUNDMAIN_KEY).setScale(1).refreshBody()

		return mainPlatform
	}

	createSky(x, y) {
		const sky = this.add.image(x, y, SKY_KEY)
	}

	createPlayer() {
		const player = this.physics.add.sprite(400, 450, DUDE_KEY)
		player.setBounce(0.2)
		player.setCollideWorldBounds(true)

		this.anims.create({
			key: 'left',
			frames: this.anims.generateFrameNumbers(DUDE_KEY, { start: 7, end: 0 }),
			frameRate: 20,
			repeat: -1
		})

		this.anims.create({
			key: 'die',
			frames: [{ key: DUDE_KEY, frame: 8 }],
			frameRate: 40
		})

		this.anims.create({
			key: 'right',
			frames: this.anims.generateFrameNumbers(DUDE_KEY, { start: 9, end: 16 }),
			frameRate: 20,
			repeat: -1
		})

		return player
	}

	createStars() {
		const stars = this.physics.add.group({
			key: STAR_KEY,
			repeat: 11,
			setXY: { x: 12, y: 0, stepX: 70 }
		})

		stars.children.iterate((child) => {
			child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8))
		})

		return stars
	}

	createScoreLabel(x, y, score) {
		const style = { fontSize: '32px', fill: '#FFF' }
		const label = new ScoreLabel(this, x, y, score, style)

		this.add.existing(label)

		return label
	}

	createSeeker() {
		const seeker = this.physics.add.sprite(400, 300, SEEKER_KEY).setScale(1)
		seeker.setCollideWorldBounds(true)

		this.anims.create({
			key: 'seeleft',
			frames: this.anims.generateFrameNumbers(DUDE_KEY, { start: 0, end: 1 }),
			frameRate: 20,
			repeat: -1
		})
		this.anims.create({
			key: 'seeleftup',
			frames: this.anims.generateFrameNumbers(DUDE_KEY, { start: 2, end: 3 }),
			frameRate: 20,
			repeat: -1
		})
		this.anims.create({
			key: 'seeup',
			frames: this.anims.generateFrameNumbers(DUDE_KEY, { start: 4, end: 5 }),
			frameRate: 20,
			repeat: -1
		})
		this.anims.create({
			key: 'seerightup',
			frames: this.anims.generateFrameNumbers(DUDE_KEY, { start: 6, end: 7 }),
			frameRate: 20,
			repeat: -1
		})
		this.anims.create({
			key: 'seeright',
			frames: this.anims.generateFrameNumbers(DUDE_KEY, { start: 8, end: 9 }),
			frameRate: 20,
			repeat: -1
		})
		this.anims.create({
			key: 'seerigthdown',
			frames: this.anims.generateFrameNumbers(DUDE_KEY, { start: 10, end: 11 }),
			frameRate: 20,
			repeat: -1
		})
		this.anims.create({
			key: 'seedown',
			frames: this.anims.generateFrameNumbers(DUDE_KEY, { start: 12, end: 13 }),
			frameRate: 20,
			repeat: -1
		})
		this.anims.create({
			key: 'seeleftdown',
			frames: this.anims.generateFrameNumbers(DUDE_KEY, { start: 14, end: 15 }),
			frameRate: 20,
			repeat: -1
		})
		this.anims.create({
			key: 'spawn',
			frames: this.anims.generateFrameNumbers(DUDE_KEY, { start: 0, end: 15 }),
			frameRate: 20,
			repeat: -1
		})

		return seeker
	}

	// Updaterar spelskärmen
	update() {
		let pointer = this.input.activePointer;
		timer += 1

		//Kolla om du fallit av banan
		if (this.player.y > 600) {

			this.physics.pause()

			this.player.setTint(0xff0000)

			this.player.anims.play('die')

			this.gameOver = true
		}

		//Kollar om du fått en game over
		if (this.gameOver) {
			//Kollar om du int hört GameOver ljudet
			if (alive == 1) {
				//Spelar upp GameOver ljudet och visar GameOver meddelandet
				this.sound.removeByKey('music');
				this.sound.playAudioSprite('sfx', 'death')
				textGameOver = this.add.text(this.player.x - 145, 150, 'You got the ' + this.scoreLabel.text + '\n \n \n  Press R to Reset', { fontSize: '25px' });
			}
			//Förhindrar ljudet från att spela flera gånger
			alive = 0

			if (this.cursors.reset.isDown) {
				velocityX = 0
				velocityY = 0
				accelerationX = 0
				accelerationY = 0
				seekerVelocityX = 0
				seekerVelocityY = 0
				alive = 1
				timer = 0

				this.scene.restart();
				this.gameOver = false
			}

			return
		}

		//Får dig att wrapa runt banan om du går för långt höger
		if (this.player.x > 1600) {
			this.player.x = -800
		}

		//Får dig att wrapa runt banan om du går för långt vänster
		if (this.player.x < -800) {
			this.player.x = 1600
		}

		//Kollar om du vänsterklickar, är i luften och har en dash att använda
		if (dash == 1 && pointer.isDown && this.player.body.touching.down == false) {

			//Spelar upp Dash ljudet
			this.sound.playAudioSprite('sfx', 'shot');

			//Dasha mot muspekarens nuvarande position sett till bollens
			velocityX = 2 * (pointer.worldX - this.player.x)
			velocityY = 2 * (pointer.worldY - this.player.y)

			//Flyttar dig vågrätt och lodrätt
			this.player.setVelocityX(velocityX)
			this.player.setVelocityY(velocityY)

			//Stoppar dig från att dasha flera gånger i luften
			dash = 0
		}

		//Kollar om du håller ner vänster
		if (this.cursors.left.isDown) {
			//Accelererar dig
			accelerationX = -15
			if (velocityX > -300) { velocityX += accelerationX };

			this.player.setVelocityX(velocityX)
			this.player.anims.play('left', true)
		}
		//Kollar om du håller ner höger
		else if (this.cursors.right.isDown) {
			//Accelererar dig
			accelerationX = 15
			if (velocityX < 300) { velocityX += accelerationX };

			//Flyttar dig vågrätt
			this.player.setVelocityX(velocityX)
			this.player.anims.play('right', true)
		}
		// Kollar om varken höger eller vänster är nedtryckt
		else {
			//Flyttar dig vågrätt
			this.player.setVelocityX(velocityX)
			this.player.anims.pause()
		}

		//Kollar om du stöter in i något
		if (this.player.body.touching.left || this.player.body.touching.right) {
			accelerationX = pickupAccelerationX
			velocityX = pickupVelocityX

			//Fixar siffror för kollistionscheck
			pickupAccelerationX = 0
			pickupVelocityX = 0
		}


		//Kollar om du står på marken
		if (this.player.body.touching.down) {

			//Låter dig dasha igen om musen har lyfts sedan du vart i luften
			if (pointer.isDown == false) {
				dash = 1
			}

			//Stoppar dig från att falla
			accelerationY = pickupAccelerationY
			velocityY = pickupVelocityY

			//Fixar siffror för kollistionscheck
			pickupAccelerationY = 0
			pickupVelocityY = 0

			//Flyttar dig lodrätt
			velocityY += accelerationY
			this.player.setVelocityY(velocityY)

			//Bromsar ner dig om du inte rör på dig
			if (this.cursors.left.isUp && this.cursors.right.isUp) {
				if (velocityX < 0) { accelerationX = 7 }
				if (velocityX > 0) { accelerationX = -7 }

				//Accelererar dig
				velocityX += accelerationX
				this.player.setVelocityX(velocityX)

				//Stannar dig om du rör dig långsamt
				if (velocityX < 3 && velocityX > -3) {
					accelerationX = 0
					velocityX = 0
				}
			}
		}

		//Hoppar om du står på marken och om du försöker hoppa
		if (this.cursors.up.isDown && this.player.body.touching.down || this.cursors.jump.isDown && this.player.body.touching.down) {
			//Accelererar dig uppåt
			accelerationY = -440
			velocityY = accelerationY

			//Flyttar dig lodrätt
			this.player.setVelocityY(velocityY)
		}

		//Kollar om du är i luften
		if (this.player.body.touching.down == false) {
			accelerationY = gravity

			//Kollar om du håller nere hopp och då hopapr högre
			if (this.cursors.up.isDown && velocityY < 0 || this.cursors.jump.isDown && velocityY < 0) {
				accelerationY = gravity - 12
			}
			//Kollar om du slår i taket och saktar ner dig 
			if (this.player.body.touching.up) {
				accelerationY = pickupAccelerationY;
				velocityY = pickupVelocityY;

				pickupAccelerationY = 0
				pickupVelocityY = 0
			}

			//Flyttar dig lodrätt
			velocityY += accelerationY
			this.player.setVelocityY(velocityY)

			//Bromsar in dig om du är i luften
			if (velocityX < 0) { accelerationX = 0.5 }
			if (velocityX > 0) { accelerationX = -0.5 }
			if (velocityX < 5 || velocityX > -5) { accelerationX = 0 }

			//Flyttar dig vågrätt
			velocityX += accelerationX
			this.player.setVelocityX(velocityX)
		}

		//Visar musens possition
		text1.setText([
			'x: ' + pointer.worldX,
			'y: ' + pointer.worldY,
			'isDown: ' + pointer.isDown
		]);

		//Visar bollens possition
		text1ball.setText([
			'x: ' + this.player.x,
			'y: ' + this.player.y,
		]);


		if (timer > 10*60) {

			if (seekerVelocityX < 0 && this.seeker.x < this.player.x) {
				seekerAccelerationX = 8
			}
			else if (this.seeker.x < this.player.x) {
				seekerAccelerationX = 5
			}


			if (seekerVelocityX > 0 && this.seeker.x > this.player.x) {
				seekerAccelerationX = -8
			}
			else if (this.seeker.x > this.player.x) {
				seekerAccelerationX = -5
			}

			if (seekerVelocityY < 0 && this.seeker.y < this.player.y) {
				seekerAccelerationY = 8
			}
			else if (this.seeker.y < this.player.y) {
				seekerAccelerationY = 5
			}

			if (seekerVelocityY > 0 && this.seeker.y > this.player.y) {
				seekerAccelerationY = -8
			}
			else if (this.seeker.y > this.player.y) {
				seekerAccelerationY = -5
			}

			seekerVelocityX += seekerAccelerationX
			seekerVelocityY += seekerAccelerationY

			if (this.seeker.body.touching.left || this.seeker.body.touching.right) {
				seekerVelocityX = -0.8 * seekerVelocityX
			}

			if (this.seeker.body.touching.down || this.seeker.body.touching.up) {
				seekerVelocityY = -0.8 * seekerVelocityY
			}

			this.seeker.setVelocityX(seekerVelocityX)
			this.seeker.setVelocityY(seekerVelocityY)

		}
	}



	//Avgör vad som sker när man träffar en bomb
	hitBomb(player, bomb) {
		this.physics.pause()

		player.setTint(0xff0000)

		player.anims.play('die')

		this.gameOver = true
	}

	//Avgör vad som sker när man träffar en seeker
	hitSeeker(player, seeker) {
		this.physics.pause()

		player.setTint(0xff0000)

		player.anims.play('die')

		this.gameOver = true
	}
}