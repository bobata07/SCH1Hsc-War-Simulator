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
        this.projectiles = [];
        this.shootSound = new Audio('assets/sounds/cannon-sound-effect-hd-for-videos-and-games.mp3');
    }

    update(enemies, fieldWidth, fieldHeight) {
        if (this.cooldown > 0) this.cooldown--;

        this.projectiles.forEach(projectile => projectile.update());
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);

        const attackTarget = this.findTarget(enemies, this.visionRange);
        if (attackTarget) {
            this.moveToward(attackTarget.x, attackTarget.y, this.range - 18);
        } else {
            this.x += this.moveSpeed;
        }

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

    shoot(target) {
        this.projectiles.push(new Projectile(this.x, this.y, target, 9, 28, '#c8b24d', 6));
        const shotSound = this.shootSound.cloneNode();
        shotSound.currentTime = 0;
        shotSound.play().catch(e => console.log("Audio play failed:", e));
    }

    takeDamage(amount) {
        this.health -= amount * 0.7;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            new Audio('assets/sounds/soldier_die.wav').play().catch(e => console.error("Sound error:", e));
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#556b2f';
        ctx.fillRect(this.x - 20, this.y - 12, 40, 24);
        ctx.fillStyle = '#c1b15c';
        ctx.fillRect(this.x - 5, this.y - 22, 10, 18);

        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 18, this.y - 24, 36, 4);
        ctx.fillStyle = '#7ad36b';
        ctx.fillRect(this.x - 18, this.y - 24, 36 * (this.health / this.maxHealth), 4);

        this.projectiles.forEach(projectile => projectile.draw(ctx));
    }
}
