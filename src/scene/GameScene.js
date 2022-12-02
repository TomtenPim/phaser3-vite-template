import Phaser from 'phaser'
import ScoreLabel from '../ui/ScoreLabel'
import BombSpawner from './BombSpawner'

const GROUND_KEY = 'ground'
const DUDE_KEY = 'dude'
const STAR_KEY = 'star'
const BOMB_KEY = 'bomb'

var velocityX = 0;
var accelerationX = 0;
var velocityY = 0;
var accelerationY = 0;
const gravity = 20;

export default class GameScene extends Phaser.Scene
{
	constructor()
	{
		super('game-scene')

        this.player = undefined
        this.cursors = undefined
		this.scoreLabel = undefined
		this.bomb = undefined
	}

	preload()
	{
        this.load.image('sky', 'assets/sky.png')
		this.load.image(GROUND_KEY, 'assets/platform.png')
        this.load.image(STAR_KEY, 'assets/star.png')
        this.load.image(BOMB_KEY, 'assets/bomb.png')

        this.load.spritesheet(DUDE_KEY,
			 'assets/dude.png',
			  {frameWidth: 32, frameHeight:48 }
		)
	}

	create()
	{
		this.add.image(400, 300, 'sky')
    	//this.add.image(400, 300, 'star')
        
        const platforms = this.createPlatforms()
		this.player = this.createPlayer()
		const stars = this.createStars()

		this.scoreLabel = this.createScoreLabel(16, 16, 0)

		this.bombSpawner = new BombSpawner(this, BOMB_KEY)

		this.physics.add.collider(this.player, platforms)
		this.physics.add.collider(stars, platforms)
		
		this.physics.add.overlap(this.player, stars, this.collectStar, null, this)

		this.cursors = this.input.keyboard.addKeys(
			{up:Phaser.Input.Keyboard.KeyCodes.W,
			down:Phaser.Input.Keyboard.KeyCodes.S,
			left:Phaser.Input.Keyboard.KeyCodes.A,
			right:Phaser.Input.Keyboard.KeyCodes.D,
			jump:Phaser.Input.Keyboard.KeyCodes.SPACE
		});

	}

	collectStar(player, star)
	{
		star.disableBody(true, true)

		this.scoreLabel.add(10)
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

    createPlayer()
    {
        const player = this.physics.add.sprite(100, 450, DUDE_KEY)
		player.setBounce(0.2)
		player.setCollideWorldBounds(true)

		this.anims.create({
			key: 'left',
			frames: this.anims.generateFrameNumbers(DUDE_KEY, { start: 0, end: 3 }),
			frameRate: 10,
			repeat: -1
		})
		
		this.anims.create({
			key: 'turn',
			frames: [ { key: DUDE_KEY, frame: 4 } ],
			frameRate: 20
		})
		
		this.anims.create({
			key: 'right',
			frames: this.anims.generateFrameNumbers(DUDE_KEY, { start: 5, end: 8 }),
			frameRate: 10,
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

		if (this.cursors.left.isDown)
		{
			accelerationX = -15
			if(velocityX > -200){velocityX += accelerationX};
			
			this.player.setVelocityX(velocityX)
			this.player.anims.play('left', true)
		}
		else if (this.cursors.right.isDown)
		{
			accelerationX = 15
			if(velocityX < 200){velocityX += accelerationX};

			this.player.setVelocityX(velocityX)
			this.player.anims.play('right', true)
		}
		else
		{
			this.player.setVelocityX(velocityX)
			this.player.anims.play('turn')
		}

		if(this.player.body.touching.left||this.player.body.touching.right){
			accelerationX = 0
			velocityX = 0
		}
		
		if (this.player.body.touching.down){

			accelerationY = 0
			velocityY = 0
			
			velocityY += accelerationY
			this.player.setVelocityY(velocityY)
			
			if (this.cursors.left.isUp && this.cursors.right.isUp){ 
				if (velocityX < 0){accelerationX = 7}
				if (velocityX > 0){accelerationX = -7}

				velocityX += accelerationX
				this.player.setVelocityX(velocityX)

				if (velocityX < 5 || velocityX > -5){ accelerationX = 0 }
			}
		}

		//Hoppar om du står på marken
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
				accelerationY = 0;
				velocityY = 0;
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
	}
}