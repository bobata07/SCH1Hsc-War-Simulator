

class Game {
    constructor() {
        if (!window.__warSimulatorAudioPatched) {
            window.__warSimulatorAudioPatched = true;
            window.WAR_SIMULATOR_MUTED = false;
            const nativePlay = HTMLMediaElement.prototype.play;
            HTMLMediaElement.prototype.play = function (...args) {
                if (window.WAR_SIMULATOR_MUTED) {
                    return Promise.resolve();
                }
                return nativePlay.apply(this, args);
            };
        }

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.worldWidth = this.canvas.width;
        this.worldHeight = this.canvas.height;
        this.viewScale = 1;
        this.cameraX = 0;
        this.cameraY = 0;
        this.battlefieldZoom = 0.68;
        this.mobileBattlefieldZoom = 0.78;
        this.minBattlefieldZoom = 0.42;
        this.maxBattlefieldZoom = 1.08;
        this.frontLineX = 0;
        this.frontLineSegments = [];
        this.isDraggingMap = false;
        this.didDragMap = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.lastDragX = 0;
        this.lastDragY = 0;
        this.dragThreshold = 5;

        // Game State
        this.lastTime = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.baseStartingGold = 1000000;
        this.baseLives = 20;
        this.score = 0;
        this.gold = this.baseStartingGold;
        this.lives = this.baseLives;
        this.campaignLevel = 1;
        this.maxCampaignLevels = 15;
        this.pendingLevelAdvance = false;
        this.levelConfig = this.createLevelConfig(this.campaignLevel);
        this.wave = 1;
        this.gameSpeed = 1;
        this.enemyResources = 1;
        this.enemyDefeated = false;
        this.settingsOpen = false;
        this.settingsOpenedWhilePlaying = false;
        this.mobileControlsOpen = false;
        this.isEditingMap = false;
        this.customMapStorageKey = 'war-simulator-custom-map';
        this.deckStorageKey = 'war-simulator-player-deck';
        this.countryStorageKey = 'war-simulator-country-side';
        this.maxDeckSize = 6;
        this.countrySides = {
            left: { name: 'Left Country', front: 'Western front' },
            right: { name: 'Right Country', front: 'Eastern front' }
        };
        this.selectedCountrySide = this.loadCountrySide();
        this.customMapMode = 'land';
        this.editorTool = 'rock';
        this.customMapObjects = this.loadCustomMap();
        this.cardDefinitions = this.createCardDefinitions();
        this.playerDeck = this.loadDeck();

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
        this.kamikazeTrains = [];
        this.airDefenses = [];
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
        this.selectedUnitType = this.playerDeck[0] || null;
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

            const worldPoint = this.screenToWorldPoint(x, y);
            x = worldPoint.x;
            y = worldPoint.y;

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
                        this.buildSound.cloneNode().play().catch(() => {});
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

            if (!this.isPlacementAllowedAt(x, y, this.selectedUnitType)) {
                return;
            }

            const placeX = x;
            const placeY = y;

            if (this.selectedUnitType === 'tower') {
                if (this.gold >= 50) {
                    this.towers.push(new Tower(placeX, placeY));
                    this.gold -= 50;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(() => {});
                }
            } else if (this.selectedUnitType === 'spawn-tower') {
                if (this.gold >= 90) {
                    this.spawnTowers.push(new SpawnTower(placeX, placeY));
                    this.gold -= 90;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(() => {});
                }
            } else if (this.selectedUnitType === 'tank-spawn-tower') {
                if (this.gold >= 220) {
                    this.tankSpawnTowers.push(new TankSpawnTower(placeX, placeY));
                    this.gold -= 220;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(() => {});
                }
            } else if (this.selectedUnitType === 'barbed-wire') {
                if (this.gold >= 40) {
                    this.barbedWires.push(new BarbedWire(placeX, placeY));
                    this.gold -= 40;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(() => {});
                }
            } else if (this.selectedUnitType === 'trench') {
                if (this.gold >= 60) {
                    this.trenches.push(new Trench(placeX, placeY));
                    this.gold -= 60;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(() => {});
                }
            } else if (this.selectedUnitType === 'repair-base') {
                if (this.gold >= 130) {
                    this.repairBases.push(new RepairBase(placeX, placeY));
                    this.gold -= 130;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(() => {});
                }
            } else if (this.selectedUnitType === 'airport') {
                if (this.gold >= 180) {
                    this.airports.push(new Airport(placeX, placeY));
                    this.gold -= 180;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(() => {});
                }
            } else if (this.selectedUnitType === 'bunker') {
                if (this.gold >= 170) {
                    this.bunkers.push(new Bunker(placeX, placeY));
                    this.gold -= 170;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(() => {});
                }
            } else if (this.selectedUnitType === 'soldier') {
                if (this.gold >= 30 && this.soldiers.length < this.maxFriendlySoldiers) {
                    this.soldiers.push(new Soldier(placeX, placeY));
                    this.gold -= 30;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(() => {});
                }
            } else if (this.selectedUnitType === 'tank') {
                if (this.gold >= 150) {
                    this.tanks.push(new Tank(placeX, placeY));
                    this.gold -= 150;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(() => {});
                }
            } else if (this.selectedUnitType === 'submarine') {
                if (this.gold >= 140) {
                    this.submarines.push(new Submarine(placeX, placeY));
                    this.gold -= 140;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(() => {});
                }
            } else if (this.selectedUnitType === 'aircraft-carrier') {
                if (this.gold >= 260) {
                    this.aircraftCarriers.push(new AircraftCarrier(placeX, placeY));
                    this.gold -= 260;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(() => {});
                }
            } else if (this.selectedUnitType === 'bulldozer') {
                if (this.gold >= 95) {
                    this.bulldozers.push(new Bulldozer(placeX, placeY));
                    this.gold -= 95;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(() => {});
                }
            } else if (this.selectedUnitType === 'sniper') {
                if (this.gold >= 80) {
                    this.snipers.push(new Sniper(placeX, placeY));
                    this.gold -= 80;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(() => {});
                }
            } else if (this.selectedUnitType === 'artillery') {
                if (this.gold >= 120) {
                    this.artilleryUnits.push(new Artillery(placeX, placeY));
                    this.gold -= 120;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(() => {});
                }
            } else if (this.selectedUnitType === 'drone') {
                if (this.gold >= 110) {
                    this.drones.push(new Drone(placeX, placeY));
                    this.gold -= 110;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(() => {});
                }
            } else if (this.selectedUnitType === 'kamikaze-train') {
                if (this.gold >= 210) {
                    this.kamikazeTrains.push(new KamikazeTrain(placeX, placeY));
                    this.gold -= 210;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(() => {});
                }
            } else if (this.selectedUnitType === 'air-defense') {
                if (this.gold >= 190) {
                    this.airDefenses.push(new AirDefense(placeX, placeY));
                    this.gold -= 190;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(() => {});
                }
            } else if (this.selectedUnitType === 'rocket-station') {
                if (this.gold >= 140) {
                    this.rocketStations.push(new RocketStation(placeX, placeY));
                    this.gold -= 140;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(() => {});
                }
            } else if (this.selectedUnitType === 'nuclear-launcher') {
                if (this.gold >= 400) {
                    this.nuclearLaunchers.push(new NuclearLauncher(placeX, placeY));
                    this.gold -= 400;
                    this.updateHUD();
                    this.buildSound.cloneNode().play().catch(() => {});
                }
            }
        };

        this.canvas.addEventListener('mousedown', (e) => {
            if (this.canDragBattlefield(e.button)) {
                e.preventDefault();
                this.beginMapDrag(e.clientX, e.clientY);
                return;
            }

            handleInput(e.clientX, e.clientY, e.button);
        });

        window.addEventListener('mousemove', (e) => {
            this.updateMapDrag(e.clientX, e.clientY);
        });

        window.addEventListener('mouseup', (e) => {
            const dragResult = this.endMapDrag(e.clientX, e.clientY, e.button);
            if (dragResult === 'click') {
                handleInput(e.clientX, e.clientY, 0);
                return;
            }
            if (dragResult) return;
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Stop scrolling
            const touch = e.changedTouches[0];
            handleInput(touch.clientX, touch.clientY, 0);
        }, { passive: false });
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.adjustBattlefieldZoom(e.deltaY, e.clientX, e.clientY);
        }, { passive: false });

        // Resize logic

        // Resize logic
        window.addEventListener('resize', () => this.resize());
        this.resize();
        window.addEventListener('blur', () => {
            if (this.isPlaying && !this.isPaused) {
                this.isPaused = true;
                document.getElementById('pause-screen').classList.remove('hidden');
                this.showEventBanner('Paused because the window lost focus.');
            }
        });
        window.addEventListener('focus', () => {
            if (this.isPlaying) {
                this.showEventBanner('Window focus restored.');
            }
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isPlaying && !this.isPaused) {
                this.isPaused = true;
                document.getElementById('pause-screen').classList.remove('hidden');
                this.showEventBanner('Paused because the tab was hidden.');
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.settingsOpen) {
                this.closeSettings();
            } else if (e.key === 'Escape' && this.isPlaying) {
                this.togglePause();
            } else if ((e.key === 'm' || e.key === 'M') && !this.settingsOpen) {
                this.toggleMute();
            }
        });

        // Bind rendering
        this.loop = this.loop.bind(this);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.updateBattlefieldMetrics();
        if (this.isEditingMap) {
            this.drawEditor();
        }
    }

    updateBattlefieldMetrics() {
        const zoom = this.isPlaying && !this.isEditingMap
            ? (this.isMobileLayout() ? this.mobileBattlefieldZoom : this.battlefieldZoom)
            : 1;

        this.viewScale = zoom;
        this.worldWidth = this.isPlaying && !this.isEditingMap
            ? this.canvas.width / this.minBattlefieldZoom
            : this.canvas.width;
        this.worldHeight = this.isPlaying && !this.isEditingMap
            ? this.canvas.height / this.minBattlefieldZoom
            : this.canvas.height;
        this.clampCamera();
    }

    getBattlefieldWidth() {
        return this.worldWidth || this.canvas.width;
    }

    getBattlefieldHeight() {
        return this.worldHeight || this.canvas.height;
    }

    screenToWorldPoint(x, y) {
        return {
            x: (x / this.viewScale) + this.cameraX,
            y: (y / this.viewScale) + this.cameraY
        };
    }

    canDragBattlefield(button) {
        return button === 0 && this.isPlaying && !this.isPaused && !this.isEditingMap;
    }

    beginMapDrag(x, y) {
        this.isDraggingMap = true;
        this.didDragMap = false;
        this.dragStartX = x;
        this.dragStartY = y;
        this.lastDragX = x;
        this.lastDragY = y;
        this.canvas.style.cursor = 'grabbing';
    }

    updateMapDrag(x, y) {
        if (!this.isDraggingMap) return;

        const totalDx = x - this.dragStartX;
        const totalDy = y - this.dragStartY;
        const movedFarEnough = Math.hypot(totalDx, totalDy) >= this.dragThreshold;

        if (!this.didDragMap && !movedFarEnough) return;

        const dx = this.didDragMap ? x - this.lastDragX : totalDx;
        const dy = this.didDragMap ? y - this.lastDragY : totalDy;
        this.didDragMap = true;
        this.lastDragX = x;
        this.lastDragY = y;
        this.cameraX -= dx / this.viewScale;
        this.cameraY -= dy / this.viewScale;
        this.clampCamera();
    }

    endMapDrag(x, y, button) {
        if (!this.isDraggingMap || button !== 0) return false;

        const didDrag = this.didDragMap;
        this.isDraggingMap = false;
        this.didDragMap = false;
        this.canvas.style.cursor = '';

        return didDrag ? true : 'click';
    }

    getVisibleWorldWidth() {
        return this.canvas.width / this.viewScale;
    }

    getVisibleWorldHeight() {
        return this.canvas.height / this.viewScale;
    }

    clampCamera() {
        const maxCameraX = Math.max(0, this.getBattlefieldWidth() - this.getVisibleWorldWidth());
        const maxCameraY = Math.max(0, this.getBattlefieldHeight() - this.getVisibleWorldHeight());
        this.cameraX = Math.max(0, Math.min(maxCameraX, this.cameraX));
        this.cameraY = Math.max(0, Math.min(maxCameraY, this.cameraY));
    }

    adjustBattlefieldZoom(deltaY, screenX = this.canvas.width / 2, screenY = this.canvas.height / 2) {
        if (!this.isPlaying || this.isEditingMap) return;

        const worldAnchor = this.screenToWorldPoint(screenX, screenY);
        const zoomDelta = deltaY > 0 ? -0.06 : 0.06;
        const currentZoom = this.isMobileLayout() ? this.mobileBattlefieldZoom : this.battlefieldZoom;
        const nextZoom = Math.max(this.minBattlefieldZoom, Math.min(this.maxBattlefieldZoom, currentZoom + zoomDelta));

        if (nextZoom === currentZoom) return;

        if (this.isMobileLayout()) {
            this.mobileBattlefieldZoom = nextZoom;
        } else {
            this.battlefieldZoom = nextZoom;
        }

        this.updateBattlefieldMetrics();
        this.cameraX = worldAnchor.x - (screenX / this.viewScale);
        this.cameraY = worldAnchor.y - (screenY / this.viewScale);
        this.clampCamera();
        this.frontLineSegments = [];
    }

    start() {
        this.isPlaying = true;
        this.updateBattlefieldMetrics();
        this.applyLevelConfig();
        this.resetBattleState();
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
        const country = this.getSelectedCountry();
        this.dispatchGameEvent('gameStart', {
            mapMode: this.customMapMode,
            level: this.campaignLevel,
            countrySide: this.selectedCountrySide,
            countryName: country.name
        });
        this.showEventBanner(`Level ${this.campaignLevel}/${this.maxCampaignLevels}: ${country.name} on ${this.customMapMode} map.`);
        requestAnimationFrame(this.loop);
    }

    resetBattleState() {
        this.gold = this.baseStartingGold;
        this.lives = this.baseLives;
        this.wave = 1;
        this.awaitingNukeTarget = false;
        this.updateNukeButton();
        this.cameraX = 0;
        this.cameraY = 0;
        this.frontLineX = 0;
        this.frontLineSegments = [];

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
        this.kamikazeTrains = [];
        this.airDefenses = [];
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
        const fieldWidth = this.getBattlefieldWidth();
        const fieldHeight = this.getBattlefieldHeight();
        this.elapsedTime += deltaTime;
        this.spawnIntensityLevel = Math.floor(this.elapsedTime / 10000) + 1 + this.levelConfig.spawnIntensityBonus;
        this.enemyResources = Math.max(0, 1 - (this.elapsedTime / this.levelConfig.levelDurationMs));
        this.enemyStrengthMultiplier = Math.max(this.levelConfig.enemyStrengthFloor, this.enemyResources);

        if (this.customMapMode === 'ocean') {
            this.updateOceanBattle(deltaTime);
            return;
        }

        // Continuous enemy soldier spawning
        this.spawnTimer += deltaTime;
        if (this.enemyResources > 0 && this.spawnTimer > this.levelConfig.landSpawnInterval && this.enemies.length < this.maxEnemySoldiers) {
            const availableSlots = this.maxEnemySoldiers - this.enemies.length;
            const scaledSpawnCount = Math.max(1, Math.ceil(this.spawnIntensityLevel * this.enemyStrengthMultiplier));
            const spawnCount = Math.min(scaledSpawnCount, availableSlots);

            for (let i = 0; i < spawnCount; i++) {
                this.enemies.push(this.configureEnemyUnit(new Enemy(fieldWidth, fieldHeight)));
            }
            this.spawnTimer = 0;
        }

        this.enemyArtilleryTimer += deltaTime;
        const artilleryInterval = this.levelConfig.artilleryIntervalBase + ((1 - this.enemyStrengthMultiplier) * 1800);
        if (this.enemyResources > 0 && this.enemyArtilleryTimer >= artilleryInterval && this.enemyArtilleryUnits.length < this.maxEnemyArtillery) {
            this.enemyArtilleryUnits.push(this.configureEnemyUnit(new EnemyArtillery(fieldWidth, fieldHeight)));
            this.enemyArtilleryTimer = 0;
        }

        this.enemySniperTimer += deltaTime;
        const sniperInterval = Math.max(2400, (this.levelConfig.sniperIntervalBase - ((this.spawnIntensityLevel - 1) * 260)) + ((1 - this.enemyStrengthMultiplier) * 2200));
        if (this.enemyResources > 0 && this.enemySniperTimer >= sniperInterval && this.enemySnipers.length < this.maxEnemySnipers) {
            this.enemySnipers.push(this.configureEnemyUnit(new EnemySniper(fieldWidth, fieldHeight)));
            this.enemySniperTimer = 0;
        }

        this.enemyTankTimer += deltaTime;
        const tankInterval = Math.max(1800, this.levelConfig.tankIntervalBase - ((this.spawnIntensityLevel - 1) * 220));
        if (this.enemyResources > 0 && this.enemyTankTimer >= tankInterval && this.enemyTanks.length < this.maxEnemyTanks) {
            this.enemyTanks.push(this.configureEnemyUnit(new EnemyTank(fieldWidth, fieldHeight)));
            this.enemyTankTimer = 0;
        }

        this.enemyPlaneTimer += deltaTime;
        const planeInterval = Math.max(2500, this.levelConfig.planeIntervalBase - ((this.spawnIntensityLevel - 1) * 200));
        if (this.enemyResources > 0 && this.enemyPlaneTimer >= planeInterval && this.enemyPlanes.length < this.maxEnemyPlanes) {
            this.enemyPlanes.push(this.configureEnemyUnit(new EnemyPlane(fieldWidth, fieldHeight)));
            this.enemyPlaneTimer = 0;
        }

        this.enemyBarbedWireTimer += deltaTime;
        if (this.enemyResources > 0 && this.enemyBarbedWireTimer >= this.levelConfig.barbedWireInterval && this.enemyBarbedWires.length < 18 + this.campaignLevel) {
            this.enemyBarbedWires.push(new BarbedWire(
                fieldWidth * 0.58 + Math.random() * (fieldWidth * 0.28),
                80 + Math.random() * Math.max(120, fieldHeight - 160)
            ));
            this.enemyBarbedWireTimer = 0;
        }

        this.supplyCrateTimer += deltaTime;
        if (this.supplyCrateTimer >= this.levelConfig.supplyCrateInterval && this.supplyCrates.length < 1) {
            this.supplyCrates.push(new SupplyCrate(fieldWidth, fieldHeight));
            this.supplyCrateTimer = 0;
        }

        const nextWave = Math.floor(this.elapsedTime / this.levelConfig.waveIntervalMs) + 1;
        if (nextWave !== this.wave) {
            this.wave = nextWave;
            this.updateHUD();
            this.dispatchGameEvent('levelUp', { level: this.campaignLevel, wave: this.wave });
            this.showEventBanner(`Level ${this.campaignLevel}: wave ${this.wave} reached.`);
        }

        const hostileUnits = [...this.enemies, ...this.enemyArtilleryUnits, ...this.enemySnipers, ...this.enemyTanks, ...this.enemyPlanes];
        const playerCombatUnits = [...this.soldiers, ...this.tanks, ...this.planes, ...this.submarines, ...this.aircraftCarriers, ...this.bulldozers, ...this.snipers, ...this.artilleryUnits, ...this.drones, ...this.kamikazeTrains, ...this.airDefenses, ...this.rocketStations, ...this.bunkers];

        this.radiationZones.forEach(zone => {
            if (!zone.permanent) {
                zone.duration -= deltaTime;
            }
            this.enemies.forEach(enemy => {
                const dist = Math.hypot(enemy.x - zone.x, enemy.y - zone.y);
                if (dist <= zone.radius) {
                    enemy.takeDamage(zone.damagePerSecond * (deltaTime / 1000));
                }
            });
        });
        this.radiationZones = this.radiationZones.filter(zone => zone.permanent || zone.duration > 0);
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
        this.enemies.forEach(e => e.update(playerCombatUnits, fieldWidth, fieldHeight));
        this.enemyArtilleryUnits.forEach(e => e.update(playerCombatUnits));
        this.enemySnipers.forEach(e => e.update(playerCombatUnits));
        this.enemyTanks.forEach(e => e.update(playerCombatUnits, fieldWidth, fieldHeight));
        this.enemyPlanes.forEach(e => e.update(playerCombatUnits, fieldWidth, fieldHeight));

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
        this.spawnTowers.forEach(t => t.update(deltaTime, this.soldiers, this.maxFriendlySoldiers, fieldWidth, fieldHeight));
        this.tankSpawnTowers.forEach(t => t.update(deltaTime, this.tanks, fieldWidth, fieldHeight));

        // Update Soldiers
        const friendlyMovers = [...this.soldiers, ...this.tanks];

        this.soldiers.forEach(s => s.update(hostileUnits, friendlyMovers, this.bunkers, fieldWidth, fieldHeight));
        this.soldiers = this.soldiers.filter(s => !s.markedForDeletion);

        // Update Tanks
        this.tanks.forEach(t => t.update(hostileUnits, friendlyMovers, fieldWidth, fieldHeight));
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
        this.planes.forEach(p => p.update(hostileUnits, fieldWidth, fieldHeight));
        this.planes = this.planes.filter(p => !p.markedForDeletion);

        // Update Naval Units
        this.submarines.forEach(submarine => submarine.update(hostileUnits, fieldWidth, fieldHeight));
        this.submarines = this.submarines.filter(submarine => !submarine.markedForDeletion);
        this.aircraftCarriers.forEach(carrier => carrier.update(hostileUnits, fieldWidth, fieldHeight));
        this.aircraftCarriers = this.aircraftCarriers.filter(carrier => !carrier.markedForDeletion);

        // Update Bulldozers
        this.bulldozers.forEach(b => {
            const repairedTank = b.update(this.radiationZones, this.tankWrecks, this.repairBases, fieldWidth, fieldHeight);
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
        this.drones.forEach(d => d.update(hostileUnits, fieldWidth, fieldHeight));
        this.drones = this.drones.filter(d => !d.markedForDeletion);

        // Update Kamikaze Trains
        this.kamikazeTrains.forEach(train => train.update(hostileUnits, fieldWidth, fieldHeight));
        this.kamikazeTrains = this.kamikazeTrains.filter(train => !train.markedForDeletion);

        // Update Air Defenses
        this.airDefenses.forEach(defense => defense.update(hostileUnits));
        this.airDefenses = this.airDefenses.filter(defense => !defense.markedForDeletion);

        // Update Rocket Stations
        this.rocketStations.forEach(r => r.update(this.enemyArtilleryUnits));
        this.rocketStations = this.rocketStations.filter(r => !r.markedForDeletion);

        // Update Nuclear Launchers
        this.nuclearLaunchers.forEach(launcher => launcher.update((x, y) => this.detonateNuke(x, y)));
        this.nuclearLaunchers = this.nuclearLaunchers.filter(launcher => !launcher.markedForDeletion);
    }

    updateOceanBattle(deltaTime) {
        const fieldWidth = this.getBattlefieldWidth();
        const fieldHeight = this.getBattlefieldHeight();

        this.spawnTimer += deltaTime;
        if (this.enemyResources > 0 && this.spawnTimer > this.levelConfig.oceanSpawnInterval && this.enemySubmarines.length < this.maxEnemySubmarines) {
            const availableSlots = this.maxEnemySubmarines - this.enemySubmarines.length;
            const scaledSpawnCount = Math.max(1, Math.ceil((this.spawnIntensityLevel * this.enemyStrengthMultiplier) / 1.5));
            const spawnCount = Math.min(scaledSpawnCount, availableSlots);

            for (let i = 0; i < spawnCount; i++) {
                this.enemySubmarines.push(this.configureEnemyUnit(new EnemySubmarine(fieldWidth, fieldHeight)));
            }
            this.spawnTimer = 0;
        }

        this.enemyAircraftCarrierTimer += deltaTime;
        const carrierInterval = Math.max(3000, this.levelConfig.carrierIntervalBase - ((this.spawnIntensityLevel - 1) * 180));
        if (this.enemyResources > 0 && this.enemyAircraftCarrierTimer >= carrierInterval && this.enemyAircraftCarriers.length < this.maxEnemyAircraftCarriers) {
            this.enemyAircraftCarriers.push(this.configureEnemyUnit(new EnemyAircraftCarrier(fieldWidth, fieldHeight)));
            this.enemyAircraftCarrierTimer = 0;
        }

        const nextWave = Math.floor(this.elapsedTime / this.levelConfig.waveIntervalMs) + 1;
        if (nextWave !== this.wave) {
            this.wave = nextWave;
            this.updateHUD();
            this.dispatchGameEvent('levelUp', { level: this.campaignLevel, wave: this.wave, mapMode: 'ocean' });
            this.showEventBanner(`Level ${this.campaignLevel}: naval wave ${this.wave} reached.`);
        }

        const hostileUnits = [...this.enemySubmarines, ...this.enemyAircraftCarriers];
        const playerCombatUnits = [...this.submarines, ...this.aircraftCarriers];

        this.enemySubmarines.forEach(enemy => enemy.update(playerCombatUnits, fieldWidth, fieldHeight));
        this.enemyAircraftCarriers.forEach(enemy => enemy.update(playerCombatUnits, fieldWidth, fieldHeight));

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

        this.submarines.forEach(submarine => submarine.update(hostileUnits, fieldWidth, fieldHeight));
        this.submarines = this.submarines.filter(submarine => !submarine.markedForDeletion);
        this.aircraftCarriers.forEach(carrier => carrier.update(hostileUnits, fieldWidth, fieldHeight));
        this.aircraftCarriers = this.aircraftCarriers.filter(carrier => !carrier.markedForDeletion);
    }

    draw() {
        this.ctx.save();
        this.ctx.setTransform(
            this.viewScale,
            0,
            0,
            this.viewScale,
            -this.cameraX * this.viewScale,
            -this.cameraY * this.viewScale
        );
        this.drawBattlefieldBackground();
        this.drawTerritoryOverlay();
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
        this.kamikazeTrains.forEach(train => train.draw(this.ctx));
        this.airDefenses.forEach(defense => defense.draw(this.ctx));
        this.rocketStations.forEach(r => r.draw(this.ctx));
        this.nuclearLaunchers.forEach(n => n.draw(this.ctx));
        this.ctx.restore();
        this.drawTerritoryStatsOverlay();
    }

    getFriendlyTerritoryUnits() {
        return [
            ...this.soldiers,
            ...this.tanks,
            ...this.planes,
            ...this.submarines,
            ...this.aircraftCarriers,
            ...this.bulldozers,
            ...this.snipers,
            ...this.artilleryUnits,
            ...this.drones,
            ...this.kamikazeTrains,
            ...this.airDefenses,
            ...this.rocketStations,
            ...this.nuclearLaunchers,
            ...this.bunkers,
            ...this.towers,
            ...this.spawnTowers,
            ...this.tankSpawnTowers
        ].filter(unit => unit && !unit.markedForDeletion);
    }

    getHostileTerritoryUnits() {
        return [
            ...this.enemies,
            ...this.enemyArtilleryUnits,
            ...this.enemySnipers,
            ...this.enemyTanks,
            ...this.enemyPlanes,
            ...this.enemySubmarines,
            ...this.enemyAircraftCarriers
        ].filter(unit => unit && !unit.markedForDeletion);
    }

    getTerritoryUnitWeight(unit) {
        const healthRatio = typeof unit.health === 'number' && typeof unit.maxHealth === 'number'
            ? Math.max(0.15, unit.health / unit.maxHealth)
            : 1;
        const durability = typeof unit.maxHealth === 'number'
            ? Math.min(2.4, Math.max(0.75, unit.maxHealth / 120))
            : 1;
        const rangeBoost = typeof unit.range === 'number' && unit.range >= 240 ? 1.2 : 1;
        return healthRatio * durability * rangeBoost;
    }

    getWeightedFrontEdge(samples, fallbackX, quantile) {
        if (!samples.length) return fallbackX;

        const sortedSamples = samples.slice().sort((a, b) => a.x - b.x);
        const totalWeight = sortedSamples.reduce((total, sample) => total + sample.weight, 0);
        const targetWeight = totalWeight * quantile;
        let runningWeight = 0;

        for (const sample of sortedSamples) {
            runningWeight += sample.weight;
            if (runningWeight >= targetWeight) {
                return sample.x;
            }
        }

        return sortedSamples[sortedSamples.length - 1].x;
    }

    getBandFrontX(y, friendlyUnits, hostileUnits) {
        const fieldWidth = this.getBattlefieldWidth();
        const fieldHeight = this.getBattlefieldHeight();
        const verticalInfluence = Math.max(110, fieldHeight * 0.18);
        const defaultFriendlyEdge = fieldWidth * (0.22 + ((1 - this.enemyResources) * 0.18));
        const defaultHostileEdge = fieldWidth * (0.82 - ((1 - this.enemyResources) * 0.22));
        let friendlyTotal = 0;
        let hostileTotal = 0;
        const friendlySamples = [];
        const hostileSamples = [];

        for (const unit of friendlyUnits) {
            const dy = Math.abs(unit.y - y);
            if (dy > verticalInfluence) continue;
            const weight = this.getTerritoryUnitWeight(unit) * (1 - (dy / verticalInfluence));
            friendlyTotal += weight;
            friendlySamples.push({ x: unit.x, weight });
        }

        for (const unit of hostileUnits) {
            const dy = Math.abs(unit.y - y);
            if (dy > verticalInfluence) continue;
            const weight = this.getTerritoryUnitWeight(unit) * (1 - (dy / verticalInfluence));
            hostileTotal += weight;
            hostileSamples.push({ x: unit.x, weight });
        }

        const friendlyEdge = this.getWeightedFrontEdge(friendlySamples, defaultFriendlyEdge, 0.78);
        const hostileEdge = this.getWeightedFrontEdge(hostileSamples, defaultHostileEdge, 0.22);
        const pressure = friendlyTotal + hostileTotal > 0
            ? (friendlyTotal - hostileTotal) / (friendlyTotal + hostileTotal)
            : 0;
        const midpoint = (friendlyEdge + hostileEdge) / 2;
        const pressureOffset = pressure * fieldWidth * 0.08;

        return Math.max(fieldWidth * 0.08, Math.min(fieldWidth * 0.92, midpoint + pressureOffset));
    }

    calculateFrontLineSegments() {
        const fieldWidth = this.getBattlefieldWidth();
        const fieldHeight = this.getBattlefieldHeight();
        const friendlyUnits = this.getFriendlyTerritoryUnits();
        const hostileUnits = this.getHostileTerritoryUnits();
        const bandCount = 12;
        const segments = [];
        let totalX = 0;

        for (let i = 0; i <= bandCount; i++) {
            const y = (i / bandCount) * fieldHeight;
            const rawX = this.getBandFrontX(y, friendlyUnits, hostileUnits);
            const previous = this.frontLineSegments[i];
            const x = previous ? previous.x + ((rawX - previous.x) * 0.18) : rawX;
            segments.push({ x, y });
            totalX += x;
        }

        this.frontLineSegments = segments;
        this.frontLineX = totalX / segments.length;

        return segments;
    }

    calculateFrontLineX() {
        if (!this.frontLineSegments.length) {
            this.calculateFrontLineSegments();
        }

        return this.frontLineX || this.getBattlefieldWidth() * 0.5;
    }

    drawTerritoryOverlay() {
        if (!this.isPlaying) return;

        const fieldWidth = this.getBattlefieldWidth();
        const fieldHeight = this.getBattlefieldHeight();
        const frontSegments = this.calculateFrontLineSegments();
        const frontX = this.frontLineX;
        const leftIsPlayer = this.selectedCountrySide === 'left';
        const leftColor = leftIsPlayer ? 'rgba(52, 138, 91, 0.22)' : 'rgba(160, 80, 67, 0.2)';
        const rightColor = leftIsPlayer ? 'rgba(160, 80, 67, 0.2)' : 'rgba(52, 138, 91, 0.22)';

        this.ctx.fillStyle = leftColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        frontSegments.forEach(point => this.ctx.lineTo(point.x, point.y));
        this.ctx.lineTo(0, fieldHeight);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = rightColor;
        this.ctx.beginPath();
        this.ctx.moveTo(fieldWidth, 0);
        this.ctx.lineTo(frontSegments[0].x, frontSegments[0].y);
        frontSegments.forEach(point => this.ctx.lineTo(point.x, point.y));
        this.ctx.lineTo(fieldWidth, fieldHeight);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.strokeStyle = 'rgba(255, 246, 174, 0.84)';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        frontSegments.forEach((point, index) => {
            const x = point.x + Math.sin((point.y / 48) + (performance.now() / 600)) * 6;
            if (index === 0) this.ctx.moveTo(x, point.y);
            else this.ctx.lineTo(x, point.y);
        });
        this.ctx.stroke();

        this.ctx.fillStyle = 'rgba(255, 246, 174, 0.9)';
        this.ctx.font = 'bold 18px Segoe UI';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('FRONT', frontX, Math.max(96, fieldHeight * 0.16));
    }

    drawTerritoryStatsOverlay() {
        if (!this.isPlaying) return;

        const leftPercent = Math.round((this.calculateFrontLineX() / this.getBattlefieldWidth()) * 100);
        const rightPercent = 100 - leftPercent;
        const x = this.canvas.width * 0.5;
        const y = this.isMobileLayout() ? 66 : 16;
        const width = Math.min(360, this.canvas.width - 28);
        const height = 40;
        const barWidth = width - 26;
        const barHeight = 12;
        const leftBarWidth = barWidth * (leftPercent / 100);

        this.ctx.fillStyle = 'rgba(5, 10, 12, 0.68)';
        this.ctx.beginPath();
        this.ctx.roundRect(x - width / 2, y, width, height, 7);
        this.ctx.fill();

        this.ctx.fillStyle = 'rgba(52, 138, 91, 0.92)';
        this.ctx.fillRect(x - barWidth / 2, y + 9, leftBarWidth, barHeight);
        this.ctx.fillStyle = 'rgba(160, 80, 67, 0.92)';
        this.ctx.fillRect(x - barWidth / 2 + leftBarWidth, y + 9, barWidth - leftBarWidth, barHeight);

        this.ctx.fillStyle = '#f2f5e8';
        this.ctx.font = '12px Segoe UI';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Left Country ${leftPercent}% | Right Country ${rightPercent}% | Zoom ${Math.round(this.viewScale * 100)}%`, x, y + 32);
    }

    createCardDefinitions() {
        return [
            { type: 'tower', title: 'Tower', cost: 50, mapModes: ['land'], summary: 'Cheap frontline turret.' },
            { type: 'spawn-tower', title: 'Spawn Tower', cost: 90, mapModes: ['land'], summary: 'Produces supporting troops.' },
            { type: 'tank-spawn-tower', title: 'Tank Tower', cost: 220, mapModes: ['land'], summary: 'Heavy armor production point.' },
            { type: 'barbed-wire', title: 'Barbed Wire', cost: 40, mapModes: ['land'], summary: 'Slows enemy pushes.' },
            { type: 'trench', title: 'Trench', cost: 60, mapModes: ['land'], summary: 'Creates infantry cover.' },
            { type: 'repair-base', title: 'Repair Base', cost: 130, mapModes: ['land'], summary: 'Restores nearby allies.' },
            { type: 'airport', title: 'Airport', cost: 180, mapModes: ['land'], summary: 'Required before planes can launch.' },
            { type: 'bunker', title: 'Bunker', cost: 170, mapModes: ['land'], summary: 'Durable defense node.' },
            { type: 'soldier', title: 'Soldier', cost: 30, mapModes: ['land'], summary: 'Low-cost infantry.' },
            { type: 'tank', title: 'Tank', cost: 150, mapModes: ['land'], summary: 'Heavy direct fire unit.' },
            { type: 'plane', title: 'Plane', cost: 160, mapModes: ['land'], summary: 'Right-click an airport to launch one.' },
            { type: 'bulldozer', title: 'Bulldozer', cost: 95, mapModes: ['land'], summary: 'Utility vehicle for the front line.' },
            { type: 'sniper', title: 'Sniper', cost: 80, mapModes: ['land'], summary: 'Long-range precision unit.' },
            { type: 'artillery', title: 'Artillery', cost: 120, mapModes: ['land'], summary: 'Ranged explosive support.' },
            { type: 'drone', title: 'Drone', cost: 110, mapModes: ['land'], summary: 'Fast airborne harassment.' },
            { type: 'kamikaze-train', title: 'Kamikaze Train', cost: 210, mapModes: ['land'], summary: 'High-risk burst attack.' },
            { type: 'air-defense', title: 'Air Defense', cost: 190, mapModes: ['land'], summary: 'Radar-guided rocket battery.' },
            { type: 'rocket-station', title: 'Rocket Station', cost: 140, mapModes: ['land'], summary: 'Unlocks rocket strikes.' },
            { type: 'nuclear-launcher', title: 'Nuclear Launcher', cost: 400, mapModes: ['land'], summary: 'Unlocks tactical nukes.' },
            { type: 'submarine', title: 'Submarine', cost: 140, mapModes: ['ocean'], summary: 'Stealth naval attacker.' },
            { type: 'aircraft-carrier', title: 'Aircraft Carrier', cost: 260, mapModes: ['ocean'], summary: 'Capital ship with planes.' }
        ];
    }

    createLevelConfig(level) {
        const levelIndex = Math.max(0, level - 1);
        const earlyEconomyBoost = level <= 3
            ? [0, 0, 180, 120][level]
            : 0;

        return {
            level,
            startingGold: Math.max(760, 1500 - (levelIndex * 55) + earlyEconomyBoost),
            lives: Math.max(8, 18 - Math.floor(levelIndex / 2)),
            levelDurationMs: Math.max(32000, 105000 - (levelIndex * 4200)),
            waveIntervalMs: Math.max(6500, 15000 - (levelIndex * 420)),
            landSpawnInterval: Math.max(320, 1250 - (levelIndex * 32)),
            oceanSpawnInterval: Math.max(700, 2100 - (levelIndex * 45)),
            artilleryIntervalBase: Math.max(650, 6200 - (levelIndex * 180)),
            sniperIntervalBase: Math.max(4200, 19500 - (levelIndex * 620)),
            tankIntervalBase: Math.max(2400, 12500 - (levelIndex * 420)),
            planeIntervalBase: Math.max(3200, 17500 - (levelIndex * 460)),
            carrierIntervalBase: Math.max(4200, 16500 - (levelIndex * 390)),
            barbedWireInterval: Math.max(5500, 10500 - (levelIndex * 180)),
            supplyCrateInterval: Math.max(22000, 17000 + (levelIndex * 1200)),
            spawnIntensityBonus: 1 + Math.floor(levelIndex / 2),
            enemyStrengthFloor: Math.min(0.92, 0.35 + (levelIndex * 0.035)),
            enemyHealthMultiplier: 1 + (levelIndex * 0.12),
            enemySpeedMultiplier: 1 + (levelIndex * 0.018),
            enemyFireRateMultiplier: Math.max(0.58, 1 - (levelIndex * 0.025)),
            maxEnemySoldiers: 45 + (level * 14),
            maxEnemyArtillery: 4 + Math.ceil(level * 1.5),
            maxEnemySnipers: 3 + Math.ceil(level * 1.1),
            maxEnemyTanks: 2 + Math.ceil(level * 1.3),
            maxEnemyPlanes: 1 + Math.ceil(level * 0.85),
            maxEnemySubmarines: 3 + Math.ceil(level * 1.35),
            maxEnemyAircraftCarriers: 1 + Math.floor(level / 3)
        };
    }

    applyLevelConfig() {
        this.levelConfig = this.createLevelConfig(this.campaignLevel);
        this.baseStartingGold = this.levelConfig.startingGold;
        this.baseLives = this.levelConfig.lives;
        this.maxEnemySoldiers = this.levelConfig.maxEnemySoldiers;
        this.maxEnemyArtillery = this.levelConfig.maxEnemyArtillery;
        this.maxEnemySnipers = this.levelConfig.maxEnemySnipers;
        this.maxEnemyTanks = this.levelConfig.maxEnemyTanks;
        this.maxEnemyPlanes = this.levelConfig.maxEnemyPlanes;
        this.maxEnemySubmarines = this.levelConfig.maxEnemySubmarines;
        this.maxEnemyAircraftCarriers = this.levelConfig.maxEnemyAircraftCarriers;
    }

    startNewCampaign() {
        this.campaignLevel = 1;
        this.score = 0;
        this.pendingLevelAdvance = false;
        this.applyLevelConfig();
    }

    advanceCampaignLevel() {
        if (this.campaignLevel >= this.maxCampaignLevels) {
            return false;
        }

        this.campaignLevel++;
        this.pendingLevelAdvance = false;
        this.applyLevelConfig();
        return true;
    }

    loadCountrySide() {
        try {
            const savedSide = localStorage.getItem(this.countryStorageKey);
            return savedSide === 'right' ? 'right' : 'left';
        } catch {
            return 'left';
        }
    }

    saveCountrySide() {
        localStorage.setItem(this.countryStorageKey, this.selectedCountrySide);
    }

    getSelectedCountry() {
        return this.countrySides[this.selectedCountrySide] || this.countrySides.left;
    }

    setCountrySide(side) {
        this.selectedCountrySide = side === 'right' ? 'right' : 'left';
        this.saveCountrySide();
        this.renderCountrySelection();
    }

    renderCountrySelection() {
        document.querySelectorAll('[data-country-side]').forEach(button => {
            button.classList.toggle('selected', button.dataset.countrySide === this.selectedCountrySide);
        });
    }

    configureEnemyUnit(unit) {
        if (!unit) return unit;

        unit.maxHealth *= this.levelConfig.enemyHealthMultiplier;
        unit.health = unit.maxHealth;

        if (typeof unit.baseMoveSpeed === 'number') {
            unit.baseMoveSpeed *= this.levelConfig.enemySpeedMultiplier;
            unit.moveSpeed = unit.baseMoveSpeed;
        } else if (typeof unit.moveSpeed === 'number') {
            unit.moveSpeed *= this.levelConfig.enemySpeedMultiplier;
        }

        if (typeof unit.fireRate === 'number') {
            unit.fireRate = Math.max(10, Math.round(unit.fireRate * this.levelConfig.enemyFireRateMultiplier));
        }

        if (typeof unit.range === 'number') {
            unit.range += (this.campaignLevel - 1) * 4;
        }

        if (typeof unit.visionRange === 'number') {
            unit.visionRange += (this.campaignLevel - 1) * 8;
        }

        return unit;
    }

    getCardDefinition(type) {
        return this.cardDefinitions.find(card => card.type === type) || null;
    }

    getDefaultDeck() {
        return ['tower', 'spawn-tower', 'soldier', 'tank', 'artillery', 'rocket-station'];
    }

    loadDeck() {
        try {
            const raw = localStorage.getItem(this.deckStorageKey);
            if (!raw) return this.getDefaultDeck();

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return this.getDefaultDeck();

            const validDeck = parsed
                .filter(type => typeof type === 'string' && this.getCardDefinition(type))
                .slice(0, this.maxDeckSize);

            return validDeck.length ? validDeck : this.getDefaultDeck();
        } catch {
            return this.getDefaultDeck();
        }
    }

    saveDeck() {
        localStorage.setItem(this.deckStorageKey, JSON.stringify(this.playerDeck));
    }

    getCardModeLabel(card) {
        if (card.mapModes.length > 1) return 'All Maps';
        return card.mapModes[0] === 'ocean' ? 'Ocean' : 'Land';
    }

    isCardCompatibleWithMode(type, mode = this.customMapMode) {
        const card = this.getCardDefinition(type);
        return Boolean(card && card.mapModes.includes(mode));
    }

    addCardToDeck(type) {
        if (!this.getCardDefinition(type) || this.playerDeck.length >= this.maxDeckSize) {
            return false;
        }

        this.playerDeck.push(type);
        this.saveDeck();
        this.renderDeckLobby();
        this.updateAvailableUnitsUI();
        return true;
    }

    removeCardFromDeck(index) {
        if (index < 0 || index >= this.playerDeck.length) {
            return false;
        }

        const [removedType] = this.playerDeck.splice(index, 1);
        if (removedType === this.selectedUnitType && !this.playerDeck.includes(removedType)) {
            this.selectedUnitType = null;
        }

        this.saveDeck();
        this.renderDeckLobby();
        this.updateAvailableUnitsUI();
        return true;
    }

    renderDeckLobby() {
        const subtitle = document.getElementById('deck-lobby-subtitle');
        const deckCount = document.getElementById('deck-count-display');
        const deckSlots = document.getElementById('deck-slots');
        const lobbyCardList = document.getElementById('lobby-card-list');
        const lobbyStartBtn = document.getElementById('lobby-start-btn');

        if (!subtitle || !deckCount || !deckSlots || !lobbyCardList || !lobbyStartBtn) {
            return;
        }

        const country = this.getSelectedCountry();
        subtitle.textContent = `Build a 6-card weapon deck for ${country.name}'s next ${this.customMapMode} battle.`;
        deckCount.textContent = `${this.playerDeck.length} / ${this.maxDeckSize}`;
        deckSlots.innerHTML = '';

        for (let i = 0; i < this.maxDeckSize; i++) {
            const type = this.playerDeck[i];
            if (!type) {
                const emptySlot = document.createElement('article');
                emptySlot.className = 'deck-slot empty';
                emptySlot.innerHTML = `<strong>Empty Slot</strong><span>Add a weapon card from the lobby list.</span>`;
                deckSlots.appendChild(emptySlot);
                continue;
            }

            const card = this.getCardDefinition(type);
            if (!card) continue;

            const slot = document.createElement('article');
            slot.className = 'deck-slot';
            slot.innerHTML = `
                <span class="map-badge">${this.getCardModeLabel(card)}</span>
                <strong>${card.title}</strong>
                <span class="card-cost">${card.cost}g</span>
                <span class="card-tag">${card.summary}</span>
                <div class="deck-slot-footer">
                    <span>Slot ${i + 1}</span>
                    <button type="button" class="mini-btn" data-remove-deck-index="${i}">Remove</button>
                </div>
            `;
            deckSlots.appendChild(slot);
        }

        lobbyCardList.innerHTML = '';
        this.cardDefinitions.forEach(card => {
            const cardEl = document.createElement('article');
            const deckIsFull = this.playerDeck.length >= this.maxDeckSize;
            cardEl.className = `lobby-card${deckIsFull ? ' disabled' : ''}`;
            cardEl.innerHTML = `
                <span class="map-badge">${this.getCardModeLabel(card)}</span>
                <strong>${card.title}</strong>
                <span class="card-cost">${card.cost}g</span>
                <span class="card-tag">${card.summary}</span>
                <div class="lobby-card-footer">
                    <span>${card.mapModes.includes(this.customMapMode) ? 'Ready on this map' : 'Not active on this map'}</span>
                    <button type="button" class="mini-btn" data-add-card="${card.type}" ${deckIsFull ? 'disabled' : ''}>Add Card</button>
                </div>
            `;
            lobbyCardList.appendChild(cardEl);
        });

        lobbyStartBtn.disabled = this.playerDeck.length !== this.maxDeckSize;
    }

    renderCombatDeck() {
        const deckControls = document.getElementById('deck-controls');
        if (!deckControls) return;

        deckControls.innerHTML = '';

        this.playerDeck.forEach((type, index) => {
            const card = this.getCardDefinition(type);
            if (!card) return;

            const compatible = this.isCardCompatibleWithMode(type);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `unit-btn card-btn${type === this.selectedUnitType && compatible ? ' selected' : ''}${compatible ? '' : ' inactive'}`;
            button.dataset.unitType = type;
            button.dataset.deckIndex = index;
            button.disabled = !compatible;
            button.innerHTML = `
                <strong>${card.title}</strong>
                <span class="card-cost">${card.cost}g</span>
                <span class="card-tag">${compatible ? card.summary : `Only available on ${this.getCardModeLabel(card).toLowerCase()} maps.`}</span>
            `;
            deckControls.appendChild(button);
        });
    }

    updateHUD() {
        document.getElementById('level-display').innerText = `${this.campaignLevel}/${this.maxCampaignLevels}`;
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
        this.updateBattlefieldMetrics();
        this.updateEditorModeUI();
        this.drawEditor();
    }

    closeCustomMapEditor() {
        this.isEditingMap = false;
        this.updateBattlefieldMetrics();
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
        const playableTypes = this.playerDeck.filter(type => this.isCardCompatibleWithMode(type));
        if (!this.selectedUnitType || !playableTypes.includes(this.selectedUnitType)) {
            this.selectedUnitType = playableTypes[0] || null;
        }

        this.renderCombatDeck();
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
        const { ctx } = this;
        const width = editorView ? this.canvas.width : this.getBattlefieldWidth();
        const height = editorView ? this.canvas.height : this.getBattlefieldHeight();

        if (this.customMapMode === 'ocean') {
            const water = ctx.createLinearGradient(0, 0, 0, height);
            water.addColorStop(0, editorView ? '#2f6178' : '#3e89a8');
            water.addColorStop(0.45, editorView ? '#1d4860' : '#205d7a');
            water.addColorStop(1, '#0b2231');
            ctx.fillStyle = water;
            ctx.fillRect(0, 0, width, height);

            const glow = ctx.createRadialGradient(width * 0.7, height * 0.18, 20, width * 0.7, height * 0.18, width * 0.45);
            glow.addColorStop(0, 'rgba(201, 240, 255, 0.24)');
            glow.addColorStop(1, 'rgba(201, 240, 255, 0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, width, height);

            ctx.strokeStyle = 'rgba(210, 244, 255, 0.12)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 7; i++) {
                const waveY = height * (0.18 + i * 0.12);
                ctx.beginPath();
                for (let x = 0; x <= width + 40; x += 40) {
                    const y = waveY + Math.sin((x / 55) + (performance.now() / 700) + i) * 5;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            return;
        }

        const sky = ctx.createLinearGradient(0, 0, 0, height);
        sky.addColorStop(0, editorView ? '#31414a' : '#60717c');
        sky.addColorStop(0.35, editorView ? '#4c565d' : '#9a916f');
        sky.addColorStop(1, editorView ? '#1b2227' : '#38382f');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, height);

        const haze = ctx.createLinearGradient(0, height * 0.22, 0, height * 0.52);
        haze.addColorStop(0, 'rgba(255, 214, 170, 0)');
        haze.addColorStop(1, editorView ? 'rgba(255,255,255,0.04)' : 'rgba(255, 214, 170, 0.16)');
        ctx.fillStyle = haze;
        ctx.fillRect(0, height * 0.18, width, height * 0.34);

        const ground = ctx.createLinearGradient(0, height * 0.3, 0, height);
        ground.addColorStop(0, editorView ? '#54625e' : '#7a7456');
        ground.addColorStop(0.45, editorView ? '#44514d' : '#535740');
        ground.addColorStop(1, editorView ? '#20292d' : '#25261f');
        ctx.fillStyle = ground;
        ctx.fillRect(0, height * 0.32, width, height * 0.68);

        ctx.fillStyle = editorView ? 'rgba(255,255,255,0.04)' : 'rgba(49, 40, 22, 0.28)';
        ctx.fillRect(0, height * 0.47, width, height * 0.09);

        ctx.strokeStyle = editorView ? 'rgba(255,255,255,0.06)' : 'rgba(255, 237, 202, 0.08)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const y = height * (0.4 + i * 0.09);
            ctx.beginPath();
            ctx.moveTo(0, y);
            for (let x = 0; x <= width + 30; x += 30) {
                ctx.lineTo(x, y + Math.sin((x / 65) + i) * 4);
            }
            ctx.stroke();
        }

        ctx.fillStyle = editorView ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.16)';
        for (let i = 0; i < 14; i++) {
            const x = (i / 13) * width;
            ctx.fillRect(x, height * 0.5 + ((i % 2) * 12), 18, 10);
        }
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
        this.pendingLevelAdvance = false;
        this.awaitingNukeTarget = false;
        this.updateNukeButton();
        this.dispatchGameEvent('gameOver', { score: this.score, result: 'defeat' });
        document.getElementById('victory-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score').innerText = `${this.score} (Level ${this.campaignLevel})`;
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
        this.awaitingNukeTarget = false;
        this.updateNukeButton();
        this.pendingLevelAdvance = this.campaignLevel < this.maxCampaignLevels;
        this.dispatchGameEvent('gameOver', { score: this.score, result: 'victory' });
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('victory-screen').classList.remove('hidden');
        document.getElementById('victory-score').innerText = this.score;
        document.getElementById('victory-title').textContent = this.pendingLevelAdvance
            ? `Level ${this.campaignLevel} Cleared`
            : 'Campaign Complete';
        document.getElementById('victory-message').textContent = this.pendingLevelAdvance
            ? `Prepare for Level ${this.campaignLevel + 1}.`
            : `You survived all ${this.maxCampaignLevels} levels.`;
        document.getElementById('victory-restart-btn').textContent = this.pendingLevelAdvance ? 'Next Level' : 'Play Again';
        document.getElementById('victory-restart-btn').classList.remove('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('hud-actions').classList.add('hidden');
        document.getElementById('mobile-controls-toggle').classList.add('hidden');
        document.getElementById('controls').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('settings-screen').classList.add('hidden');
    }

    setUnitType(type) {
        if (!this.playerDeck.includes(type) || !this.isCardCompatibleWithMode(type)) {
            return false;
        }

        this.selectedUnitType = type;
        this.renderCombatDeck();
        return true;
    }

    togglePause() {
        if (this.settingsOpen || !this.isPlaying) return;
        this.isPaused = !this.isPaused;
        document.getElementById('pause-screen').classList.toggle('hidden', !this.isPaused);
    }

    toggleMute() {
        window.WAR_SIMULATOR_MUTED = !window.WAR_SIMULATOR_MUTED;
        const muteButton = document.getElementById('mute-audio-btn');
        if (muteButton) {
            muteButton.textContent = `Mute Audio: ${window.WAR_SIMULATOR_MUTED ? 'On' : 'Off'}`;
        }
        this.showEventBanner(window.WAR_SIMULATOR_MUTED ? 'Audio muted.' : 'Audio unmuted.');
    }

    dispatchGameEvent(name, detail = {}) {
        window.dispatchEvent(new CustomEvent(name, { detail }));
    }

    showEventBanner(message) {
        const banner = document.getElementById('event-banner');
        if (!banner) return;

        banner.textContent = message;
        banner.classList.remove('hidden');
        clearTimeout(this.bannerTimeoutId);
        this.bannerTimeoutId = setTimeout(() => {
            banner.classList.add('hidden');
        }, 2200);
    }

    cycleVisibleUnitSelection(direction) {
        if (!this.isPlaying || this.isPaused) return;

        const buttons = [...document.querySelectorAll('#deck-controls .unit-btn:not(:disabled)')];
        if (!buttons.length) return;

        const currentIndex = buttons.findIndex(button => button.dataset.unitType === this.selectedUnitType);
        const nextIndex = currentIndex === -1
            ? 0
            : (currentIndex + direction + buttons.length) % buttons.length;
        const nextType = buttons[nextIndex].dataset.unitType;
        this.setUnitType(nextType);
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
        mobileToggle.textContent = this.mobileControlsOpen ? 'Hide Cards' : 'Cards';
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
        this.awaitingNukeTarget = !this.awaitingNukeTarget;
        this.updateNukeButton();
    }

    launchNukeAt(x, y) {
        if (!this.nuclearLaunchers.length) {
            this.awaitingNukeTarget = false;
            this.updateNukeButton();
            return;
        }

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

    updateNukeButton() {
        const button = document.getElementById('btn-launch-nuke');
        if (!button) return;

        button.textContent = this.awaitingNukeTarget ? 'Nukes Armed' : 'Launch Nuke';
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
            duration: Infinity,
            permanent: true,
            damagePerSecond: 38
        });
    }

    removeOwnedObjectAt(x, y) {
        const removableCollections = [
            { list: this.airDefenses, hit: obj => this.isRectHit(x, y, obj.x, obj.y, 40, 36) },
            { list: this.rocketStations, hit: obj => this.isRectHit(x, y, obj.x, obj.y, 36, 36) },
            { list: this.nuclearLaunchers, hit: obj => this.isRectHit(x, y, obj.x, obj.y, 40, 40) },
            { list: this.artilleryUnits, hit: obj => this.isRectHit(x, y, obj.x, obj.y, 32, 24) },
            { list: this.drones, hit: obj => this.isCircleHit(x, y, obj.x, obj.y, obj.radius) },
            { list: this.kamikazeTrains, hit: obj => this.isRectHit(x, y, obj.x, obj.y, obj.width, obj.height) },
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

    getPlacementRadius(type) {
        const radii = {
            tower: 18,
            'spawn-tower': 20,
            'tank-spawn-tower': 22,
            'barbed-wire': 28,
            trench: 18,
            'repair-base': 24,
            airport: 24,
            bunker: 24,
            soldier: 10,
            tank: 16,
            bulldozer: 16,
            sniper: 12,
            artillery: 18,
            drone: 14,
            'kamikaze-train': 20,
            'air-defense': 22,
            'rocket-station': 20,
            'nuclear-launcher': 22,
            submarine: 24,
            'aircraft-carrier': 30
        };

        return radii[type] || 16;
    }

    isPlacementAllowedAt(x, y, type) {
        const radius = this.getPlacementRadius(type);
        const fieldWidth = this.getBattlefieldWidth();
        const fieldHeight = this.getBattlefieldHeight();

        if (type === 'submarine' || type === 'aircraft-carrier') {
            return (
                x >= radius &&
                x <= fieldWidth - radius &&
                y >= radius &&
                y <= fieldHeight - radius
            );
        }

        const bounds = Soldier.getBattleBounds(fieldWidth, fieldHeight, radius);
        return (
            x >= radius &&
            x <= fieldWidth - radius &&
            y >= bounds.top &&
            y <= bounds.bottom
        );
    }

    collectSupplyCrateAt(x, y) {
        for (let i = this.supplyCrates.length - 1; i >= 0; i--) {
            const crate = this.supplyCrates[i];
            if (crate.containsPoint(x, y)) {
                this.gold += crate.goldValue;
                this.score += 5;
                crate.markedForDeletion = true;
                this.updateHUD();
                this.buildSound.cloneNode().play().catch(() => {});
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

    const orientationScreen = document.getElementById('orientation-screen');
    const startScreen = document.getElementById('start-screen');
    const countrySelectScreen = document.getElementById('country-select-screen');
    const deckLobbyScreen = document.getElementById('deck-lobby-screen');
    const customMapScreen = document.getElementById('custom-map-screen');
    const controls = document.getElementById('controls');
    const deckControls = document.getElementById('deck-controls');
    const deckSlots = document.getElementById('deck-slots');
    const lobbyCardList = document.getElementById('lobby-card-list');
    const lobbyStartBtn = document.getElementById('lobby-start-btn');
    const lobbyBackBtn = document.getElementById('lobby-back-btn');
    const startBtn = document.getElementById('start-btn');
    const countryBackBtn = document.getElementById('country-back-btn');
    const countryButtons = document.querySelectorAll('[data-country-side]');
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
    const muteAudioBtn = document.getElementById('mute-audio-btn');
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
    let lobbyReturnScreen = 'start';
    let pausedForPortraitMode = false;

    Artillery.setFireSound(artillerySoundSelect.value);
    EnemyArtillery.setFireSound(artillerySoundSelect.value);

    const isPortraitMobile = () => window.innerWidth <= 900 && window.innerHeight > window.innerWidth;

    const tryLockLandscape = async () => {
        if (!window.screen?.orientation?.lock || !isPortraitMobile() && window.innerWidth > 900) {
            return;
        }

        try {
            await window.screen.orientation.lock('landscape');
        } catch {
            // Some browsers only allow this in fullscreen/PWA contexts.
        }
    };

    const updateOrientationGate = () => {
        const showOrientationPrompt = isPortraitMobile();
        orientationScreen.classList.toggle('hidden', !showOrientationPrompt);

        if (showOrientationPrompt) {
            if (game.isPlaying && !game.isPaused) {
                game.isPaused = true;
                pausedForPortraitMode = true;
                document.getElementById('pause-screen').classList.add('hidden');
            }
            return;
        }

        if (pausedForPortraitMode && game.isPlaying) {
            game.isPaused = false;
            pausedForPortraitMode = false;
        }
    };

    const hideFrontScreens = () => {
        startScreen.classList.add('hidden');
        countrySelectScreen.classList.add('hidden');
        deckLobbyScreen.classList.add('hidden');
        customMapScreen.classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('victory-screen').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('settings-screen').classList.add('hidden');
    };

    const openCountrySelect = () => {
        hideFrontScreens();
        controls.classList.add('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('hud-actions').classList.add('hidden');
        document.getElementById('mobile-controls-toggle').classList.add('hidden');
        game.closeCustomMapEditor();
        game.renderCountrySelection();
        countrySelectScreen.classList.remove('hidden');
    };

    const openDeckLobby = (returnScreen = 'start') => {
        lobbyReturnScreen = returnScreen;
        hideFrontScreens();
        controls.classList.add('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('hud-actions').classList.add('hidden');
        document.getElementById('mobile-controls-toggle').classList.add('hidden');

        if (returnScreen === 'custom-map') {
            game.closeCustomMapEditor();
        }

        game.renderDeckLobby();
        deckLobbyScreen.classList.remove('hidden');
    };

    const beginBattle = (newCampaign = false) => {
        if (game.playerDeck.length !== game.maxDeckSize) {
            game.renderDeckLobby();
            return;
        }

        if (newCampaign) {
            game.startNewCampaign();
        }

        hideFrontScreens();
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('hud-actions').classList.remove('hidden');
        controls.classList.remove('hidden');
        game.mobileControlsOpen = !game.isMobileLayout();
        game.updateAvailableUnitsUI();
        game.updateMobileControlsUI();
        game.closeCustomMapEditor();
        game.start();
    };

    startBtn.addEventListener('click', async () => {
        await tryLockLandscape();
        openCountrySelect();
    });

    countryButtons.forEach(button => {
        button.addEventListener('click', () => {
            game.setCountrySide(button.dataset.countrySide);
            openDeckLobby('country-select');
        });
    });

    countryBackBtn.addEventListener('click', () => {
        countrySelectScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
    });

    customMapBtn.addEventListener('click', async () => {
        await tryLockLandscape();
        hideFrontScreens();
        customMapScreen.classList.remove('hidden');
        game.openCustomMapEditor();
    });

    restartBtn.addEventListener('click', () => {
        location.reload();
    });

    menuBtn.addEventListener('click', () => {
        location.reload();
    });

    victoryRestartBtn.addEventListener('click', () => {
        if (game.pendingLevelAdvance && game.advanceCampaignLevel()) {
            beginBattle(false);
            return;
        }

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

    muteAudioBtn.addEventListener('click', () => {
        game.toggleMute();
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

    editorPlayBtn.addEventListener('click', async () => {
        await tryLockLandscape();
        game.saveCustomMap();
        openDeckLobby('custom-map');
    });

    editorBackBtn.addEventListener('click', () => {
        game.saveCustomMap();
        game.closeCustomMapEditor();
        customMapScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
    });

    lobbyStartBtn.addEventListener('click', async () => {
        await tryLockLandscape();
        beginBattle(true);
    });

    lobbyBackBtn.addEventListener('click', () => {
        deckLobbyScreen.classList.add('hidden');

        if (lobbyReturnScreen === 'custom-map') {
            customMapScreen.classList.remove('hidden');
            game.openCustomMapEditor();
            return;
        }

        if (lobbyReturnScreen === 'country-select') {
            openCountrySelect();
            return;
        }

        startScreen.classList.remove('hidden');
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
        const didSet = game.setUnitType(type);
        if (didSet && game.isMobileLayout()) {
            game.toggleMobileControls(false);
        }
    };

    deckControls.addEventListener('click', (event) => {
        const button = event.target.closest('[data-unit-type]');
        if (!button) return;
        setUnitType(button.dataset.unitType);
    });

    lobbyCardList.addEventListener('click', (event) => {
        const button = event.target.closest('[data-add-card]');
        if (!button) return;
        game.addCardToDeck(button.dataset.addCard);
    });

    deckSlots.addEventListener('click', (event) => {
        const button = event.target.closest('[data-remove-deck-index]');
        if (!button) return;
        game.removeCardFromDeck(Number(button.dataset.removeDeckIndex));
    });

    document.getElementById('btn-launch-rockets').addEventListener('click', () => game.launchRockets());
    document.getElementById('btn-launch-nuke').addEventListener('click', () => game.armNukeLaunch());

    window.addEventListener('resize', () => {
        updateOrientationGate();
        if (!game.isPlaying) return;

        if (!game.isMobileLayout()) {
            game.mobileControlsOpen = true;
        }

        game.updateMobileControlsUI();
    });

    game.renderDeckLobby();
    game.renderCountrySelection();
    game.updateAvailableUnitsUI();
    updateOrientationGate();
});
