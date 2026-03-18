# War Simulator

`War Simulator` is a browser-based battlefield defense game built with plain HTML, CSS, and JavaScript on top of an HTML5 canvas. The project started as a simple tower-defense prototype and has grown into a larger sandbox with infantry, tanks, support units, artillery, nuclear weapons, mobile controls, and enemy attrition.

## Overview

The player places defensive and offensive units on the battlefield while enemy infantry, enemy snipers, and enemy artillery continue to spawn from the right side of the map. The goal is to survive until the enemy runs out of resources and all remaining hostile units are eliminated. If too many enemies reach the base, the player loses health and the game ends.

The game has:
- Real-time canvas rendering
- Mouse and touch deployment
- Pause and settings menus
- Mobile-friendly deploy tray
- Friendly and hostile projectile combat
- Radiation, supply pickups, and support vehicles
- Endless-style pressure that later weakens as enemy resources decay

## Run The Game

This project has no build step.

1. Open [index.html](./index.html) in a browser.
2. Click `Play Game`.
3. Choose a unit from the control bar.
4. Click or tap on the battlefield to deploy it.

For the best results, use a modern Chromium-based browser or Firefox.

## Core Rules

### Win condition

The enemy has a hidden resource pool that drains over time. When it reaches zero, enemy spawning stops. Once all remaining enemy units are destroyed, the game shows `Victory`.

### Lose condition

Enemy infantry that reaches the left side of the field damages the player base. When player health reaches zero, the game shows `Game Over`.

### Gold

Gold is used to deploy units and structures. The player gains gold by:
- Killing enemy units
- Collecting supply crates

### Wave display

The game tracks elapsed time and updates the displayed wave number over time. This is mostly a pacing indicator rather than a traditional finite-wave system.

## Controls

### Desktop

- `Mouse click`: Place selected unit or interact with battlefield objects
- `ESC`: Pause / resume
- `Pause` button: Open pause menu
- `Settings` button: Open settings screen

### Mobile

- `Tap`: Place selected unit or interact
- `Deploy` button: Open or close the bottom unit tray
- Selecting a unit auto-collapses the tray so the battlefield is easier to use

### Special click actions

- Clicking one of your own deployables removes it
- Clicking a supply crate collects it
- After pressing `Launch Nuke`, the next battlefield click becomes the nuke target

## Menus And Settings

### Pause menu

The pause menu contains:
- `Resume`
- `Main Menu`
- `Settings`

### Settings

Current settings:
- `Game Speed`: `0.75x`, `1.0x`, `1.25x`, `1.5x`
- `Artillery Sound`: choose between the available artillery sound files in `assets/sounds/artillery sounds`

## Friendly Units And Structures

### Tower (50g)

Basic stationary defense tower. Attacks nearby hostile units.

### Spawn Tower (90g)

Stationary structure that spawns one soldier every second.

### Tank Tower (220g)

Stationary factory-style structure that spawns one tank every second.

### Barbed Wire (40g)

Damages enemy infantry while they are touching it.

### Trench (60g)

Area hazard that slows and damages enemy infantry.

### Soldier (30g)

Mobile infantry unit that:
- Moves toward enemies
- Fires shotgun-style projectiles
- Spreads out with allied movers instead of lining up exactly

### Tank (150g)

Heavy front-line unit with:
- Higher health
- Cannon projectiles
- Reduced incoming damage
- Movement separation from nearby friendly movers

### Bulldozer (95g)

Support vehicle that:
- Drives toward radioactive zones
- Clears radiation faster once it reaches the area
- Acts as a durable non-shooting support unit

### Sniper (80g)

Stationary long-range unit that:
- Aims before firing
- Draws a red targeting line before the shot
- Uses orange visuals

### Artillery (120g)

Stationary long-range support weapon that:
- Has larger range than snipers
- Fires instant-hit artillery shells with visible impact display
- Draws an aiming laser effect on firing
- Uses the sound selected in settings

### Drone (110g)

Flying attacker that:
- Hunts enemy units
- Flies over them
- Drops visible bomb projectiles

### Rocket Station (140g)

Automatically fires rockets at enemy artillery.

### Nuclear Launcher (400g)

Heavy support launcher:
- Place the launcher
- Press `Launch Nuke`
- Click the target point on the battlefield
- Missile travels to the destination
- Impact destroys the current enemy army and creates radiation

## Enemy Units

### Enemy Infantry

Main hostile unit. It moves from right to left, engages player units in range, and damages the base if it gets through.

### Enemy Sniper

Long-range hostile unit targeting player combat units.

### Enemy Artillery

Hostile long-range support unit with instant-hit artillery shots.

## Special Mechanics

### Radiation zones

When a nuclear missile hits:
- The impact point is marked in green
- A radiation zone appears exactly at the impact position
- The zone lasts 10 seconds
- Enemy infantry entering the area take damage over time

Bulldozers can shorten the life of these zones by driving into them.

### Supply crates

Supply crates appear periodically on the battlefield.

Rules:
- Clicking a crate grants bonus gold
- Crates expire if ignored
- At most a small number can exist at one time

### Enemy resource decay

The enemy gradually loses effective resources as the match continues. This affects:
- Infantry spawn pressure
- Enemy artillery pacing
- Enemy sniper pacing

This creates a match arc where the early and mid game are more intense, then the player can eventually break the enemy army.

### Friendly unit removal

Left-clicking one of your own battlefield objects removes it. This allows repositioning and cleanup.

### Mobile deploy tray

On smaller screens, the control bar converts into a bottom deploy tray so the battlefield remains visible.

## Audio

Audio files currently used by the game are stored under:
- [assets/sounds](./assets/sounds)
- [assets/sounds/artillery sounds](./assets/sounds/artillery%20sounds)

Examples:
- Building placement
- Shotgun fire
- Soldier death
- Artillery fire
- Nuclear launch and impact

## Project Structure

### Main files

- [index.html](./index.html): main HTML shell and menus
- [css/style.css](./css/style.css): styling, HUD, menus, mobile layout
- [js/main.js](./js/main.js): main game loop, spawning, input, HUD, state transitions

### Gameplay classes

- [js/tower.js](./js/tower.js)
- [js/spawnTower.js](./js/spawnTower.js)
- [js/tankSpawnTower.js](./js/tankSpawnTower.js)
- [js/barbedWire.js](./js/barbedWire.js)
- [js/trench.js](./js/trench.js)
- [js/soldier.js](./js/soldier.js)
- [js/tank.js](./js/tank.js)
- [js/bulldozer.js](./js/bulldozer.js)
- [js/sniper.js](./js/sniper.js)
- [js/artillery.js](./js/artillery.js)
- [js/drone.js](./js/drone.js)
- [js/rocketStation.js](./js/rocketStation.js)
- [js/nuclearLauncher.js](./js/nuclearLauncher.js)
- [js/supplyCrate.js](./js/supplyCrate.js)

### Enemy classes

- [js/enemy.js](./js/enemy.js)
- [js/enemyArtillery.js](./js/enemyArtillery.js)
- [js/enemySniper.js](./js/enemySniper.js)

### Shared systems

- [js/projectile.js](./js/projectile.js): shared projectile logic
- [js/fsm.js](./js/fsm.js): finite-state-machine base utilities
- [js/input.js](./js/input.js): keyboard input tracking

## Architecture Notes

### Rendering

The game renders everything directly to a single `<canvas>` element with a `requestAnimationFrame` loop.

### State management

Most game state lives in the `Game` class in [js/main.js](./js/main.js). This includes:
- Entity collections
- Spawn timers
- HUD values
- pause/settings/menu state
- victory and defeat transitions

### Projectiles

Most combat units use the shared `Projectile` class. Some weapons use normal travel time, while artillery uses instant-hit projectiles with temporary visual display.

### Enemy AI

The original project included finite-state-machine infrastructure. The current gameplay relies more heavily on direct movement and targeting behavior, but the FSM files remain part of the codebase.

## Known Design Characteristics

- Gold is currently very generous by default, which makes the game more of a sandbox than a tightly balanced strategy game.
- Unit counts can grow large, so some performance protections are already in place.
- The game is intended to be easy to run and easy to modify, not heavily optimized or engine-driven.

## Ideas For Future Work

- Add dedicated enemy structures
- Add minimap or battlefield zoom
- Add save/load for settings and progress
- Add better balancing for gold costs and spawn rates
- Add more distinct sounds for rockets, nukes, and drones
- Add improved particle effects for explosions and impacts

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6 class-based style)
- HTML5 Canvas
