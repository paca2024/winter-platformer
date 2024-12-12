class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 400;
        
        // Game state
        this.score = 0;
        this.gameSpeed = 3;
        this.gameOver = false;
        this.carrotsCollected = 0;
        this.backgroundX = 0;
        
        // Player properties
        this.player = {
            x: 150,  // Fixed x position
            y: 200,
            width: 40,
            height: 40,
            velocityY: 0,
            jumpForce: -12,
            doubleJumpForce: -15,
            isJumping: false,
            canDoubleJump: true,
            direction: 'right'
        };
        
        // Load alpaca sprite
        this.alpacaSprite = new Image();
        this.alpacaSprite.src = 'https://na-703498136.imgix.net/alpacanobg%20(1).png';
        
        // Load background
        this.backgroundImage = new Image();
        this.backgroundImage.src = 'https://na-703498136.imgix.net/mountains.png';
        
        // Carrots array
        this.carrots = [];
        
        // Ground properties
        this.groundY = this.canvas.height - 50; // Ground position
        this.groundBlocks = [];
        this.groundBlockWidth = 100;
        
        // Initialize ground blocks
        for (let x = 0; x < this.canvas.width + this.groundBlockWidth; x += this.groundBlockWidth) {
            this.groundBlocks.push({
                x: x,
                width: this.groundBlockWidth,
                height: 50
            });
        }
        
        // Platform properties
        this.platforms = [];
        
        // Generate initial platforms
        this.generatePlatforms();
        
        // Game state
        this.gameLoop = this.gameLoop.bind(this);
        this.setupEventListeners();
        this.startGame();
    }
    
    generatePlatforms() {
        // Ensure there are always enough platforms ahead
        while (this.platforms.length < 5) {
            const lastPlatform = this.platforms.length > 0 
                ? this.platforms[this.platforms.length - 1] 
                : { x: this.canvas.width, width: 0 };
                
            const minGap = 150;
            const maxGap = 300;
            const minHeight = 100;
            const maxHeight = 250;
            
            const newPlatform = {
                x: lastPlatform.x + lastPlatform.width + minGap + Math.random() * (maxGap - minGap),
                y: Math.random() * (maxHeight - minHeight) + minHeight,
                width: 100 + Math.random() * 100,
                height: 20
            };
            
            // Add carrots above the platform
            if (Math.random() < 0.7) { // 70% chance to spawn carrots
                const carrotCount = Math.floor(Math.random() * 3) + 1; // 1-3 carrots
                for (let i = 0; i < carrotCount; i++) {
                    this.carrots.push({
                        x: newPlatform.x + (newPlatform.width * (i + 1))/(carrotCount + 1),
                        y: newPlatform.y - 40,
                        width: 15,
                        height: 20,
                        collected: false
                    });
                }
            }
            
            this.platforms.push(newPlatform);
        }
    }
    
    setupEventListeners() {
        const jumpHandler = (e) => {
            if (this.gameOver) {
                // Restart game
                if (e.key === 'r' || e.key === 'R') {
                    this.resetGame();
                }
                return;
            }
            
            if (e.key === 'ArrowUp' || e.key === ' ') {
                if (!this.player.isJumping) {
                    this.player.velocityY = this.player.jumpForce;
                    this.player.isJumping = true;
                    this.player.canDoubleJump = true;
                } else if (this.player.canDoubleJump) {
                    this.player.velocityY = this.player.doubleJumpForce;
                    this.player.canDoubleJump = false;
                }
            }
        };
        
        document.addEventListener('keydown', jumpHandler);
    }
    
    resetGame() {
        this.score = 0;
        this.gameSpeed = 3;
        this.gameOver = false;
        this.carrotsCollected = 0;
        this.player.y = 200;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.canDoubleJump = true;
        this.platforms = [];
        this.carrots = [];
        this.generatePlatforms();
    }
    
    update() {
        if (this.gameOver) return;
        
        // Update score
        this.score += 1;
        
        // Increase game speed gradually
        if (this.score % 500 === 0) {
            this.gameSpeed += 0.5;
        }
        
        // Update background position
        this.backgroundX -= this.gameSpeed * 0.5;
        if (this.backgroundX <= -this.canvas.width) {
            this.backgroundX = 0;
        }
        
        // Update ground blocks
        this.groundBlocks.forEach(block => {
            block.x -= this.gameSpeed;
        });
        
        // Add new ground block when needed
        const lastBlock = this.groundBlocks[this.groundBlocks.length - 1];
        if (lastBlock.x + lastBlock.width < this.canvas.width) {
            this.groundBlocks.push({
                x: lastBlock.x + lastBlock.width,
                width: this.groundBlockWidth,
                height: 50
            });
        }
        
        // Remove off-screen ground blocks
        this.groundBlocks = this.groundBlocks.filter(block => block.x + block.width > -this.groundBlockWidth);
        
        // Apply gravity
        this.player.velocityY += 0.8;
        
        // Update player position
        this.player.y += this.player.velocityY;
        
        // Move platforms and carrots left
        this.platforms.forEach(platform => {
            platform.x -= this.gameSpeed;
        });
        
        this.carrots.forEach(carrot => {
            carrot.x -= this.gameSpeed;
        });
        
        // Check carrot collisions
        this.carrots.forEach(carrot => {
            if (!carrot.collected && this.checkCollision(this.player, carrot)) {
                carrot.collected = true;
                this.carrotsCollected += 1;
                this.score += 100;
            }
        });
        
        // Remove off-screen platforms and carrots
        this.platforms = this.platforms.filter(platform => platform.x + platform.width > -100);
        this.carrots = this.carrots.filter(carrot => carrot.x + carrot.width > -50 && !carrot.collected);
        
        // Generate new platforms
        this.generatePlatforms();
        
        // Check platform collisions
        let isOnPlatform = false;
        this.platforms.forEach(platform => {
            if (this.checkCollision(this.player, platform)) {
                if (this.player.velocityY > 0) {
                    this.player.isJumping = false;
                    this.player.canDoubleJump = true;
                    this.player.velocityY = 0;
                    this.player.y = platform.y - this.player.height;
                    isOnPlatform = true;
                }
            }
        });
        
        // Check ground collision
        if (this.player.y + this.player.height > this.groundY) {
            this.player.y = this.groundY - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
            this.player.canDoubleJump = true;
        }
        
        // Check game over conditions
        if (this.player.y < -50) {
            this.gameOver = true;
        }
    }
    
    checkCollision(player, platform) {
        return player.x < platform.x + platform.width &&
               player.x + player.width > platform.x &&
               player.y < platform.y + platform.height &&
               player.y + player.height > platform.y;
    }
    
    drawCarrot(x, y, width, height) {
        // Draw carrot body (orange triangle)
        this.ctx.fillStyle = '#f39c12';
        this.ctx.beginPath();
        this.ctx.moveTo(x + width/2, y);
        this.ctx.lineTo(x + width, y + height);
        this.ctx.lineTo(x, y + height);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw carrot top (green)
        this.ctx.fillStyle = '#27ae60';
        this.ctx.beginPath();
        this.ctx.ellipse(x + width/2, y, width/3, height/4, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw scrolling background
        this.ctx.drawImage(this.backgroundImage, this.backgroundX, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.backgroundImage, this.backgroundX + this.canvas.width, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground blocks with snow texture
        this.groundBlocks.forEach(block => {
            // Draw main ground block
            this.ctx.fillStyle = 'rgba(149, 165, 166, 0.8)';
            this.ctx.fillRect(block.x, this.groundY, block.width, block.height);
            
            // Draw snow on top
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.fillRect(block.x, this.groundY, block.width, 5);
        });
        
        // Draw platforms
        this.ctx.fillStyle = 'rgba(149, 165, 166, 0.8)';
        this.platforms.forEach(platform => {
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            // Add snow on top of platforms
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.fillRect(platform.x, platform.y, platform.width, 3);
        });
        
        // Draw carrots
        this.carrots.forEach(carrot => {
            if (!carrot.collected) {
                this.drawCarrot(carrot.x, carrot.y, carrot.width, carrot.height);
            }
        });
        
        // Draw player (alpaca)
        this.ctx.drawImage(this.alpacaSprite, this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw snow effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 50; i++) {
            this.ctx.beginPath();
            this.ctx.arc(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height,
                2,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
        
        // Draw score and carrots collected
        this.ctx.fillStyle = '#fff';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.font = '24px Arial';
        
        // Draw text with outline for better visibility
        const scoreText = `Score: ${Math.floor(this.score / 10)}`;
        const carrotsText = `Carrots: ${this.carrotsCollected}`;
        
        this.ctx.strokeText(scoreText, 20, 40);
        this.ctx.fillText(scoreText, 20, 40);
        this.ctx.strokeText(carrotsText, 20, 70);
        this.ctx.fillText(carrotsText, 20, 70);
        
        // Draw game over screen
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.strokeStyle = '#000';
            
            this.ctx.font = '48px Arial';
            const gameOverText = 'Game Over!';
            this.ctx.strokeText(gameOverText, this.canvas.width/2 - 100, this.canvas.height/2 - 50);
            this.ctx.fillText(gameOverText, this.canvas.width/2 - 100, this.canvas.height/2 - 50);
            
            this.ctx.font = '24px Arial';
            const finalScoreText = `Final Score: ${Math.floor(this.score / 10)}`;
            const carrotsCollectedText = `Carrots Collected: ${this.carrotsCollected}`;
            const restartText = 'Press R to Restart';
            
            this.ctx.strokeText(finalScoreText, this.canvas.width/2 - 70, this.canvas.height/2);
            this.ctx.fillText(finalScoreText, this.canvas.width/2 - 70, this.canvas.height/2);
            this.ctx.strokeText(carrotsCollectedText, this.canvas.width/2 - 90, this.canvas.height/2 + 30);
            this.ctx.fillText(carrotsCollectedText, this.canvas.width/2 - 90, this.canvas.height/2 + 30);
            this.ctx.strokeText(restartText, this.canvas.width/2 - 80, this.canvas.height/2 + 70);
            this.ctx.fillText(restartText, this.canvas.width/2 - 80, this.canvas.height/2 + 70);
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.gameLoop);
    }
    
    startGame() {
        this.gameLoop();
    }
}

// Start the game when the page loads
window.onload = () => {
    new Game();
};
