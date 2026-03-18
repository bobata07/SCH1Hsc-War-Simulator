

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Game State
        this.lastTime = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.score = 0;
        this.gold = 1000;
        this.lives = 20;
        this.wave = 1;

        // Entities
        this.enemies = [];
        this.towers = [];
        this.soldiers = [];
        this.snipers = [];
        this.artilleryUnits = [];
        this.selectedUnitType = 'tower';

        // Wave Logic
        this.spawnTimer = 0;
        this.enemiesToSpawn = 10;

        // Input Handling
        this.input = new InputHandler();

        // Audio
        this.buildSound = new Audio('assets/sounds/tower_place_construction.wav');

        // Input Logic for Unit Placement
        const handleInput = (x, y) => {
            if (!this.isPlaying || this.isPaused) return;

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
            } else if (this.selectedUnitType === 'sniper') {
                if (this.gold >= 80) {
                    this.snipers.push(new Sniper(x, y));
                    this.gold -= 80;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(e => console.log("Audio play failed:", e));
                }
            } else if (this.selectedUnitType === 'artillery') {
                if (this.gold >= 120) {
                    this.artilleryUnits.push(new Artillery(x, y));
                    this.gold -= 120;
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

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPlaying) {
                this.togglePause();
            }
        });

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

        if (!this.isPaused) {
            this.update(deltaTime);
        }
        this.draw();

        requestAnimationFrame(this.loop);
    }

    update(deltaTime) {
        // Spawning
        if (this.enemiesToSpawn > 0) {
            this.spawnTimer += deltaTime;
            if (this.spawnTimer > 1000) { // Spawn every second
                this.enemies.push(new Enemy(this.canvas.width, this.canvas.height));
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
        this.enemies.forEach(e => e.update(this.soldiers, this.canvas.width, this.canvas.height));

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];

            if (e.reachedBase) {
                this.lives--;
                this.updateHUD();
                if (this.lives <= 0) {
                    this.gameOver();
                }
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
        this.soldiers = this.soldiers.filter(s => !s.markedForDeletion);

        // Update Snipers
        this.snipers.forEach(s => s.update(this.enemies));

        // Update Artillery
        this.artilleryUnits.forEach(a => a.update(this.enemies));
    }

    draw() {
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.enemies.forEach(e => e.draw(this.ctx));
        this.towers.forEach(t => t.draw(this.ctx));
        this.soldiers.forEach(s => s.draw(this.ctx));
        this.snipers.forEach(s => s.draw(this.ctx));
        this.artilleryUnits.forEach(a => a.draw(this.ctx));
    }

    updateHUD() {
        document.getElementById('health-display').innerText = this.lives;
        document.getElementById('gold-display').innerText = this.gold;
        document.getElementById('wave-display').innerText = this.wave;
        document.getElementById('score-display').innerText = this.score;
    }

    gameOver() {
        this.isPlaying = false;
        this.isPaused = false;
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score').innerText = this.score;
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('controls').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
    }

    setUnitType(type) {
        this.selectedUnitType = type;
        document.querySelectorAll('.unit-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById(`btn-${type}`).classList.add('selected');
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pause-screen').classList.toggle('hidden', !this.isPaused);
    }
}


// Initialize game on load
window.addEventListener('load', () => {
    const game = new Game();

    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const menuBtn = document.getElementById('menu-btn');
    const resumeBtn = document.getElementById('resume-btn');

    startBtn.addEventListener('click', () => {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('controls').classList.remove('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        game.start();
    });

    restartBtn.addEventListener('click', () => {
        location.reload();
    });

    menuBtn.addEventListener('click', () => {
        location.reload();
    });

    resumeBtn.addEventListener('click', () => {
        game.togglePause();
    });

    document.getElementById('btn-tower').addEventListener('click', () => game.setUnitType('tower'));
    document.getElementById('btn-soldier').addEventListener('click', () => game.setUnitType('soldier'));
    document.getElementById('btn-sniper').addEventListener('click', () => game.setUnitType('sniper'));
    document.getElementById('btn-artillery').addEventListener('click', () => game.setUnitType('artillery'));
});
