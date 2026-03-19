class Soldier {
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
                const attackPoint = this.getAttackPoint(attackTarget);
                this.moveToward(attackPoint.x, attackPoint.y, this.range - 12);
            } else {
                this.x += this.moveSpeed;
                this.y += this.cruiseDrift;
            }
        }

        if (!this.healingInBunker) {
            this.applySeparation(allies);
        }

        this.x = Math.max(this.radius, Math.min(fieldWidth - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(fieldHeight - this.radius, this.y));

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

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            new Audio('assets/sounds/soldier_die.wav').play().catch(() => {});
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 15, this.y - 20, 30, 4);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - 15, this.y - 20, 30 * (this.health / this.maxHealth), 4);

        this.projectiles.forEach(p => p.draw(ctx));
    }
}

