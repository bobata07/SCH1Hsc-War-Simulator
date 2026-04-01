class Tank {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.maxHealth = 260;
        this.health = this.maxHealth;
        this.range = 180;
        this.visionRange = 1000;
        this.cooldown = 0;
        this.fireRate = 55;
        this.moveSpeed = 1.7;
        this.radius = 16;
        this.markedForDeletion = false;
        this.destroyedAsWreck = false;
        this.projectiles = [];
        this.shootSound = new Audio('assets/sounds/artillery sounds/cannon-sound-effect-hd-for-videos-and-games.mp3');
        this.formationAngle = Math.random() * Math.PI * 2;
        this.formationDistance = 28 + Math.random() * 46;
        this.cruiseDrift = (Math.random() - 0.5) * 0.45;
    }

    update(enemies, allies, fieldWidth, fieldHeight) {
        if (this.cooldown > 0) this.cooldown--;

        this.projectiles.forEach(projectile => projectile.update());
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);

        const attackTarget = this.findTarget(enemies, this.visionRange);
        if (attackTarget) {
            const attackPoint = this.getAttackPoint(attackTarget);
            this.moveToward(attackPoint.x, attackPoint.y, this.range - 18);
        } else {
            this.x += this.moveSpeed;
            this.y += this.cruiseDrift;
        }

        this.applySeparation(allies);
        this.x = Math.max(this.radius, Math.min(fieldWidth - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(fieldHeight - this.radius, this.y));

        if (this.cooldown <= 0) {
            const shootTarget = this.findTarget(enemies, this.range);
            if (shootTarget) {
                this.shoot(shootTarget);
                this.cooldown = this.fireRate;
            }
        }
    }

    findTarget(enemies, maxRange) {
        let closest = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist < maxRange && dist < minDist) {
                minDist = dist;
                closest = enemy;
            }
        }

        return closest;
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

    getAttackPoint(target) {
        return {
            x: target.x + Math.cos(this.formationAngle) * this.formationDistance,
            y: target.y + Math.sin(this.formationAngle) * this.formationDistance
        };
    }

    applySeparation(allies) {
        let pushX = 0;
        let pushY = 0;
        let neighborCount = 0;
        const desiredSpacing = this.radius * 3.2;

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

        const separationSpeed = 0.7;
        this.x += (pushX / neighborCount) * separationSpeed;
        this.y += (pushY / neighborCount) * separationSpeed;
    }

    shoot(target) {
        this.projectiles.push(new Projectile(this.x, this.y, target, 9, 28, '#c8b24d', 6));
        const shotSound = this.shootSound.cloneNode();
        shotSound.currentTime = 0;
        shotSound.play().catch(() => {});
    }

    takeDamage(amount) {
        this.health -= amount * 0.7;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            this.destroyedAsWreck = true;
            new Audio('assets/sounds/soldier_die.wav').play().catch(() => {});
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 14, 24, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#475c28';
        ctx.beginPath();
        ctx.roundRect(this.x - 20, this.y - 12, 40, 24, 6);
        ctx.fill();

        ctx.fillStyle = '#2c361b';
        ctx.fillRect(this.x - 14, this.y + 10, 10, 4);
        ctx.fillRect(this.x + 4, this.y + 10, 10, 4);

        ctx.fillStyle = '#c1b15c';
        ctx.beginPath();
        ctx.roundRect(this.x - 7, this.y - 22, 14, 18, 5);
        ctx.fill();

        ctx.fillStyle = '#302716';
        ctx.fillRect(this.x + 5, this.y - 15, 18, 4);

        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 18, this.y - 24, 36, 4);
        ctx.fillStyle = '#7ad36b';
        ctx.fillRect(this.x - 18, this.y - 24, 36 * (this.health / this.maxHealth), 4);

        this.projectiles.forEach(projectile => projectile.draw(ctx));
    }
}
