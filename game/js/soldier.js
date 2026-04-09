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

    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.range = 100;
        this.visionRange = 1000;
        this.cooldown = 0;
        this.fireRate = 20;
        this.moveSpeed = 2.4;
        this.color = 'green';
        this.radius = 10;
        this.markedForDeletion = false;
        this.projectiles = [];
        this.shootSound = new Audio('assets/sounds/shotgun-shot-sound-effect.mp3');
        this.formationAngle = Math.random() * Math.PI * 2;
        this.formationDistance = 18 + Math.random() * 34;
        this.cruiseDrift = (Math.random() - 0.5) * 0.8;
        this.healingInBunker = false;
    }

    update(enemies, allies, bunkers, fieldWidth, fieldHeight) {
        if (this.cooldown > 0) this.cooldown--;

        this.projectiles.forEach(p => p.update());
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);

        const bunker = this.findNearestBunker(bunkers);
        if (bunker && (this.health <= this.maxHealth * 0.45 || this.healingInBunker)) {
            this.healingInBunker = this.health < this.maxHealth * 0.95;
            this.moveToward(bunker.x, bunker.y, 4);
        } else {
            this.healingInBunker = false;
            const attackTarget = this.findTarget(enemies, this.visionRange);
            if (attackTarget) {
                const attackPoint = this.getAttackPoint(attackTarget, fieldWidth, fieldHeight);
                this.moveToward(attackPoint.x, attackPoint.y, this.range - 12);
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
        this.projectiles.push(new Projectile(this.x, this.y, target));
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
        ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 12, this.radius + 1, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#435430';
        ctx.fillRect(this.x - 6, this.y + 1, 4, 12);
        ctx.fillRect(this.x + 2, this.y + 1, 4, 12);

        ctx.fillStyle = '#4f6f3f';
        ctx.beginPath();
        ctx.roundRect(this.x - 9, this.y - 4, 18, 14, 4);
        ctx.fill();

        ctx.fillStyle = '#2e3e28';
        ctx.fillRect(this.x + 3, this.y - 1, 12, 3);

        ctx.fillStyle = '#d9c5ae';
        ctx.beginPath();
        ctx.arc(this.x, this.y - 16, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#5b7042';
        ctx.beginPath();
        ctx.arc(this.x, this.y - 18, 7, Math.PI, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
        ctx.fillRect(this.x - 15, this.y - 28, 30, 4);
        ctx.fillStyle = '#7ef17e';
        ctx.fillRect(this.x - 15, this.y - 28, 30 * (this.health / this.maxHealth), 4);

        this.projectiles.forEach(p => p.draw(ctx));
    }
}
