class Submarine {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.isEnemy = options.isEnemy || false;
        this.maxHealth = 220;
        this.health = this.maxHealth;
        this.range = 240;
        this.visionRange = 620;
        this.cooldown = 0;
        this.fireRate = 48;
        this.moveSpeed = 1.9;
        this.radius = 16;
        this.markedForDeletion = false;
        this.projectiles = [];
        this.hullColor = this.isEnemy ? '#7a4d42' : '#335a70';
        this.towerColor = this.isEnemy ? '#d1a37a' : '#79b7d1';
        this.projectileColor = this.isEnemy ? '#ffb27d' : '#7dd9ff';
        this.direction = this.isEnemy ? -1 : 1;
    }

    update(enemies, fieldWidth, fieldHeight) {
        if (this.cooldown > 0) this.cooldown--;
        this.projectiles.forEach(p => p.update());
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);

        const target = this.findTarget(enemies, this.visionRange);
        if (target) {
            this.moveToward(target.x, target.y, this.range - 20);
        } else {
            this.x += this.moveSpeed * this.direction;
        }

        this.x = Math.max(this.radius, Math.min(fieldWidth - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(fieldHeight - this.radius, this.y));

        if (this.cooldown <= 0) {
            const shootTarget = this.findTarget(enemies, this.range);
            if (shootTarget) {
                this.projectiles.push(new Projectile(this.x, this.y, shootTarget, 7, 32, this.projectileColor, 5));
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

    takeDamage(amount) {
        this.health -= amount * 0.55;
        if (this.health <= 0) this.markedForDeletion = true;
    }

    containsPoint(x, y) {
        return Math.hypot(x - this.x, y - this.y) <= 24;
    }

    draw(ctx) {
        ctx.fillStyle = this.hullColor;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, 24, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.towerColor;
        ctx.fillRect(this.x - 5, this.y - 16, 10, 10);
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 18, this.y - 22, 36, 4);
        ctx.fillStyle = '#7ad36b';
        ctx.fillRect(this.x - 18, this.y - 22, 36 * (this.health / this.maxHealth), 4);
        this.projectiles.forEach(p => p.draw(ctx));
    }
}
