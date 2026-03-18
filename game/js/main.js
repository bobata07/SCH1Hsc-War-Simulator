

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
        this.gameSpeed = 1;
        this.enemyResources = 1;
        this.enemyDefeated = false;
        this.settingsOpen = false;
        this.settingsOpenedWhilePlaying = false;
        this.mobileControlsOpen = false;

        // Entities
        this.enemies = [];
        this.towers = [];
        this.spawnTowers = [];
        this.tankSpawnTowers = [];
        this.barbedWires = [];
        this.trenches = [];
        this.soldiers = [];
        this.tanks = [];
        this.bulldozers = [];
        this.snipers = [];
        this.artilleryUnits = [];
        this.drones = [];
        this.rocketStations = [];
        this.nuclearLaunchers = [];
        this.enemyArtilleryUnits = [];
        this.enemySnipers = [];
        this.radiationZones = [];
        this.supplyCrates = [];
        this.selectedUnitType = 'tower';
        this.awaitingNukeTarget = false;
        this.maxFriendlySoldiers = 120;
        this.maxEnemySoldiers = 140;
        this.maxEnemyArtillery = 30;
        this.maxEnemySnipers = 24;

        // Wave Logic
        this.spawnTimer = 0;
        this.enemyArtilleryTimer = 0;
        this.enemySniperTimer = 0;
        this.supplyCrateTimer = 0;
        this.elapsedTime = 0;
        this.spawnIntensityLevel = 1;
        this.enemyStrengthMultiplier = 1;

        // Input Handling
        this.input = new InputHandler();

        // Audio
        this.buildSound = new Audio('assets/sounds/tower_place_construction.wav');

        // Input Logic for Unit Placement
        const handleInput = (x, y) => {
            if (!this.isPlaying || this.isPaused) return;
            if (this.awaitingNukeTarget) {
                this.launchNukeAt(x, y);
                return;
            }

            if (this.collectSupplyCrateAt(x, y)) {
                return;
            }

            if (this.removeOwnedObjectAt(x, y)) {
                return;
            }

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
            } else if (this.selectedUnitType === 'tank-spawn-tower') {
                if (this.gold >= 220) {
                    this.tankSpawnTowers.push(new TankSpawnTower(x, y));
                    this.gold -= 220;
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
            } else if (this.selectedUnitType === 'trench') {
                if (this.gold >= 60) {
                    this.trenches.push(new Trench(x, y));
                    this.gold -= 60;
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
            } else if (this.selectedUnitType === 'bulldozer') {
                if (this.gold >= 95) {
                    this.bulldozers.push(new Bulldozer(x, y));
                    this.gold -= 95;
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
            } else if (this.selectedUnitType === 'drone') {
                if (this.gold >= 110) {
                    this.drones.push(new Drone(x, y));
                    this.gold -= 110;
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
            } else if (this.selectedUnitType === 'nuclear-launcher') {
                if (this.gold >= 400) {
                    this.nuclearLaunchers.push(new NuclearLauncher(x, y));
                    this.gold -= 400;
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
            if (e.key === 'Escape' && this.settingsOpen) {
                this.closeSettings();
            } else if (e.key === 'Escape' && this.isPlaying) {
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
        this.enemyResources = 1;
        this.enemyStrengthMultiplier = 1;
        this.enemyDefeated = false;
        this.enemyArtilleryTimer = 0;
        this.enemySniperTimer = 0;
        this.supplyCrateTimer = 0;
        this.supplyCrates = [];
        this.updateHUD();
        requestAnimationFrame(this.loop);
    }

    loop(currentTime) {
        if (!this.isPlaying) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (!this.isPaused) {
            this.update(deltaTime * this.gameSpeed);
        }
        this.draw();

        requestAnimationFrame(this.loop);
    }

    update(deltaTime) {
        this.elapsedTime += deltaTime;
        this.spawnIntensityLevel = Math.floor(this.elapsedTime / 10000) + 1;
        this.enemyResources = Math.max(0, 1 - (this.elapsedTime / 120000));
        this.enemyStrengthMultiplier = Math.max(0.35, this.enemyResources);

        // Continuous enemy soldier spawning
        this.spawnTimer += deltaTime;
        if (this.enemyResources > 0 && this.spawnTimer > 1000 && this.enemies.length < this.maxEnemySoldiers) {
            const availableSlots = this.maxEnemySoldiers - this.enemies.length;
            const scaledSpawnCount = Math.max(1, Math.ceil(this.spawnIntensityLevel * this.enemyStrengthMultiplier));
            const spawnCount = Math.min(scaledSpawnCount, availableSlots);

            for (let i = 0; i < spawnCount; i++) {
                this.enemies.push(new Enemy(this.canvas.width, this.canvas.height));
            }
            this.spawnTimer = 0;
        }

        // Enemy artillery now spawns every second
        this.enemyArtilleryTimer += deltaTime;
        const artilleryInterval = 1000 + ((1 - this.enemyStrengthMultiplier) * 4000);
        if (this.enemyResources > 0 && this.enemyArtilleryTimer >= artilleryInterval && this.enemyArtilleryUnits.length < this.maxEnemyArtillery) {
            this.enemyArtilleryUnits.push(new EnemyArtillery(this.canvas.width, this.canvas.height));
            this.enemyArtilleryTimer = 0;
        }

        this.enemySniperTimer += deltaTime;
        const sniperInterval = Math.max(9000, (18000 - ((this.spawnIntensityLevel - 1) * 900)) + ((1 - this.enemyStrengthMultiplier) * 6000));
        if (this.enemyResources > 0 && this.enemySniperTimer >= sniperInterval && this.enemySnipers.length < this.maxEnemySnipers) {
            this.enemySnipers.push(new EnemySniper(this.canvas.width, this.canvas.height));
            this.enemySniperTimer = 0;
        }

        this.supplyCrateTimer += deltaTime;
        if (this.supplyCrateTimer >= 20000 && this.supplyCrates.length < 2) {
            this.supplyCrates.push(new SupplyCrate(this.canvas.width, this.canvas.height));
            this.supplyCrateTimer = 0;
        }

        const nextWave = Math.floor(this.elapsedTime / 15000) + 1;
        if (nextWave !== this.wave) {
            this.wave = nextWave;
            this.updateHUD();
        }

        const hostileUnits = [...this.enemies, ...this.enemyArtilleryUnits, ...this.enemySnipers];
        const playerCombatUnits = [...this.soldiers, ...this.tanks, ...this.bulldozers, ...this.snipers, ...this.artilleryUnits, ...this.drones, ...this.rocketStations];

        this.radiationZones.forEach(zone => {
            zone.duration -= deltaTime;
            this.enemies.forEach(enemy => {
                const dist = Math.hypot(enemy.x - zone.x, enemy.y - zone.y);
                if (dist <= zone.radius) {
                    enemy.takeDamage(zone.damagePerSecond * (deltaTime / 1000));
                }
            });
        });
        this.radiationZones = this.radiationZones.filter(zone => zone.duration > 0);
        this.supplyCrates.forEach(crate => crate.update(deltaTime));
        this.supplyCrates = this.supplyCrates.filter(crate => !crate.markedForDeletion);

        this.barbedWires.forEach(wire => {
            this.enemies.forEach(enemy => wire.damageEnemy(enemy, deltaTime));
        });
        this.trenches.forEach(trench => {
            this.enemies.forEach(enemy => trench.applyEffect(enemy, deltaTime));
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

        if (!this.enemyDefeated && this.enemyResources <= 0 && this.enemies.length === 0 && this.enemyArtilleryUnits.length === 0 && this.enemySnipers.length === 0) {
            this.victory();
            return;
        }

        // Update Towers
        this.towers.forEach(t => t.update(hostileUnits));
        this.spawnTowers.forEach(t => t.update(deltaTime, this.soldiers, this.maxFriendlySoldiers));
        this.tankSpawnTowers.forEach(t => t.update(deltaTime, this.tanks));

        // Update Soldiers
        const friendlyMovers = [...this.soldiers, ...this.tanks];

        this.soldiers.forEach(s => s.update(hostileUnits, friendlyMovers, this.canvas.width, this.canvas.height));
        this.soldiers = this.soldiers.filter(s => !s.markedForDeletion);

        // Update Tanks
        this.tanks.forEach(t => t.update(hostileUnits, friendlyMovers, this.canvas.width, this.canvas.height));
        this.tanks = this.tanks.filter(t => !t.markedForDeletion);

        // Update Bulldozers
        this.bulldozers.forEach(b => b.update(this.radiationZones, this.canvas.width, this.canvas.height));
        this.bulldozers = this.bulldozers.filter(b => !b.markedForDeletion);

        // Update Snipers
        this.snipers.forEach(s => s.update(hostileUnits));
        this.snipers = this.snipers.filter(s => !s.markedForDeletion);

        // Update Artillery
        this.artilleryUnits.forEach(a => a.update(hostileUnits));
        this.artilleryUnits = this.artilleryUnits.filter(a => !a.markedForDeletion);

        // Update Drones
        this.drones.forEach(d => d.update(hostileUnits, this.canvas.width, this.canvas.height));
        this.drones = this.drones.filter(d => !d.markedForDeletion);

        // Update Rocket Stations
        this.rocketStations.forEach(r => r.update(this.enemyArtilleryUnits));
        this.rocketStations = this.rocketStations.filter(r => !r.markedForDeletion);

        // Update Nuclear Launchers
        this.nuclearLaunchers.forEach(launcher => launcher.update((x, y) => this.detonateNuke(x, y)));
        this.nuclearLaunchers = this.nuclearLaunchers.filter(launcher => !launcher.markedForDeletion);
    }

    draw() {
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.enemies.forEach(e => e.draw(this.ctx));
        this.enemyArtilleryUnits.forEach(e => e.draw(this.ctx));
        this.enemySnipers.forEach(e => e.draw(this.ctx));
        this.radiationZones.forEach(zone => this.drawRadiationZone(zone));
        this.supplyCrates.forEach(crate => crate.draw(this.ctx));
        this.towers.forEach(t => t.draw(this.ctx));
        this.spawnTowers.forEach(t => t.draw(this.ctx));
        this.tankSpawnTowers.forEach(t => t.draw(this.ctx));
        this.barbedWires.forEach(w => w.draw(this.ctx));
        this.trenches.forEach(t => t.draw(this.ctx));
        this.soldiers.forEach(s => s.draw(this.ctx));
        this.tanks.forEach(t => t.draw(this.ctx));
        this.bulldozers.forEach(b => b.draw(this.ctx));
        this.snipers.forEach(s => s.draw(this.ctx));
        this.artilleryUnits.forEach(a => a.draw(this.ctx));
        this.drones.forEach(d => d.draw(this.ctx));
        this.rocketStations.forEach(r => r.draw(this.ctx));
        this.nuclearLaunchers.forEach(n => n.draw(this.ctx));
    }

    updateHUD() {
        document.getElementById('health-display').innerText = this.lives;
        document.getElementById('gold-display').innerText = this.gold;
        document.getElementById('wave-display').innerText = this.wave;
        document.getElementById('score-display').innerText = this.score;
    }

    drawRadiationZone(zone) {
        const pulse = 0.82 + (Math.sin(performance.now() / 140) * 0.08);

        this.ctx.fillStyle = 'rgba(78, 255, 83, 0.18)';
        this.ctx.beginPath();
        this.ctx.arc(zone.x, zone.y, zone.radius * pulse, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = 'rgba(116, 255, 97, 0.9)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(zone.x, zone.y, zone.radius * pulse, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.fillStyle = 'rgba(174, 255, 132, 0.95)';
        this.ctx.font = 'bold 22px Segoe UI';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('RAD', zone.x, zone.y + 8);
    }

    gameOver() {
        this.isPlaying = false;
        this.isPaused = false;
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score').innerText = this.score;
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('hud-actions').classList.add('hidden');
        document.getElementById('mobile-controls-toggle').classList.add('hidden');
        document.getElementById('controls').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('settings-screen').classList.add('hidden');
    }

    victory() {
        this.isPlaying = false;
        this.isPaused = false;
        this.enemyDefeated = true;
        document.getElementById('victory-screen').classList.remove('hidden');
        document.getElementById('victory-score').innerText = this.score;
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('hud-actions').classList.add('hidden');
        document.getElementById('mobile-controls-toggle').classList.add('hidden');
        document.getElementById('controls').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('settings-screen').classList.add('hidden');
    }

    setUnitType(type) {
        this.selectedUnitType = type;
        document.querySelectorAll('.unit-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById(`btn-${type}`).classList.add('selected');
    }

    togglePause() {
        if (this.settingsOpen || !this.isPlaying) return;
        this.isPaused = !this.isPaused;
        document.getElementById('pause-screen').classList.toggle('hidden', !this.isPaused);
    }

    isMobileLayout() {
        return window.innerWidth <= 900;
    }

    updateMobileControlsUI() {
        const controls = document.getElementById('controls');
        const mobileToggle = document.getElementById('mobile-controls-toggle');

        if (!this.isPlaying || !this.isMobileLayout()) {
            controls.classList.remove('mobile-collapsed');
            mobileToggle.classList.add('hidden');
            return;
        }

        mobileToggle.classList.remove('hidden');
        controls.classList.toggle('mobile-collapsed', !this.mobileControlsOpen);
        mobileToggle.textContent = this.mobileControlsOpen ? 'Hide Build' : 'Deploy';
    }

    toggleMobileControls(forceOpen = null) {
        if (!this.isMobileLayout() || !this.isPlaying) return;

        this.mobileControlsOpen = forceOpen === null ? !this.mobileControlsOpen : forceOpen;
        this.updateMobileControlsUI();
    }

    openSettings(fromStartScreen = false) {
        this.settingsOpen = true;
        this.settingsOpenedWhilePlaying = this.isPlaying && !fromStartScreen;

        if (this.settingsOpenedWhilePlaying) {
            this.isPaused = true;
            document.getElementById('pause-screen').classList.add('hidden');
        } else {
            document.getElementById('start-screen').classList.add('hidden');
        }

        document.getElementById('mobile-controls-toggle').classList.add('hidden');
        document.getElementById('settings-screen').classList.remove('hidden');
    }

    closeSettings() {
        if (!this.settingsOpen) return;

        this.settingsOpen = false;
        document.getElementById('settings-screen').classList.add('hidden');

        if (this.settingsOpenedWhilePlaying) {
            document.getElementById('pause-screen').classList.remove('hidden');
        } else if (!this.isPlaying) {
            document.getElementById('start-screen').classList.remove('hidden');
        }

        this.settingsOpenedWhilePlaying = false;
        this.updateMobileControlsUI();
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

    armNukeLaunch() {
        if (!this.nuclearLaunchers.length || this.isPaused || !this.isPlaying) return;
        this.awaitingNukeTarget = true;
        document.getElementById('btn-launch-nuke').textContent = 'Click Ground';
    }

    launchNukeAt(x, y) {
        this.awaitingNukeTarget = false;
        document.getElementById('btn-launch-nuke').textContent = 'Launch Nuke';

        if (!this.nuclearLaunchers.length) return;

        let closest = null;
        let minDist = Infinity;
        for (const launcher of this.nuclearLaunchers) {
            const dist = Math.hypot(launcher.x - x, launcher.y - y);
            if (dist < minDist) {
                minDist = dist;
                closest = launcher;
            }
        }

        if (closest) {
            closest.launchAt(x, y);
        }
    }

    detonateNuke(x, y) {
        this.enemies.forEach(enemy => {
            enemy.markedForDeletion = true;
            enemy.health = 0;
        });
        this.enemyArtilleryUnits.forEach(unit => {
            unit.markedForDeletion = true;
            unit.health = 0;
        });
        this.enemySnipers.forEach(unit => {
            unit.markedForDeletion = true;
            unit.health = 0;
        });

        this.radiationZones.push({
            x,
            y,
            radius: 95,
            duration: 10000,
            damagePerSecond: 38
        });
    }

    removeOwnedObjectAt(x, y) {
        const removableCollections = [
            { list: this.rocketStations, hit: obj => this.isRectHit(x, y, obj.x, obj.y, 36, 36) },
            { list: this.nuclearLaunchers, hit: obj => this.isRectHit(x, y, obj.x, obj.y, 40, 40) },
            { list: this.artilleryUnits, hit: obj => this.isRectHit(x, y, obj.x, obj.y, 32, 24) },
            { list: this.drones, hit: obj => this.isCircleHit(x, y, obj.x, obj.y, obj.radius) },
            { list: this.snipers, hit: obj => this.isCircleHit(x, y, obj.x, obj.y, 12) },
            { list: this.bulldozers, hit: obj => this.isRectHit(x, y, obj.x, obj.y, 44, 28) },
            { list: this.tanks, hit: obj => this.isRectHit(x, y, obj.x, obj.y, 40, 24) },
            { list: this.soldiers, hit: obj => this.isCircleHit(x, y, obj.x, obj.y, obj.radius) },
            { list: this.barbedWires, hit: obj => this.isCircleHit(x, y, obj.x, obj.y, obj.radius) },
            { list: this.trenches, hit: obj => this.isRectHit(x, y, obj.x, obj.y, obj.width, obj.height) },
            { list: this.tankSpawnTowers, hit: obj => this.isRectHit(x, y, obj.x, obj.y, 40, 40) },
            { list: this.spawnTowers, hit: obj => this.isRectHit(x, y, obj.x, obj.y, 36, 36) },
            { list: this.towers, hit: obj => this.isRectHit(x, y, obj.x, obj.y, 30, 30) }
        ];

        for (const collection of removableCollections) {
            for (let i = collection.list.length - 1; i >= 0; i--) {
                if (collection.hit(collection.list[i])) {
                    collection.list.splice(i, 1);
                    return true;
                }
            }
        }

        return false;
    }

    collectSupplyCrateAt(x, y) {
        for (let i = this.supplyCrates.length - 1; i >= 0; i--) {
            const crate = this.supplyCrates[i];
            if (crate.containsPoint(x, y)) {
                this.gold += crate.goldValue;
                this.score += 5;
                crate.markedForDeletion = true;
                this.updateHUD();
                this.buildSound.cloneNode().play().catch(e => console.log("Audio play failed:", e));
                return true;
            }
        }

        return false;
    }

    isCircleHit(clickX, clickY, x, y, radius) {
        return Math.hypot(clickX - x, clickY - y) <= radius;
    }

    isRectHit(clickX, clickY, x, y, width, height) {
        return (
            clickX >= x - width / 2 &&
            clickX <= x + width / 2 &&
            clickY >= y - height / 2 &&
            clickY <= y + height / 2
        );
    }
}


// Initialize game on load
window.addEventListener('load', () => {
    const game = new Game();

    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const menuBtn = document.getElementById('menu-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const victoryRestartBtn = document.getElementById('victory-restart-btn');
    const victoryMenuBtn = document.getElementById('victory-menu-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const pauseMenuBtn = document.getElementById('pause-menu-btn');
    const pauseSettingsBtn = document.getElementById('pause-settings-btn');
    const startSettingsBtn = document.getElementById('start-settings-btn');
    const settingsBackBtn = document.getElementById('settings-back-btn');
    const gameSpeedSelect = document.getElementById('game-speed-select');
    const artillerySoundSelect = document.getElementById('artillery-sound-select');
    const mobileControlsToggle = document.getElementById('mobile-controls-toggle');

    Artillery.setFireSound(artillerySoundSelect.value);
    EnemyArtillery.setFireSound(artillerySoundSelect.value);

    startBtn.addEventListener('click', () => {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('hud-actions').classList.remove('hidden');
        document.getElementById('controls').classList.remove('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('victory-screen').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('settings-screen').classList.add('hidden');
        game.mobileControlsOpen = !game.isMobileLayout();
        game.updateMobileControlsUI();
        game.start();
    });

    restartBtn.addEventListener('click', () => {
        location.reload();
    });

    menuBtn.addEventListener('click', () => {
        location.reload();
    });

    victoryRestartBtn.addEventListener('click', () => {
        location.reload();
    });

    victoryMenuBtn.addEventListener('click', () => {
        location.reload();
    });

    resumeBtn.addEventListener('click', () => {
        game.togglePause();
    });

    pauseBtn.addEventListener('click', () => {
        game.togglePause();
    });

    settingsBtn.addEventListener('click', () => {
        game.openSettings();
    });

    pauseMenuBtn.addEventListener('click', () => {
        location.reload();
    });

    pauseSettingsBtn.addEventListener('click', () => {
        game.openSettings();
    });

    startSettingsBtn.addEventListener('click', () => {
        game.openSettings(true);
    });

    settingsBackBtn.addEventListener('click', () => {
        game.closeSettings();
    });

    mobileControlsToggle.addEventListener('click', () => {
        game.toggleMobileControls();
    });

    gameSpeedSelect.addEventListener('change', (e) => {
        game.gameSpeed = Number(e.target.value);
    });

    artillerySoundSelect.addEventListener('change', (e) => {
        Artillery.setFireSound(e.target.value);
        EnemyArtillery.setFireSound(e.target.value);
    });

    const setUnitType = (type) => {
        game.setUnitType(type);
        if (game.isMobileLayout()) {
            game.toggleMobileControls(false);
        }
    };

    document.getElementById('btn-tower').addEventListener('click', () => setUnitType('tower'));
    document.getElementById('btn-spawn-tower').addEventListener('click', () => setUnitType('spawn-tower'));
    document.getElementById('btn-tank-spawn-tower').addEventListener('click', () => setUnitType('tank-spawn-tower'));
    document.getElementById('btn-barbed-wire').addEventListener('click', () => setUnitType('barbed-wire'));
    document.getElementById('btn-trench').addEventListener('click', () => setUnitType('trench'));
    document.getElementById('btn-soldier').addEventListener('click', () => setUnitType('soldier'));
    document.getElementById('btn-tank').addEventListener('click', () => setUnitType('tank'));
    document.getElementById('btn-bulldozer').addEventListener('click', () => setUnitType('bulldozer'));
    document.getElementById('btn-sniper').addEventListener('click', () => setUnitType('sniper'));
    document.getElementById('btn-artillery').addEventListener('click', () => setUnitType('artillery'));
    document.getElementById('btn-drone').addEventListener('click', () => setUnitType('drone'));
    document.getElementById('btn-rocket-station').addEventListener('click', () => setUnitType('rocket-station'));
    document.getElementById('btn-launch-rockets').addEventListener('click', () => game.launchRockets());
    document.getElementById('btn-nuclear-launcher').addEventListener('click', () => setUnitType('nuclear-launcher'));
    document.getElementById('btn-launch-nuke').addEventListener('click', () => game.armNukeLaunch());

    window.addEventListener('resize', () => {
        if (!game.isPlaying) return;

        if (!game.isMobileLayout()) {
            game.mobileControlsOpen = true;
        }

        game.updateMobileControlsUI();
    });
});
