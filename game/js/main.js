

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Game State
        this.lastTime = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.score = 0;
        this.gold = 10000000;
        this.lives = 20;
        this.wave = 1;

        // Entities
        this.enemies = [];
        this.towers = [];
        this.spawnTowers = [];
        this.barbedWires = [];
        this.soldiers = [];
        this.tanks = [];
        this.snipers = [];
        this.artilleryUnits = [];
        this.rocketStations = [];
        this.enemyArtilleryUnits = [];
        this.enemySnipers = [];
        this.selectedUnitType = 'tower';
        this.maxFriendlySoldiers = 120;
        this.maxEnemySoldiers = 140;
        this.maxEnemyArtillery = 30;
        this.maxEnemySnipers = 24;

        // Wave Logic
        this.spawnTimer = 0;
        this.enemyArtilleryTimer = 0;
        this.enemySniperTimer = 0;
        this.elapsedTime = 0;
        this.spawnIntensityLevel = 1;

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
            } else if (this.selectedUnitType === 'spawn-tower') {
                if (this.gold >= 90) {
                    this.spawnTowers.push(new SpawnTower(x, y));
                    this.gold -= 90;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(e => console.log("Audio play failed:", e));
                }
            } else if (this.selectedUnitType === 'barbed-wire') {
                if (this.gold >= 40) {
                    this.barbedWires.push(new BarbedWire(x, y));
                    this.gold -= 40;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(e => console.log("Audio play failed:", e));
                }
            } else if (this.selectedUnitType === 'soldier') {
                if (this.gold >= 30 && this.soldiers.length < this.maxFriendlySoldiers) {
                    this.soldiers.push(new Soldier(x, y));
                    this.gold -= 30;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(e => console.log("Audio play failed:", e));
                }
            } else if (this.selectedUnitType === 'tank') {
                if (this.gold >= 150) {
                    this.tanks.push(new Tank(x, y));
                    this.gold -= 150;
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
            } else if (this.selectedUnitType === 'rocket-station') {
                if (this.gold >= 140) {
                    this.rocketStations.push(new RocketStation(x, y));
                    this.gold -= 140;
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
        this.elapsedTime = 0;
        this.spawnIntensityLevel = 1;
        this.enemyArtilleryTimer = 0;
        this.enemySniperTimer = 0;
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
        this.elapsedTime += deltaTime;
        this.spawnIntensityLevel = Math.floor(this.elapsedTime / 10000) + 1;

        // Continuous enemy soldier spawning
        this.spawnTimer += deltaTime;
        if (this.spawnTimer > 1000 && this.enemies.length < this.maxEnemySoldiers) {
            const availableSlots = this.maxEnemySoldiers - this.enemies.length;
            const spawnCount = Math.min(this.spawnIntensityLevel, availableSlots);

            for (let i = 0; i < spawnCount; i++) {
                this.enemies.push(new Enemy(this.canvas.width, this.canvas.height));
            }
            this.spawnTimer = 0;
        }

        // Enemy artillery now spawns every second
        this.enemyArtilleryTimer += deltaTime;
        const artilleryInterval = 1000;
        if (this.enemyArtilleryTimer >= artilleryInterval && this.enemyArtilleryUnits.length < this.maxEnemyArtillery) {
            this.enemyArtilleryUnits.push(new EnemyArtillery(this.canvas.width, this.canvas.height));
            this.enemyArtilleryTimer = 0;
        }

        this.enemySniperTimer += deltaTime;
        const sniperInterval = Math.max(7000, 18000 - ((this.spawnIntensityLevel - 1) * 900));
        if (this.enemySniperTimer >= sniperInterval && this.enemySnipers.length < this.maxEnemySnipers) {
            this.enemySnipers.push(new EnemySniper(this.canvas.width, this.canvas.height));
            this.enemySniperTimer = 0;
        }

        const nextWave = Math.floor(this.elapsedTime / 15000) + 1;
        if (nextWave !== this.wave) {
            this.wave = nextWave;
            this.updateHUD();
        }

        const hostileUnits = [...this.enemies, ...this.enemyArtilleryUnits, ...this.enemySnipers];
        const playerCombatUnits = [...this.soldiers, ...this.tanks, ...this.snipers, ...this.artilleryUnits, ...this.rocketStations];

        this.barbedWires.forEach(wire => {
            this.enemies.forEach(enemy => wire.damageEnemy(enemy, deltaTime));
        });

        // Update Enemies
        this.enemies.forEach(e => e.update(playerCombatUnits, this.canvas.width, this.canvas.height));
        this.enemyArtilleryUnits.forEach(e => e.update(playerCombatUnits));
        this.enemySnipers.forEach(e => e.update(playerCombatUnits));

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

        for (let i = this.enemyArtilleryUnits.length - 1; i >= 0; i--) {
            const e = this.enemyArtilleryUnits[i];
            if (e.markedForDeletion) {
                this.enemyArtilleryUnits.splice(i, 1);
                this.score += 20;
                this.gold += 20;
                this.updateHUD();
            }
        }

        for (let i = this.enemySnipers.length - 1; i >= 0; i--) {
            const e = this.enemySnipers[i];
            if (e.markedForDeletion) {
                this.enemySnipers.splice(i, 1);
                this.score += 15;
                this.gold += 15;
                this.updateHUD();
            }
        }

        // Update Towers
        this.towers.forEach(t => t.update(hostileUnits));
        this.spawnTowers.forEach(t => t.update(deltaTime, this.soldiers, this.maxFriendlySoldiers));

        // Update Soldiers
        this.soldiers.forEach(s => s.update(hostileUnits, this.canvas.width, this.canvas.height));
        this.soldiers = this.soldiers.filter(s => !s.markedForDeletion);

        // Update Tanks
        this.tanks.forEach(t => t.update(hostileUnits, this.canvas.width, this.canvas.height));
        this.tanks = this.tanks.filter(t => !t.markedForDeletion);

        // Update Snipers
        this.snipers.forEach(s => s.update(hostileUnits));
        this.snipers = this.snipers.filter(s => !s.markedForDeletion);

        // Update Artillery
        this.artilleryUnits.forEach(a => a.update(hostileUnits));
        this.artilleryUnits = this.artilleryUnits.filter(a => !a.markedForDeletion);

        // Update Rocket Stations
        this.rocketStations.forEach(r => r.update());
        this.rocketStations = this.rocketStations.filter(r => !r.markedForDeletion);
    }

    draw() {
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.enemies.forEach(e => e.draw(this.ctx));
        this.enemyArtilleryUnits.forEach(e => e.draw(this.ctx));
        this.enemySnipers.forEach(e => e.draw(this.ctx));
        this.towers.forEach(t => t.draw(this.ctx));
        this.spawnTowers.forEach(t => t.draw(this.ctx));
        this.barbedWires.forEach(w => w.draw(this.ctx));
        this.soldiers.forEach(s => s.draw(this.ctx));
        this.tanks.forEach(t => t.draw(this.ctx));
        this.snipers.forEach(s => s.draw(this.ctx));
        this.artilleryUnits.forEach(a => a.draw(this.ctx));
        this.rocketStations.forEach(r => r.draw(this.ctx));
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

    launchRockets() {
        if (!this.enemyArtilleryUnits.length) return;

        this.rocketStations.forEach(station => {
            let closest = null;
            let minDist = Infinity;

            for (const enemyArtillery of this.enemyArtilleryUnits) {
                const dist = Math.hypot(enemyArtillery.x - station.x, enemyArtillery.y - station.y);
                if (dist < minDist) {
                    minDist = dist;
                    closest = enemyArtillery;
                }
            }

            if (closest) {
                station.launch(closest);
            }
        });
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
    document.getElementById('btn-spawn-tower').addEventListener('click', () => game.setUnitType('spawn-tower'));
    document.getElementById('btn-barbed-wire').addEventListener('click', () => game.setUnitType('barbed-wire'));
    document.getElementById('btn-soldier').addEventListener('click', () => game.setUnitType('soldier'));
    document.getElementById('btn-tank').addEventListener('click', () => game.setUnitType('tank'));
    document.getElementById('btn-sniper').addEventListener('click', () => game.setUnitType('sniper'));
    document.getElementById('btn-artillery').addEventListener('click', () => game.setUnitType('artillery'));
    document.getElementById('btn-rocket-station').addEventListener('click', () => game.setUnitType('rocket-station'));
    document.getElementById('btn-launch-rockets').addEventListener('click', () => game.launchRockets());
});
