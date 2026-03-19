

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Game State
        this.lastTime = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.baseStartingGold = 1000000;
        this.baseLives = 20;
        this.score = 0;
        this.gold = this.baseStartingGold;
        this.lives = this.baseLives;
        this.wave = 1;
        this.gameSpeed = 1;
        this.enemyResources = 1;
        this.enemyDefeated = false;
        this.settingsOpen = false;
        this.settingsOpenedWhilePlaying = false;
        this.mobileControlsOpen = false;
        this.isEditingMap = false;
        this.customMapStorageKey = 'war-simulator-custom-map';
        this.customMapMode = 'land';
        this.editorTool = 'rock';
        this.customMapObjects = this.loadCustomMap();

        // Entities
        this.enemies = [];
        this.towers = [];
        this.spawnTowers = [];
        this.tankSpawnTowers = [];
        this.barbedWires = [];
        this.enemyBarbedWires = [];
        this.trenches = [];
        this.repairBases = [];
        this.airports = [];
        this.bunkers = [];
        this.soldiers = [];
        this.tanks = [];
        this.tankWrecks = [];
        this.planes = [];
        this.submarines = [];
        this.aircraftCarriers = [];
        this.bulldozers = [];
        this.snipers = [];
        this.artilleryUnits = [];
        this.drones = [];
        this.rocketStations = [];
        this.nuclearLaunchers = [];
        this.enemyArtilleryUnits = [];
        this.enemySnipers = [];
        this.enemyTanks = [];
        this.enemyPlanes = [];
        this.enemySubmarines = [];
        this.enemyAircraftCarriers = [];
        this.radiationZones = [];
        this.supplyCrates = [];
        this.selectedUnitType = 'tower';
        this.awaitingNukeTarget = false;
        this.maxFriendlySoldiers = 120;
        this.maxEnemySoldiers = 140;
        this.maxEnemyArtillery = 30;
        this.maxEnemySnipers = 24;
        this.maxEnemyTanks = 28;
        this.maxEnemyPlanes = 20;
        this.maxEnemySubmarines = 28;
        this.maxEnemyAircraftCarriers = 10;

        // Wave Logic
        this.spawnTimer = 0;
        this.enemyArtilleryTimer = 0;
        this.enemySniperTimer = 0;
        this.enemyTankTimer = 0;
        this.enemyPlaneTimer = 0;
        this.enemySubmarineTimer = 0;
        this.enemyAircraftCarrierTimer = 0;
        this.enemyBarbedWireTimer = 0;
        this.supplyCrateTimer = 0;
        this.elapsedTime = 0;
        this.spawnIntensityLevel = 1;
        this.enemyStrengthMultiplier = 1;

        // Input Handling
        this.input = new InputHandler();

        // Audio
        this.buildSound = new Audio('assets/sounds/tower_place_construction.wav');

        // Input Logic for Unit Placement
        const handleInput = (x, y, button = 0) => {
            if (this.isEditingMap) {
                if (button !== 2) {
                    this.handleMapEditorInput(x, y);
                }
                return;
            }

            if (!this.isPlaying || this.isPaused) return;
            if (this.awaitingNukeTarget) {
                this.launchNukeAt(x, y);
                return;
            }

            const isRightClick = button === 2;

            if (this.selectedUnitType === 'plane') {
                if (!isRightClick) return;

                if (this.gold >= 160) {
                    const airport = this.findAirportAt(x, y);
                    if (airport) {
                        this.planes.push(new Plane(airport));
                        this.gold -= 160;
                        this.updateHUD();
                        this.buildSound.cloneNode().play().catch(e => console.log("Audio play failed:", e));
                    }
                }
                return;
            }

            if (this.selectedUnitType === 'submarine' || this.selectedUnitType === 'aircraft-carrier') {
                if (this.customMapMode !== 'ocean') return;
            }

            if (isRightClick) return;

            if (this.collectSupplyCrateAt(x, y)) {
                return;
            }

            if (this.isCustomMapBlockedAt(x, y)) {
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
            } else if (this.selectedUnitType === 'repair-base') {
                if (this.gold >= 130) {
                    this.repairBases.push(new RepairBase(x, y));
                    this.gold -= 130;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(e => console.log("Audio play failed:", e));
                }
            } else if (this.selectedUnitType === 'airport') {
                if (this.gold >= 180) {
                    this.airports.push(new Airport(x, y));
                    this.gold -= 180;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(e => console.log("Audio play failed:", e));
                }
            } else if (this.selectedUnitType === 'bunker') {
                if (this.gold >= 170) {
                    this.bunkers.push(new Bunker(x, y));
                    this.gold -= 170;
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
            } else if (this.selectedUnitType === 'submarine') {
                if (this.gold >= 140) {
                    this.submarines.push(new Submarine(x, y));
                    this.gold -= 140;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(e => console.log("Audio play failed:", e));
                }
            } else if (this.selectedUnitType === 'aircraft-carrier') {
                if (this.gold >= 260) {
                    this.aircraftCarriers.push(new AircraftCarrier(x, y));
                    this.gold -= 260;
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
            handleInput(e.clientX, e.clientY, e.button);
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Stop scrolling
            const touch = e.changedTouches[0];
            handleInput(touch.clientX, touch.clientY, 0);
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
        if (this.isEditingMap) {
            this.drawEditor();
        }
    }

    start() {
        this.resetBattleState();
        this.isPlaying = true;
        this.lastTime = performance.now();
        this.elapsedTime = 0;
        this.spawnIntensityLevel = 1;
        this.enemyResources = 1;
        this.enemyStrengthMultiplier = 1;
        this.enemyDefeated = false;
        this.enemyArtilleryTimer = 0;
        this.enemySniperTimer = 0;
        this.enemyTankTimer = 0;
        this.enemyPlaneTimer = 0;
        this.enemySubmarineTimer = 0;
        this.enemyAircraftCarrierTimer = 0;
        this.enemyBarbedWireTimer = 0;
        this.supplyCrateTimer = 0;
        this.updateAvailableUnitsUI();
        this.updateHUD();
        requestAnimationFrame(this.loop);
    }

    resetBattleState() {
        this.score = 0;
        this.gold = this.baseStartingGold;
        this.lives = this.baseLives;
        this.wave = 1;
        this.awaitingNukeTarget = false;

        this.enemies = [];
        this.towers = [];
        this.spawnTowers = [];
        this.tankSpawnTowers = [];
        this.barbedWires = [];
        this.enemyBarbedWires = [];
        this.trenches = [];
        this.repairBases = [];
        this.airports = [];
        this.bunkers = [];
        this.soldiers = [];
        this.tanks = [];
        this.tankWrecks = [];
        this.planes = [];
        this.submarines = [];
        this.aircraftCarriers = [];
        this.bulldozers = [];
        this.snipers = [];
        this.artilleryUnits = [];
        this.drones = [];
        this.rocketStations = [];
        this.nuclearLaunchers = [];
        this.enemyArtilleryUnits = [];
        this.enemySnipers = [];
        this.enemyTanks = [];
        this.enemyPlanes = [];
        this.enemySubmarines = [];
        this.enemyAircraftCarriers = [];
        this.radiationZones = [];
        this.supplyCrates = [];
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

        if (this.customMapMode === 'ocean') {
            this.updateOceanBattle(deltaTime);
            return;
        }

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

        this.enemyTankTimer += deltaTime;
        const tankInterval = Math.max(5000, 11000 - ((this.spawnIntensityLevel - 1) * 400));
        if (this.enemyResources > 0 && this.enemyTankTimer >= tankInterval && this.enemyTanks.length < this.maxEnemyTanks) {
            this.enemyTanks.push(new EnemyTank(this.canvas.width, this.canvas.height));
            this.enemyTankTimer = 0;
        }

        this.enemyPlaneTimer += deltaTime;
        const planeInterval = Math.max(7000, 16000 - ((this.spawnIntensityLevel - 1) * 500));
        if (this.enemyResources > 0 && this.enemyPlaneTimer >= planeInterval && this.enemyPlanes.length < this.maxEnemyPlanes) {
            this.enemyPlanes.push(new EnemyPlane(this.canvas.width, this.canvas.height));
            this.enemyPlaneTimer = 0;
        }

        this.enemyBarbedWireTimer += deltaTime;
        if (this.enemyResources > 0 && this.enemyBarbedWireTimer >= 9000 && this.enemyBarbedWires.length < 18) {
            this.enemyBarbedWires.push(new BarbedWire(
                this.canvas.width * 0.58 + Math.random() * (this.canvas.width * 0.28),
                80 + Math.random() * Math.max(120, this.canvas.height - 160)
            ));
            this.enemyBarbedWireTimer = 0;
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

        const hostileUnits = [...this.enemies, ...this.enemyArtilleryUnits, ...this.enemySnipers, ...this.enemyTanks, ...this.enemyPlanes];
        const playerCombatUnits = [...this.soldiers, ...this.tanks, ...this.planes, ...this.submarines, ...this.aircraftCarriers, ...this.bulldozers, ...this.snipers, ...this.artilleryUnits, ...this.drones, ...this.rocketStations, ...this.bunkers];

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
        this.enemyBarbedWires.forEach(wire => {
            this.soldiers.forEach(unit => wire.damageEnemy(unit, deltaTime));
            this.tanks.forEach(unit => wire.damageEnemy(unit, deltaTime));
            this.bulldozers.forEach(unit => wire.damageEnemy(unit, deltaTime));
        });
        this.trenches.forEach(trench => {
            this.enemies.forEach(enemy => trench.applyEffect(enemy, deltaTime));
        });

        // Update Enemies
        this.enemies.forEach(e => e.update(playerCombatUnits, this.canvas.width, this.canvas.height));
        this.enemyArtilleryUnits.forEach(e => e.update(playerCombatUnits));
        this.enemySnipers.forEach(e => e.update(playerCombatUnits));
        this.enemyTanks.forEach(e => e.update(playerCombatUnits, this.canvas.width, this.canvas.height));
        this.enemyPlanes.forEach(e => e.update(playerCombatUnits, this.canvas.width, this.canvas.height));

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

        for (let i = this.enemyTanks.length - 1; i >= 0; i--) {
            const e = this.enemyTanks[i];
            if (e.markedForDeletion) {
                this.enemyTanks.splice(i, 1);
                this.score += 25;
                this.gold += 25;
                this.updateHUD();
            }
        }

        for (let i = this.enemyPlanes.length - 1; i >= 0; i--) {
            const e = this.enemyPlanes[i];
            if (e.markedForDeletion) {
                this.enemyPlanes.splice(i, 1);
                this.score += 22;
                this.gold += 22;
                this.updateHUD();
            }
        }

        if (!this.enemyDefeated && this.enemyResources <= 0 && this.enemies.length === 0 && this.enemyArtilleryUnits.length === 0 && this.enemySnipers.length === 0 && this.enemyTanks.length === 0 && this.enemyPlanes.length === 0) {
            this.victory();
            return;
        }

        // Update Towers
        this.towers.forEach(t => t.update(hostileUnits));
        this.spawnTowers.forEach(t => t.update(deltaTime, this.soldiers, this.maxFriendlySoldiers));
        this.tankSpawnTowers.forEach(t => t.update(deltaTime, this.tanks));

        // Update Soldiers
        const friendlyMovers = [...this.soldiers, ...this.tanks];

        this.soldiers.forEach(s => s.update(hostileUnits, friendlyMovers, this.bunkers, this.canvas.width, this.canvas.height));
        this.soldiers = this.soldiers.filter(s => !s.markedForDeletion);

        // Update Tanks
        this.tanks.forEach(t => t.update(hostileUnits, friendlyMovers, this.canvas.width, this.canvas.height));
        for (let i = this.tanks.length - 1; i >= 0; i--) {
            const tank = this.tanks[i];
            if (tank.markedForDeletion) {
                this.tanks.splice(i, 1);
                if (tank.destroyedAsWreck) {
                    this.tankWrecks.push(new TankWreck(tank.x, tank.y));
                }
            }
        }

        // Update Planes
        this.planes.forEach(p => p.update(hostileUnits, this.canvas.width, this.canvas.height));
        this.planes = this.planes.filter(p => !p.markedForDeletion);

        // Update Naval Units
        this.submarines.forEach(submarine => submarine.update(hostileUnits, this.canvas.width, this.canvas.height));
        this.submarines = this.submarines.filter(submarine => !submarine.markedForDeletion);
        this.aircraftCarriers.forEach(carrier => carrier.update(hostileUnits, this.canvas.width, this.canvas.height));
        this.aircraftCarriers = this.aircraftCarriers.filter(carrier => !carrier.markedForDeletion);

        // Update Bulldozers
        this.bulldozers.forEach(b => {
            const repairedTank = b.update(this.radiationZones, this.tankWrecks, this.repairBases, this.canvas.width, this.canvas.height);
            if (repairedTank) {
                this.tanks.push(repairedTank);
            }
        });
        this.bulldozers = this.bulldozers.filter(b => !b.markedForDeletion);
        this.tankWrecks = this.tankWrecks.filter(wreck => !wreck.markedForDeletion);

        // Update Snipers
        this.snipers.forEach(s => s.update(hostileUnits));
        this.snipers = this.snipers.filter(s => !s.markedForDeletion);

        // Update Bunkers
        this.bunkers.forEach(b => b.update(hostileUnits, this.soldiers, deltaTime));
        this.bunkers = this.bunkers.filter(b => !b.markedForDeletion);

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

    updateOceanBattle(deltaTime) {
        this.spawnTimer += deltaTime;
        if (this.enemyResources > 0 && this.spawnTimer > 1800 && this.enemySubmarines.length < this.maxEnemySubmarines) {
            const availableSlots = this.maxEnemySubmarines - this.enemySubmarines.length;
            const scaledSpawnCount = Math.max(1, Math.ceil((this.spawnIntensityLevel * this.enemyStrengthMultiplier) / 1.5));
            const spawnCount = Math.min(scaledSpawnCount, availableSlots);

            for (let i = 0; i < spawnCount; i++) {
                this.enemySubmarines.push(new EnemySubmarine(this.canvas.width, this.canvas.height));
            }
            this.spawnTimer = 0;
        }

        this.enemyAircraftCarrierTimer += deltaTime;
        const carrierInterval = Math.max(7000, 15000 - ((this.spawnIntensityLevel - 1) * 400));
        if (this.enemyResources > 0 && this.enemyAircraftCarrierTimer >= carrierInterval && this.enemyAircraftCarriers.length < this.maxEnemyAircraftCarriers) {
            this.enemyAircraftCarriers.push(new EnemyAircraftCarrier(this.canvas.width, this.canvas.height));
            this.enemyAircraftCarrierTimer = 0;
        }

        const nextWave = Math.floor(this.elapsedTime / 15000) + 1;
        if (nextWave !== this.wave) {
            this.wave = nextWave;
            this.updateHUD();
        }

        const hostileUnits = [...this.enemySubmarines, ...this.enemyAircraftCarriers];
        const playerCombatUnits = [...this.submarines, ...this.aircraftCarriers];

        this.enemySubmarines.forEach(enemy => enemy.update(playerCombatUnits, this.canvas.width, this.canvas.height));
        this.enemyAircraftCarriers.forEach(enemy => enemy.update(playerCombatUnits, this.canvas.width, this.canvas.height));

        for (let i = this.enemySubmarines.length - 1; i >= 0; i--) {
            const enemy = this.enemySubmarines[i];
            if (enemy.markedForDeletion) {
                this.enemySubmarines.splice(i, 1);
                this.score += 18;
                this.gold += 18;
                this.updateHUD();
            }
        }

        for (let i = this.enemyAircraftCarriers.length - 1; i >= 0; i--) {
            const enemy = this.enemyAircraftCarriers[i];
            if (enemy.markedForDeletion) {
                this.enemyAircraftCarriers.splice(i, 1);
                this.score += 35;
                this.gold += 35;
                this.updateHUD();
            }
        }

        if (!this.enemyDefeated && this.enemyResources <= 0 && this.enemySubmarines.length === 0 && this.enemyAircraftCarriers.length === 0) {
            this.victory();
            return;
        }

        this.submarines.forEach(submarine => submarine.update(hostileUnits, this.canvas.width, this.canvas.height));
        this.submarines = this.submarines.filter(submarine => !submarine.markedForDeletion);
        this.aircraftCarriers.forEach(carrier => carrier.update(hostileUnits, this.canvas.width, this.canvas.height));
        this.aircraftCarriers = this.aircraftCarriers.filter(carrier => !carrier.markedForDeletion);
    }

    draw() {
        this.drawBattlefieldBackground();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawCustomMapObjects(this.ctx);

        this.enemies.forEach(e => e.draw(this.ctx));
        this.enemyArtilleryUnits.forEach(e => e.draw(this.ctx));
        this.enemySnipers.forEach(e => e.draw(this.ctx));
        this.enemyTanks.forEach(e => e.draw(this.ctx));
        this.enemyPlanes.forEach(e => e.draw(this.ctx));
        this.enemySubmarines.forEach(e => e.draw(this.ctx));
        this.enemyAircraftCarriers.forEach(e => e.draw(this.ctx));
        this.radiationZones.forEach(zone => this.drawRadiationZone(zone));
        this.supplyCrates.forEach(crate => crate.draw(this.ctx));
        this.towers.forEach(t => t.draw(this.ctx));
        this.spawnTowers.forEach(t => t.draw(this.ctx));
        this.tankSpawnTowers.forEach(t => t.draw(this.ctx));
        this.barbedWires.forEach(w => w.draw(this.ctx));
        this.enemyBarbedWires.forEach(w => w.draw(this.ctx));
        this.trenches.forEach(t => t.draw(this.ctx));
        this.repairBases.forEach(base => base.draw(this.ctx));
        this.airports.forEach(airport => airport.draw(this.ctx));
        this.bunkers.forEach(bunker => bunker.draw(this.ctx));
        this.soldiers.forEach(s => s.draw(this.ctx));
        this.tankWrecks.forEach(wreck => wreck.draw(this.ctx));
        this.tanks.forEach(t => t.draw(this.ctx));
        this.planes.forEach(p => p.draw(this.ctx));
        this.submarines.forEach(submarine => submarine.draw(this.ctx));
        this.aircraftCarriers.forEach(carrier => carrier.draw(this.ctx));
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
        document.getElementById('enemy-resources-display').innerText = `${Math.round(this.enemyResources * 100)}%`;
    }

    loadCustomMap() {
        try {
            const raw = localStorage.getItem(this.customMapStorageKey);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                this.customMapMode = 'land';
                return parsed;
            }
            if (parsed && Array.isArray(parsed.objects)) {
                this.customMapMode = parsed.mode === 'ocean' ? 'ocean' : 'land';
                return parsed.objects;
            }
            this.customMapMode = 'land';
            return [];
        } catch {
            this.customMapMode = 'land';
            return [];
        }
    }

    saveCustomMap() {
        localStorage.setItem(this.customMapStorageKey, JSON.stringify({
            mode: this.customMapMode,
            objects: this.customMapObjects
        }));
    }

    openCustomMapEditor() {
        this.isEditingMap = true;
        this.isPlaying = false;
        this.isPaused = false;
        this.updateEditorModeUI();
        this.drawEditor();
    }

    closeCustomMapEditor() {
        this.isEditingMap = false;
    }

    setEditorTool(tool) {
        this.editorTool = tool;
        document.querySelectorAll('#custom-map-controls .unit-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById(`editor-${tool}-btn`).classList.add('selected');
    }

    setCustomMapMode(mode) {
        this.customMapMode = mode === 'ocean' ? 'ocean' : 'land';
        this.updateEditorModeUI();
        this.updateAvailableUnitsUI();
        this.drawEditor();
    }

    updateEditorModeUI() {
        const description = document.getElementById('custom-map-description');
        document.getElementById('editor-land-mode-btn').classList.toggle('selected', this.customMapMode === 'land');
        document.getElementById('editor-ocean-mode-btn').classList.toggle('selected', this.customMapMode === 'ocean');
        description.textContent = this.customMapMode === 'ocean'
            ? 'Ocean map: build sea obstacles here, then battle with submarines and aircraft carriers.'
            : 'Choose a tile and click the battlefield to build your map.';
        document.getElementById('editor-rock-btn').textContent = this.customMapMode === 'ocean' ? 'Reef' : 'Rock';
        document.getElementById('editor-wall-btn').textContent = this.customMapMode === 'ocean' ? 'Sea Wall' : 'Wall';
        document.getElementById('editor-bunker-btn').textContent = this.customMapMode === 'ocean' ? 'Port' : 'Bunker';
    }

    updateAvailableUnitsUI() {
        const buttons = document.querySelectorAll('#controls [data-map-mode]');
        buttons.forEach(button => {
            const mode = button.dataset.mapMode;
            const shouldShow = mode === this.customMapMode;
            button.classList.toggle('hidden', !shouldShow);
        });

        const selectedButton = document.getElementById(`btn-${this.selectedUnitType}`);
        if (!selectedButton || selectedButton.classList.contains('hidden')) {
            this.selectedUnitType = this.customMapMode === 'ocean' ? 'submarine' : 'tower';
        }

        document.querySelectorAll('#controls .unit-btn').forEach(btn => btn.classList.remove('selected'));
        const currentButton = document.getElementById(`btn-${this.selectedUnitType}`);
        if (currentButton && !currentButton.classList.contains('hidden')) {
            currentButton.classList.add('selected');
        }
    }

    handleMapEditorInput(x, y) {
        const snapped = this.snapMapPoint(x, y);
        const existingIndex = this.findCustomMapObjectIndex(snapped.x, snapped.y);

        if (this.editorTool === 'erase') {
            if (existingIndex >= 0) {
                this.customMapObjects.splice(existingIndex, 1);
            }
        } else if (existingIndex === -1) {
            this.customMapObjects.push({
                type: this.editorTool,
                x: snapped.x,
                y: snapped.y
            });
        } else {
            this.customMapObjects[existingIndex].type = this.editorTool;
        }

        this.drawEditor();
    }

    snapMapPoint(x, y) {
        const cell = 64;
        return {
            x: Math.round(x / cell) * cell,
            y: Math.round(y / cell) * cell
        };
    }

    findCustomMapObjectIndex(x, y) {
        return this.customMapObjects.findIndex(obj => Math.hypot(obj.x - x, obj.y - y) < 20);
    }

    isCustomMapBlockedAt(x, y) {
        return this.customMapObjects.some(obj => Math.hypot(obj.x - x, obj.y - y) < 28);
    }

    drawEditor() {
        this.drawBattlefieldBackground(true);
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < this.canvas.width; x += 64) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += 64) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        this.drawCustomMapObjects(this.ctx);

        this.ctx.fillStyle = '#d6ecff';
        this.ctx.font = '16px Segoe UI';
        this.ctx.textAlign = 'left';
        const editorText = this.customMapMode === 'ocean'
            ? 'Ocean editor: place sea tiles, save the map, then fight using submarines and aircraft carriers.'
            : 'Map editor: click to place, choose a tile above, save when done.';
        this.ctx.fillText(editorText, 18, this.canvas.height - 20);
    }

    drawCustomMapObjects(ctx) {
        this.customMapObjects.forEach(obj => this.drawCustomMapObject(ctx, obj));
    }

    drawCustomMapObject(ctx, obj) {
        if (obj.type === 'rock') {
            ctx.fillStyle = this.customMapMode === 'ocean' ? '#2b7189' : '#6c737c';
            ctx.beginPath();
            ctx.arc(obj.x, obj.y, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = this.customMapMode === 'ocean' ? '#76b9c7' : '#8d949d';
            ctx.beginPath();
            ctx.arc(obj.x - 6, obj.y - 6, 8, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        if (obj.type === 'wall') {
            ctx.fillStyle = this.customMapMode === 'ocean' ? '#456c79' : '#8a6e55';
            ctx.fillRect(obj.x - 28, obj.y - 12, 56, 24);
            ctx.strokeStyle = this.customMapMode === 'ocean' ? '#a8d8e8' : '#d3bb91';
            ctx.strokeRect(obj.x - 28, obj.y - 12, 56, 24);
            return;
        }

        if (obj.type === 'bunker') {
            ctx.fillStyle = this.customMapMode === 'ocean' ? '#486f80' : '#4f5e4e';
            ctx.fillRect(obj.x - 24, obj.y - 18, 48, 36);
            ctx.fillStyle = this.customMapMode === 'ocean' ? '#1f4352' : '#273126';
            ctx.fillRect(obj.x - 10, obj.y - 6, 20, 12);
        }
    }

    drawBattlefieldBackground(editorView = false) {
        if (this.customMapMode === 'ocean') {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, '#1e5673');
            gradient.addColorStop(1, '#0b2333');
            this.ctx.fillStyle = gradient;
            return;
        }

        this.ctx.fillStyle = editorView ? '#24303a' : '#222';
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
        document.querySelectorAll('#controls .unit-btn').forEach(btn => btn.classList.remove('selected'));
        const button = document.getElementById(`btn-${type}`);
        if (button && !button.classList.contains('hidden')) {
            button.classList.add('selected');
        }
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
        this.enemyTanks.forEach(unit => {
            unit.markedForDeletion = true;
            unit.health = 0;
        });
        this.enemyPlanes.forEach(unit => {
            unit.markedForDeletion = true;
            unit.health = 0;
        });
        this.enemySubmarines.forEach(unit => {
            unit.markedForDeletion = true;
            unit.health = 0;
        });
        this.enemyAircraftCarriers.forEach(unit => {
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
            { list: this.planes, hit: obj => this.isCircleHit(x, y, obj.x, obj.y, obj.radius) },
            { list: this.aircraftCarriers, hit: obj => obj.containsPoint(x, y) },
            { list: this.submarines, hit: obj => this.isCircleHit(x, y, obj.x, obj.y, 24) },
            { list: this.snipers, hit: obj => this.isCircleHit(x, y, obj.x, obj.y, 12) },
            { list: this.bulldozers, hit: obj => this.isRectHit(x, y, obj.x, obj.y, 44, 28) },
            { list: this.tanks, hit: obj => this.isRectHit(x, y, obj.x, obj.y, 40, 24) },
            { list: this.soldiers, hit: obj => this.isCircleHit(x, y, obj.x, obj.y, obj.radius) },
            { list: this.barbedWires, hit: obj => this.isCircleHit(x, y, obj.x, obj.y, obj.radius) },
            { list: this.trenches, hit: obj => this.isRectHit(x, y, obj.x, obj.y, obj.width, obj.height) },
            { list: this.repairBases, hit: obj => this.isRectHit(x, y, obj.x, obj.y, 40, 40) },
            { list: this.bunkers, hit: obj => this.isRectHit(x, y, obj.x, obj.y, 48, 36) },
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

    findAirportAt(x, y) {
        for (let i = this.airports.length - 1; i >= 0; i--) {
            if (this.airports[i].containsPoint(x, y)) {
                return this.airports[i];
            }
        }

        return null;
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
    const customMapBtn = document.getElementById('custom-map-btn');
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
    const editorRockBtn = document.getElementById('editor-rock-btn');
    const editorWallBtn = document.getElementById('editor-wall-btn');
    const editorBunkerBtn = document.getElementById('editor-bunker-btn');
    const editorEraseBtn = document.getElementById('editor-erase-btn');
    const editorLandModeBtn = document.getElementById('editor-land-mode-btn');
    const editorOceanModeBtn = document.getElementById('editor-ocean-mode-btn');
    const editorSaveBtn = document.getElementById('editor-save-btn');
    const editorPlayBtn = document.getElementById('editor-play-btn');
    const editorBackBtn = document.getElementById('editor-back-btn');

    Artillery.setFireSound(artillerySoundSelect.value);
    EnemyArtillery.setFireSound(artillerySoundSelect.value);

    const beginBattle = () => {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('custom-map-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('hud-actions').classList.remove('hidden');
        document.getElementById('controls').classList.remove('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('victory-screen').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('settings-screen').classList.add('hidden');
        game.mobileControlsOpen = !game.isMobileLayout();
        game.updateAvailableUnitsUI();
        game.updateMobileControlsUI();
        game.closeCustomMapEditor();
        game.start();
    };

    startBtn.addEventListener('click', () => {
        beginBattle();
    });

    customMapBtn.addEventListener('click', () => {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('custom-map-screen').classList.remove('hidden');
        game.openCustomMapEditor();
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

    editorRockBtn.addEventListener('click', () => game.setEditorTool('rock'));
    editorWallBtn.addEventListener('click', () => game.setEditorTool('wall'));
    editorBunkerBtn.addEventListener('click', () => game.setEditorTool('bunker'));
    editorEraseBtn.addEventListener('click', () => game.setEditorTool('erase'));
    editorLandModeBtn.addEventListener('click', () => game.setCustomMapMode('land'));
    editorOceanModeBtn.addEventListener('click', () => game.setCustomMapMode('ocean'));

    editorSaveBtn.addEventListener('click', () => {
        game.saveCustomMap();
        game.drawEditor();
    });

    editorPlayBtn.addEventListener('click', () => {
        game.saveCustomMap();
        beginBattle();
    });

    editorBackBtn.addEventListener('click', () => {
        game.saveCustomMap();
        game.closeCustomMapEditor();
        document.getElementById('custom-map-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
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
    document.getElementById('btn-repair-base').addEventListener('click', () => setUnitType('repair-base'));
    document.getElementById('btn-airport').addEventListener('click', () => setUnitType('airport'));
    document.getElementById('btn-bunker').addEventListener('click', () => setUnitType('bunker'));
    document.getElementById('btn-soldier').addEventListener('click', () => setUnitType('soldier'));
    document.getElementById('btn-tank').addEventListener('click', () => setUnitType('tank'));
    document.getElementById('btn-plane').addEventListener('click', () => setUnitType('plane'));
    document.getElementById('btn-submarine').addEventListener('click', () => setUnitType('submarine'));
    document.getElementById('btn-aircraft-carrier').addEventListener('click', () => setUnitType('aircraft-carrier'));
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
