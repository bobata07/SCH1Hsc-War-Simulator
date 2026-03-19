class Drone {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.maxHealth = 80;
        this.health = this.maxHealth;
        this.radius = 14;
        this.moveSpeed = 3.8;
        this.range = 55;
        this.visionRange = 520;
        this.cooldown = 0;
        this.fireRate = 55;
        this.markedForDeletion = false;
        this.projectiles = [];
        this.wingPhase = Math.random() * Math.PI * 2;
        this.cruiseY = y;
        this.bombSound = new Audio('assets/sounds/cannon-sound-effect-hd-for-videos-and-games.mp3');
    }

    update(enemies, fieldWidth, fieldHeight) {
        if (this.cooldown > 0) this.cooldown--;
        this.wingPhase += 0.18;

        this.projectiles.forEach(projectile => projectile.update());
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);

        const target = this.findTarget(enemies, this.visionRange);
        if (target) {
            this.flyToward(target.x, target.y - 42);

            if (this.cooldown <= 0 && this.distanceTo(target) <= this.range) {
                this.dropBomb(target);
                this.cooldown = this.fireRate;
            }
        } else {
            this.x += this.moveSpeed;
            this.y += Math.sin(this.wingPhase) * 0.9;
        }

        if (this.x > fieldWidth + this.radius) {
            this.x = -this.radius;
        }

        this.x = Math.max(this.radius, Math.min(fieldWidth - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(fieldHeight - this.radius, this.y));
    }

    findTarget(enemies, maxRange) {
        let closest = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            if (enemy.markedForDeletion) continue;

            const dist = this.distanceTo(enemy);
            if (dist < maxRange && dist < minDist) {
                minDist = dist;
                closest = enemy;
            }
        }

        return closest;
    }

    flyToward(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist === 0) return;

        this.x += (dx / dist) * this.moveSpeed;
        this.y += (dy / dist) * this.moveSpeed;
    }

    dropBomb(target) {
        this.projectiles.push(new Projectile(this.x, this.y + 8, target, 7, 45, '#2a2a2a', 6));
        const bombSound = this.bombSound.cloneNode();
        bombSound.play().catch(() => {});
    }

    distanceTo(target) {
        return Math.hypot(target.x - this.x, target.y - this.y);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            new Audio('assets/sounds/soldier_die.wav').play().catch(() => {});
        }
    }

    draw(ctx) {
        const bob = Math.sin(this.wingPhase) * 3;

        ctx.strokeStyle = '#8ea8b8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.x - 18, this.y + bob);
        ctx.lineTo(this.x + 18, this.y - bob);
        ctx.stroke();

        ctx.fillStyle = '#64717c';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1c1f23';
        ctx.fillRect(this.x - 3, this.y + 6, 6, 10);

        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 18, this.y - 18, 36, 4);
        ctx.fillStyle = '#7ad36b';
        ctx.fillRect(this.x - 18, this.y - 18, 36 * (this.health / this.maxHealth), 4);

        this.projectiles.forEach(projectile => projectile.draw(ctx));
    }
}

