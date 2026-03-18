class Enemy {
    constructor(width, height) {
        this.x = width + 30;
        this.y = 80 + Math.random() * Math.max(120, height - 160);
        this.spawnX = this.x;
        this.spawnY = this.y;
        this.moveSpeed = 1.4;
        this.range = 95;
        this.visionRange = 170;
        this.cooldown = 0;
        this.fireRate = 24;
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.radius = 15;
        this.markedForDeletion = false;
        this.reachedBase = false;
        this.color = 'red';
        this.projectiles = [];
        this.shootSound = new Audio('assets/sounds/shotgun-shot-sound-effect.mp3');
        this.walkTarget = this.createWalkTarget();
    }

    update(playerTargets, fieldWidth, fieldHeight) {
        if (this.cooldown > 0) this.cooldown--;

        this.projectiles.forEach(projectile => projectile.update());
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);

        const target = this.findTarget(playerTargets, this.visionRange);
        if (target) {
            this.moveToward(target.x, target.y, this.range - 10);
        } else {
            this.advance(fieldWidth, fieldHeight);
        }

        if (this.cooldown <= 0) {
            const shootTarget = this.findTarget(playerTargets, this.range);
            if (shootTarget) {
                this.shoot(shootTarget);
                this.cooldown = this.fireRate;
            }
        }

        if (this.x < -this.radius) {
            this.reachedBase = true;
            this.markedForDeletion = true;
        }
    }

    findTarget(soldiers, maxRange) {
        let closest = null;
        let minDist = Infinity;

        for (const soldier of soldiers) {
            const dist = Math.hypot(soldier.x - this.x, soldier.y - this.y);
            if (dist < maxRange && dist < minDist) {
                minDist = dist;
                closest = soldier;
            }
        }

        return closest;
    }

    createWalkTarget() {
        return {
            x: this.x - (80 + Math.random() * 120),
            y: this.spawnY + (Math.random() * 120 - 60)
        };
    }

    advance(fieldWidth, fieldHeight) {
        this.moveToward(this.walkTarget.x, this.walkTarget.y, 2);

        const offVerticalBounds = this.walkTarget.y < 60 || this.walkTarget.y > fieldHeight - 60;
        if (Math.hypot(this.walkTarget.x - this.x, this.walkTarget.y - this.y) < 8 || offVerticalBounds) {
            this.walkTarget = this.createWalkTarget();
            this.walkTarget.y = Math.max(60, Math.min(fieldHeight - 60, this.walkTarget.y));
        }
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

    shoot(target) {
        this.projectiles.push(new Projectile(this.x, this.y, target));
        const shotSound = this.shootSound.cloneNode();
        shotSound.currentTime = 0;
        shotSound.play().catch(e => console.log("Audio play failed:", e));
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

        this.projectiles.forEach(projectile => projectile.draw(ctx));
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            new Audio('assets/sounds/soldier_die.wav').play().catch(e => console.error("Sound error:", e));
        }
    }
}
