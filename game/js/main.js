

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Game State
        this.lastTime = 0;
        this.isPlaying = false;
        this.score = 0;
        //this.gold = 100;
        this.gold = 1000;
        this.lives = 20;
        this.wave = 1;

        // Entities
        this.enemies = [];
        this.enemies = [];
        this.towers = [];
        this.soldiers = [];
        this.selectedUnitType = 'tower'; // 'tower' or 'soldier'
        this.path = [
            { x: 0, y: 100 },
            { x: 200, y: 100 },
            { x: 200, y: 400 },
            { x: 600, y: 400 },
            { x: 600, y: 200 },
            { x: 900, y: 200 },
            { x: 900, y: 600 },
            { x: 1200, y: 600 } // End point
        ];

        // Wave Logic
        this.spawnTimer = 0;
        this.enemiesToSpawn = 10;

        // Input Handling
        this.input = new InputHandler();

        // Audio
        this.buildSound = new Audio('assets/sounds/tower_place_construction.wav');

        // Input Logic for Unit Placement
        const handleInput = (x, y) => {
            if (!this.isPlaying) return;

            if (this.selectedUnitType === 'tower') {
                if (this.gold >= 50) {
                    this.towers.push(new Tower(x, y));
                    this.gold -= 50;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(e => console.log("Audio play failed:", e));
                }
            } else if (this.selectedUnitType === 'soldier') {
                if (this.gold >= 30) {
                    this.soldiers.push(new Soldier(x, y));
                    this.gold -= 30;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(e => console.log("Audio play failed:", e));
                }
            }
        };

        this.canvas.addEventListener('mousedown', (e) => {
            handleInput(e.clientX, e.clientY);
        });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Stop scrolling
            const touch = e.changedTouches[0];
            handleInput(touch.clientX, touch.clientY);
        }, { passive: false });

        // Resize logic

        // Resize logic
        window.addEventListener('resize', () => this.resize());
        this.resize();

        // Bind rendering
        this.loop = this.loop.bind(this);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start() {
        this.isPlaying = true;
        this.lastTime = performance.now();
        this.updateHUD();
        requestAnimationFrame(this.loop);
    }

    loop(currentTime) {
        if (!this.isPlaying) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.loop);
    }

    update(deltaTime) {
        // Spawning
        if (this.enemiesToSpawn > 0) {
            this.spawnTimer += deltaTime;
            if (this.spawnTimer > 1000) { // Spawn every second
                this.enemies.push(new Enemy(this.path));
                this.enemiesToSpawn--;
                this.spawnTimer = 0;
            }
        } else if (this.enemies.length === 0) {
            // Wave Complete
            // Wave Complete
            this.wave++;
            this.enemiesToSpawn = 10 + (this.wave * 5);
            this.updateHUD();
        }

        // Update Enemies
        this.enemies.forEach(e => e.update());

        // Check for base reach or death
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];

            // Check if reached end of path (handled in Enemy class via markedForDeletion)
            // But we need to distinguish between died and reached base.
            // For now, let's just check position
            const lastPoint = this.path[this.path.length - 1];
            const distToEnd = Math.hypot(e.x - lastPoint.x, e.y - lastPoint.y);

            if (distToEnd < 10) {
                this.lives = 0; // Instant death
                e.markedForDeletion = true;
                this.updateHUD();
                this.gameOver();
            }

            if (e.markedForDeletion) {
                this.enemies.splice(i, 1);
                // If it was dead (health <= 0), give gold
                if (e.health <= 0) {
                    this.score += 10;
                    this.gold += 10;
                    this.updateHUD();
                }
            }
        }

        // Update Towers
        this.towers.forEach(t => t.update(this.enemies));

        // Update Soldiers
        this.soldiers.forEach(s => s.update(this.enemies));
    }

    draw() {
        // Clear screen
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Path
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 40;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) {
            this.ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        this.ctx.stroke();

        // Draw Entities
        this.enemies.forEach(e => e.draw(this.ctx));
        this.towers.forEach(t => t.draw(this.ctx));
        this.soldiers.forEach(s => s.draw(this.ctx));
    }

    updateHUD() {
        document.getElementById('health-display').innerText = this.lives;
        document.getElementById('gold-display').innerText = this.gold;
        document.getElementById('wave-display').innerText = this.wave;
        document.getElementById('score-display').innerText = this.score;
    }

    gameOver() {
        // this.isPlaying = false; // Optional, let's keep it running for effect or stop. Terminate for now.
        this.isPlaying = false;
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score').innerText = this.score;
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('controls').classList.add('hidden');
    }

    setUnitType(type) {
        this.selectedUnitType = type;
        // Visual feedback could be added here or in the UI handler
        document.querySelectorAll('.unit-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById(`btn-${type}`).classList.add('selected');
    }
}


// Initialize game on load
window.addEventListener('load', () => {
    const game = new Game();

    // Simple start hook for now
    const startBtn = document.getElementById('start-btn');
    startBtn.addEventListener('click', () => {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('controls').classList.remove('hidden');
        game.start();
    });

    restartBtn.addEventListener('click', () => {
        location.reload();
    });

    const menuBtn = document.getElementById('menu-btn');
    menuBtn.addEventListener('click', () => {
        location.reload();
    });

    // Unit Selection Hooks
    document.getElementById('btn-tower').addEventListener('click', () => game.setUnitType('tower'));
    document.getElementById('btn-soldier').addEventListener('click', () => game.setUnitType('soldier'));
});
