import Phaser, { Cameras } from 'phaser'
import ScoreLabel from '../ui/ScoreLabel'
import BombSpawner from './BombSpawner'

const GROUND_KEY = 'ground'
const DUDE_KEY = 'dude'
const STAR_KEY = 'star'
const BOMB_KEY = 'bomb'
const SKY_KEY = 'sky'

var velocityX = 0;
var accelerationX = 0;
var velocityY = 0;
var accelerationY = 0;
const gravity = 20;
var pickupVelocityX = 0;
var pickupVelocityY = 0;
var pickupAccelerationX = 0;
var pickupAccelerationY = 0;
var dash = 1;

var text1;
var text1ball;


export default class GameScene extends Phaser.Scene
{
	constructor()
	{
		super('game-scene')

        this.player = undefined
        this.cursors = undefined
		this.scoreLabel = undefined
		this.stars = undefined
		this.bombSpawner = undefined
		this.sky = undefined
		this.mouse = undefined

		this.gameOver = false
	}

	preload()
	{
        this.load.image(SKY_KEY, 'assets/sky.png')
		this.load.image(GROUND_KEY, 'assets/platform.png')
        this.load.image(STAR_KEY, 'assets/star.png')
        this.load.image(BOMB_KEY, 'assets/bomb.png')

        this.load.spritesheet(DUDE_KEY,
			 'assets/dudeball.png',
			  {frameWidth: 32, frameHeight:31 }
		)

	}

	create()
	{
		

		this.cameras.main.setBounds(-800, 0, 2400, 600);
        this.physics.world.setBounds(-800, -100, 2400, 800);

		this.add.image(400, 300, SKY_KEY)
		this.add.image(1200, 300, SKY_KEY)

		this.createSky(-400, 300)
		this.createSky(400, 300)
		this.createSky(1200, 300)

		text1 = this.add.text(10, 10, '');
		text1ball = this.add.text(500, 10, '');
        
        const platforms = this.createPlatforms()
		this.player = this.createPlayer()
		this.stars = this.createStars()

		this.scoreLabel = this.createScoreLabel(16, 16, 0)

		this.bombSpawner = new BombSpawner(this, BOMB_KEY)
		const bombsGroup = this.bombSpawner.group

		this.physics.add.collider(this.player, platforms)
		this.physics.add.collider(this.stars, platforms)
		this.physics.add.collider(bombsGroup, platforms)
		this.physics.add.collider(this.player, bombsGroup, this.hitBomb, null, this)
		
		this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this)

		this.cursors = this.input.keyboard.addKeys(
			{up:Phaser.Input.Keyboard.KeyCodes.W,
			down:Phaser.Input.Keyboard.KeyCodes.S,
			left:Phaser.Input.Keyboard.KeyCodes.A,
			right:Phaser.Input.Keyboard.KeyCodes.D,
			jump:Phaser.Input.Keyboard.KeyCodes.SPACE,
			dash:Phaser.Input.MOUSE_DOWN
		});

		this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
	}

	collectStar(player, star)
	{
		star.disableBody(true, true)

		this.scoreLabel.add(10)

		if( this.stars.countActive(true) === 0){
			this.stars.children.iterate((child) => {
				child.enableBody(true, child.x, 0, true, true)
			})
		}

		this.bombSpawner.spawn(player.x)

		pickupAccelerationX = accelerationX
		pickupAccelerationY = accelerationY
		pickupVelocityX = velocityX
		pickupVelocityY = velocityY
	}

    createPlatforms()
    {
        const platforms = this.physics.add.staticGroup()

		platforms.create(400, 568, GROUND_KEY).setScale(2).refreshBody()
	
		platforms.create(600, 400, GROUND_KEY)
		platforms.create(50, 250, GROUND_KEY)
		platforms.create(750, 220, GROUND_KEY)

        return platforms
    }

	createSky(x,y){
		const sky = this.add.image(x, y, SKY_KEY)
	}

    createPlayer()
    {
        const player = this.physics.add.sprite(100, 450, DUDE_KEY)
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
			frames: [ { key: DUDE_KEY, frame: 8 } ],
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

	createStars()
	{
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

	createScoreLabel(x, y, score)
	{
		const style = { fontSize: '32px', fill: '#000' }
		const label = new ScoreLabel(this, x, y, score, style)

		this.add.existing(label)

		return label
	}

    
    update()
	{
		var pointer = this.input.activePointer;

		if (this.gameOver){
			return
		}

		//Kollar om du fallit av banan
		if (this.player.y > 600){

			this.physics.pause()

			this.sky.setTint(0xff0000)

			this.player.anims.play('die')

			this.gameOver = true
		}

		if (dash == 1 && pointer.isDown && this.player.body.touching.down == false){
			var angle = (pointer.worldY - this.player.y) / (pointer.worldX - this.player.x)

			velocityX = 500* Math.cos(angle)
			velocityY = 500* Math.sin(angle)
						

			this.player.setVelocityX(velocityX)
			this.player.setVelocityY(velocityY)

			dash = 0
		}

		if (this.cursors.left.isDown)
		{
			accelerationX = -15
			if(velocityX > -300){velocityX += accelerationX};
			
			this.player.setVelocityX(velocityX)
			this.player.anims.play('left', true)
		}
		else if (this.cursors.right.isDown)
		{
			accelerationX = 15
			if(velocityX < 300){velocityX += accelerationX};

			this.player.setVelocityX(velocityX)
			this.player.anims.play('right', true)
		}
		else
		{
			this.player.setVelocityX(velocityX)
			this.player.anims.pause()
		}

		//Kollar om du stöter in i något
		if(this.player.body.touching.left||this.player.body.touching.right){
			accelerationX = pickupAccelerationX
			velocityX = pickupVelocityX

			pickupAccelerationX = 0
			pickupVelocityX = 0
		}
		

		//Kollar om du står på marken
		if (this.player.body.touching.down){

			dash = 1

			//Stoppar dig från att falla
			accelerationY = pickupAccelerationY
			velocityY = pickupVelocityY

			pickupAccelerationY = 0
			pickupVelocityY = 0
			
			//Flyttar dig lodrätt
			velocityY += accelerationY
			this.player.setVelocityY(velocityY)
			
			//Bromsar ner dig om du inte rör på dig
			if (this.cursors.left.isUp && this.cursors.right.isUp){ 
				if (velocityX < 0){accelerationX = 7}
				if (velocityX > 0){accelerationX = -7}

				velocityX += accelerationX
				this.player.setVelocityX(velocityX)

				if (velocityX < 5 && velocityX > -5){
					accelerationX = 0 
					velocityX = 0
				}
			}
		}

		//Hoppar om du står på marken och om du försöker hoppa
		if (this.cursors.up.isDown && this.player.body.touching.down || this.cursors.jump.isDown && this.player.body.touching.down)
		{	
			//Accelererar dig uppåt
			accelerationY = -440
			velocityY = accelerationY
			
			//Flyttar dig lodrätt
			this.player.setVelocityY(velocityY)
		}

		//Kollar om du är i luften
		if (this.player.body.touching.down == false){
			accelerationY = gravity

			//Kollar om du håller nere hopp och då hopapr högre
			if(this.cursors.up.isDown && velocityY < 0 || this.cursors.jump.isDown && velocityY < 0){
				accelerationY = gravity - 12
			}
			//Kollar om du slår i taket och saktar ner dig 
			if(this.player.body.touching.up){
				accelerationY = pickupAccelerationY;
				velocityY = pickupVelocityY;
				
				pickupAccelerationY = 0
				pickupVelocityY = 0	
			}

			//Flyttar dig lodrätt
			velocityY += accelerationY
			this.player.setVelocityY(velocityY)

			//Bromsar in dig om du är i luften
			if (velocityX < 0){accelerationX = 0.5}
			if (velocityX > 0){accelerationX = -0.5}
			if (velocityX < 5 || velocityX > -5){ accelerationX = 0 }
			
			//Flyttar dig vågrätt
			velocityX += accelerationX
			this.player.setVelocityX(velocityX)
		}


		text1.setText([
			'x: ' + pointer.worldX,
			'y: ' + pointer.worldY,
			'isDown: ' + pointer.isDown
		]);

		text1ball.setText([
			'x: ' + this.player.x,
			'y: ' + this.player.y,
		]);
	}

	hitBomb(player, bomb)
	{
		this.physics.pause()

		player.setTint(0xff0000)

		player.anims.play('die')

		this.gameOver = true
	}
}