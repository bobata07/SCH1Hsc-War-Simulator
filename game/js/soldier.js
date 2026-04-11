class Soldier {
    static isMobileBattlefield(fieldWidth) {
        return fieldWidth <= 900;
    }

    static getBattleBounds(fieldWidth, fieldHeight, radius = 10) {
        const fallbackTop = Soldier.isMobileBattlefield(fieldWidth) ? 48 : radius;
        const fallbackBottom = Soldier.isMobileBattlefield(fieldWidth) ? fieldHeight - 132 : fieldHeight - radius;
        let top = fallbackTop;
        let bottom = fallbackBottom;

        if (typeof document !== 'undefined' && Soldier.isMobileBattlefield(fieldWidth)) {
            const hud = document.getElementById('hud');
            const controls = document.getElementById('controls');
            const toggle = document.getElementById('mobile-controls-toggle');

            if (hud && !hud.classList.contains('hidden')) {
                const hudRect = hud.getBoundingClientRect();
                top = Math.max(top, hudRect.bottom + radius);
            }

            if (controls && !controls.classList.contains('hidden') && !controls.classList.contains('mobile-collapsed')) {
                const controlsRect = controls.getBoundingClientRect();
                bottom = Math.min(bottom, controlsRect.top - radius - 6);
            } else if (toggle && !toggle.classList.contains('hidden')) {
                const toggleRect = toggle.getBoundingClientRect();
                bottom = Math.min(bottom, toggleRect.top - radius - 6);
            }
        }

        bottom = Math.max(top + radius * 2, bottom);
        return { top, bottom };
    }

    static clampPoint(x, y, fieldWidth, fieldHeight, radius = 10) {
        const bounds = Soldier.getBattleBounds(fieldWidth, fieldHeight, radius);
        return {
            x: Math.max(radius, Math.min(fieldWidth - radius, x)),
            y: Math.max(bounds.top, Math.min(bounds.bottom, y))
        };
    }

    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.maxHealth = options.maxHealth ?? 100;
        this.health = this.maxHealth;
        this.range = options.range ?? 100;
        this.visionRange = options.visionRange ?? 1000;
        this.cooldown = 0;
        this.fireRate = options.fireRate ?? 20;
        this.moveSpeed = options.moveSpeed ?? 2.4;
        this.color = options.color ?? 'green';
        this.radius = options.radius ?? 10;
        this.markedForDeletion = false;
        this.projectiles = [];
        this.shootSound = new Audio('assets/sounds/shotgun-shot-sound-effect.mp3');
        this.formationAngle = Math.random() * Math.PI * 2;
        const formationDistanceMin = options.formationDistanceMin ?? 18;
        const formationDistanceMax = options.formationDistanceMax ?? 34;
        this.formationDistance = formationDistanceMin + Math.random() * formationDistanceMax;
        this.cruiseDrift = (Math.random() - 0.5) * (options.cruiseDriftMagnitude ?? 0.8);
        this.healingInBunker = false;
        this.canUseBunkers = options.canUseBunkers ?? true;
        this.bunkerRetreatThreshold = options.bunkerRetreatThreshold ?? 0.45;
        this.bunkerExitThreshold = options.bunkerExitThreshold ?? 0.95;
        this.attackStopPadding = options.attackStopPadding ?? 12;
        this.projectileSpeed = options.projectileSpeed ?? 5;
        this.projectileDamage = options.projectileDamage ?? 10;
        this.projectileColor = options.projectileColor ?? 'yellow';
        this.projectileRadius = options.projectileRadius ?? 5;
        this.legColor = options.legColor ?? '#435430';
        this.bodyColor = options.bodyColor ?? '#4f6f3f';
        this.weaponColor = options.weaponColor ?? '#2e3e28';
        this.skinColor = options.skinColor ?? '#d9c5ae';
        this.helmetColor = options.helmetColor ?? '#5b7042';
        this.healthColor = options.healthColor ?? '#7ef17e';
        this.accentColor = options.accentColor ?? null;
        this.shadowColor = options.shadowColor ?? 'rgba(0, 0, 0, 0.24)';
    }

    update(enemies, allies, bunkers, fieldWidth, fieldHeight) {
        if (this.cooldown > 0) this.cooldown--;
        this.currentEnemies = enemies;

        this.projectiles.forEach(p => p.update());
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);

        const bunker = this.canUseBunkers ? this.findNearestBunker(bunkers) : null;
        if (bunker && (this.health <= this.maxHealth * this.bunkerRetreatThreshold || this.healingInBunker)) {
            this.healingInBunker = this.health < this.maxHealth * this.bunkerExitThreshold;
            this.moveToward(bunker.x, bunker.y, 4);
        } else {
            this.healingInBunker = false;
            const attackTarget = this.findTarget(enemies, this.visionRange);
            if (attackTarget) {
                const attackPoint = this.getAttackPoint(attackTarget, fieldWidth, fieldHeight);
                this.moveToward(attackPoint.x, attackPoint.y, this.range - this.attackStopPadding);
            } else {
                this.x += this.moveSpeed;
                this.y += this.cruiseDrift;
            }
        }

        if (!this.healingInBunker) {
            this.applySeparation(allies);
        }

        this.clampToBattlefield(fieldWidth, fieldHeight);

        if (!this.healingInBunker && this.cooldown <= 0) {
            const shootTarget = this.findTarget(enemies, this.range);
            if (shootTarget) {
                this.shoot(shootTarget);
                this.cooldown = this.fireRate;
            }
        }
    }

    findNearestBunker(bunkers) {
        let closest = null;
        let minDist = Infinity;

        for (const bunker of bunkers) {
            const dist = Math.hypot(bunker.x - this.x, bunker.y - this.y);
            if (dist < minDist) {
                minDist = dist;
                closest = bunker;
            }
        }

        return closest;
    }

    findTarget(enemies, maxRange) {
        let closest = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < maxRange && dist < minDist) {
                minDist = dist;
                closest = enemy;
            }
        }
        return closest;
    }

    shoot(target) {
        this.projectiles.push(new Projectile(
            this.x,
            this.y,
            target,
            this.projectileSpeed,
            this.projectileDamage,
            this.projectileColor,
            this.projectileRadius
        ));
        const shotSound = this.shootSound.cloneNode();
        shotSound.currentTime = 0;
        shotSound.play().catch(() => {});
    }

    getAttackPoint(target, fieldWidth = window.innerWidth, fieldHeight = window.innerHeight) {
        const bounds = this.getBattleBounds(fieldWidth, fieldHeight);
        return {
            x: target.x + Math.cos(this.formationAngle) * this.formationDistance,
            y: this.clampY(target.y + Math.sin(this.formationAngle) * this.formationDistance, bounds)
        };
    }

    applySeparation(allies) {
        let pushX = 0;
        let pushY = 0;
        let neighborCount = 0;
        const desiredSpacing = this.radius * 3;

        for (const ally of allies) {
            if (ally === this || ally.markedForDeletion) continue;

            const dx = this.x - ally.x;
            const dy = this.y - ally.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 0 && dist < desiredSpacing) {
                const strength = (desiredSpacing - dist) / desiredSpacing;
                pushX += (dx / dist) * strength;
                pushY += (dy / dist) * strength;
                neighborCount++;
            }
        }

        if (!neighborCount) return;

        const separationSpeed = 0.9;
        this.x += (pushX / neighborCount) * separationSpeed;
        this.y += (pushY / neighborCount) * separationSpeed;
    }

    moveToward(targetX, targetY, stopDistance = 0) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= stopDistance || dist === 0) return;

        const travel = Math.min(this.moveSpeed, dist - stopDistance);
        this.x += (dx / dist) * travel;
        this.y += (dy / dist) * travel;
    }

    isMobileBattlefield(fieldWidth) {
        return Soldier.isMobileBattlefield(fieldWidth);
    }

    getBattleBounds(fieldWidth, fieldHeight) {
        return Soldier.getBattleBounds(fieldWidth, fieldHeight, this.radius);
    }

    clampY(y, bounds) {
        return Math.max(bounds.top, Math.min(bounds.bottom, y));
    }

    clampToBattlefield(fieldWidth, fieldHeight) {
        const bounds = this.getBattleBounds(fieldWidth, fieldHeight);
        this.x = Math.max(this.radius, Math.min(fieldWidth - this.radius, this.x));
        this.y = this.clampY(this.y, bounds);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            new Audio('assets/sounds/soldier_die.wav').play().catch(() => {});
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.shadowColor;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 12, this.radius + 1, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.legColor;
        ctx.fillRect(this.x - 6, this.y + 1, 4, 12);
        ctx.fillRect(this.x + 2, this.y + 1, 4, 12);

        ctx.fillStyle = this.bodyColor;
        ctx.beginPath();
        ctx.roundRect(this.x - 9, this.y - 4, 18, 14, 4);
        ctx.fill();

        ctx.fillStyle = this.weaponColor;
        ctx.fillRect(this.x + 3, this.y - 1, 12, 3);

        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 16, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.helmetColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 18, 7, Math.PI, Math.PI * 2);
        ctx.fill();

        if (this.accentColor) {
            ctx.fillStyle = this.accentColor;
            ctx.beginPath();
            ctx.roundRect(this.x - 5, this.y - 3, 10, 4, 2);
            ctx.fill();
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
        ctx.fillRect(this.x - 15, this.y - 28, 30, 4);
        ctx.fillStyle = this.healthColor;
        ctx.fillRect(this.x - 15, this.y - 28, 30 * (this.health / this.maxHealth), 4);

        this.projectiles.forEach(p => p.draw(ctx));
    }
}

class EliteSoldier extends Soldier {
    constructor(x, y) {
        super(x, y, {
            maxHealth: 150,
            range: 128,
            fireRate: 11,
            moveSpeed: 3.9,
            radius: 11,
            projectileSpeed: 7,
            projectileDamage: 22,
            projectileColor: '#ffb703',
            projectileRadius: 6,
            formationDistanceMin: 10,
            formationDistanceMax: 18,
            cruiseDriftMagnitude: 0.45,
            attackStopPadding: 4,
            canUseBunkers: false,
            legColor: '#36404d',
            bodyColor: '#49586a',
            weaponColor: '#12161b',
            helmetColor: '#7d1227',
            healthColor: '#ffd166',
            accentColor: '#ffd166',
            shadowColor: 'rgba(0, 0, 0, 0.3)'
        });
    }
}

class FlameBurst extends Projectile {
    constructor(x, y, target, damage, splashTargets = []) {
        super(x, y, target, 0, damage, '#ff7f32', 7, {
            instantHit: true,
            displayFrames: 6,
            splashRadius: 42,
            splashDamage: 12,
            splashTargets
        });

        this.sourceX = x;
        this.sourceY = y;
        this.impactX = this.x;
        this.impactY = this.y;
        this.maxDisplayFrames = this.displayFrames;
    }

    draw(ctx) {
        const dx = this.impactX - this.sourceX;
        const dy = this.impactY - this.sourceY;
        const distance = Math.max(12, Math.hypot(dx, dy));
        const directionX = dx / distance;
        const directionY = dy / distance;
        const normalX = -directionY;
        const normalY = directionX;
        const pulse = (this.maxDisplayFrames - this.displayFrames) * 0.75;
        const segments = 7;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        for (let i = 0; i < segments; i++) {
            const t = i / (segments - 1);
            const wave = Math.sin((t * 7) + pulse) * (2 + (1 - t) * 2.5);
            const flameX = this.sourceX + dx * t + normalX * wave;
            const flameY = this.sourceY + dy * t + normalY * wave;
            const radius = (1 - t) * 9 + 4;

            const glow = ctx.createRadialGradient(flameX, flameY, 0, flameX, flameY, radius * 2.2);
            glow.addColorStop(0, 'rgba(255, 246, 188, 0.96)');
            glow.addColorStop(0.38, 'rgba(255, 176, 58, 0.9)');
            glow.addColorStop(0.72, 'rgba(255, 94, 32, 0.72)');
            glow.addColorStop(1, 'rgba(255, 94, 32, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(flameX, flameY, radius * 2.2, 0, Math.PI * 2);
            ctx.fill();
        }

        const tipGlow = ctx.createRadialGradient(this.impactX, this.impactY, 0, this.impactX, this.impactY, 26);
        tipGlow.addColorStop(0, 'rgba(255, 248, 210, 0.95)');
        tipGlow.addColorStop(0.28, 'rgba(255, 174, 64, 0.86)');
        tipGlow.addColorStop(0.7, 'rgba(255, 82, 24, 0.44)');
        tipGlow.addColorStop(1, 'rgba(255, 82, 24, 0)');
        ctx.fillStyle = tipGlow;
        ctx.beginPath();
        ctx.arc(this.impactX, this.impactY, 26, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class FlamethrowerSoldier extends Soldier {
    constructor(x, y) {
        super(x, y, {
            maxHealth: 115,
            range: 78,
            visionRange: 700,
            fireRate: 10,
            moveSpeed: 2.9,
            radius: 10,
            projectileSpeed: 0,
            projectileDamage: 18,
            projectileColor: '#ff7f32',
            projectileRadius: 7,
            formationDistanceMin: 8,
            formationDistanceMax: 14,
            attackStopPadding: 2,
            legColor: '#5d4330',
            bodyColor: '#b14d2e',
            weaponColor: '#3c3f45',
            helmetColor: '#6b2f1a',
            healthColor: '#ffb347',
            accentColor: '#ffd166',
            shadowColor: 'rgba(0, 0, 0, 0.28)'
        });
    }

    shoot(target) {
        this.projectiles.push(new FlameBurst(
            this.x + 8,
            this.y - 1,
            target,
            this.projectileDamage,
            this.currentEnemies || []
        ));

        const shotSound = this.shootSound.cloneNode();
        shotSound.currentTime = 0;
        shotSound.playbackRate = 1.25;
        shotSound.play().catch(() => {});
    }

    draw(ctx) {
        super.draw(ctx);

        ctx.save();
        ctx.fillStyle = 'rgba(255, 126, 49, 0.35)';
        ctx.beginPath();
        ctx.ellipse(this.x + 12, this.y - 1, 9, 4, -0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
